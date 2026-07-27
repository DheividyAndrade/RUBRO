"use client";

import { useEffect, useRef, useCallback, useState } from "react";

interface TurnstileProps {
  onSuccess: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
}

export function Turnstile({ onSuccess, onError, onExpire }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRendered = useRef(false);
  const callbacksRef = useRef({ onSuccess, onError, onExpire });
  callbacksRef.current = { onSuccess, onError, onExpire };
  const [mounted, setMounted] = useState(false);

  const renderWidget = useCallback(() => {
    if (!containerRef.current || widgetRendered.current) return;
    if (!window.turnstile) {
      setTimeout(renderWidget, 300);
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

    if (document.getElementById("cf-turnstile-script")) {
      renderWidget();
      return;
    }

    const script = document.createElement("script");
    script.id = "cf-turnstile-script";
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    script.async = true;
    script.defer = true;
    script.onload = () => renderWidget();
    document.head.appendChild(script);

    return () => {
      widgetRendered.current = false;
    };
  }, [mounted, renderWidget]);

  if (!mounted) return null;
  return <div ref={containerRef} />;
}
