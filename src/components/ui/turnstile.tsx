"use client";

import { useEffect, useRef, useCallback, useState } from "react";

interface TurnstileProps {
  onSuccess: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
}

let globalScriptLoaded = false;
const MAX_RETRIES = 20;

export function Turnstile({ onSuccess, onError, onExpire }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRendered = useRef(false);
  const retryCount = useRef(0);
  const pendingTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const callbacksRef = useRef({ onSuccess, onError, onExpire });
  callbacksRef.current = { onSuccess, onError, onExpire };
  const [mounted, setMounted] = useState(false);

  const renderWidget = useCallback(() => {
    if (!containerRef.current || widgetRendered.current) return;
    if (!window.turnstile) {
      if (retryCount.current < MAX_RETRIES) {
        retryCount.current++;
        pendingTimer.current = setTimeout(renderWidget, 300);
      }
      return;
    }

    widgetRendered.current = true;
    window.turnstile.render(containerRef.current, {
      sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "",
      callback: (token: string) => callbacksRef.current.onSuccess(token),
      "error-callback": () => callbacksRef.current.onError?.(),
      "expired-callback": () => callbacksRef.current.onExpire?.(),
      theme: "dark",
    });
  }, []);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;

    if (globalScriptLoaded) {
      renderWidget();
      return;
    }

    const script = document.createElement("script");
    script.id = "cf-turnstile-script";
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    script.async = true;
    script.defer = true;
    script.onload = () => { globalScriptLoaded = true; renderWidget(); };
    script.onerror = () => { globalScriptLoaded = true; };
    document.head.appendChild(script);

    return () => {
      if (pendingTimer.current) clearTimeout(pendingTimer.current);
      widgetRendered.current = false;
      retryCount.current = 0;
    };
  }, [mounted, renderWidget]);

  if (!mounted) return null;
  return <div ref={containerRef} />;
}
