"use client";

import { useEffect, useRef, useState } from "react";

interface TurnstileProps {
  onSuccess: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
}

let scriptPromise: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve) => {
    if (document.getElementById("cf-turnstile-script")) { resolve(); return; }
    const script = document.createElement("script");
    script.id = "cf-turnstile-script";
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => resolve();
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export function Turnstile({ onSuccess, onError, onExpire }: TurnstileProps) {
  const ref = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | undefined>(undefined);
  const callbacks = useRef({ onSuccess, onError, onExpire });
  callbacks.current = { onSuccess, onError, onExpire };
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadScript().then(() => {
      if (cancelled || !ref.current || widgetId.current) return;
      setReady(true);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!ready || !ref.current || widgetId.current) return;
    const key = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";
    if (!key) return;

    let tries = 0;
    const attempt = () => {
      if (!window.turnstile) {
        if (tries++ < 30) setTimeout(attempt, 100);
        return;
      }
      widgetId.current = window.turnstile.render(ref.current!, {
        sitekey: key,
        callback: (token: string) => callbacks.current.onSuccess(token),
        "error-callback": () => callbacks.current.onError?.(),
        "expired-callback": () => callbacks.current.onExpire?.(),
        theme: "dark",
      });
    };
    attempt();

    return () => {
      if (widgetId.current && window.turnstile) {
        window.turnstile.remove(widgetId.current);
        widgetId.current = undefined;
      }
    };
  }, [ready]);

  return <div ref={ref} />;
}
