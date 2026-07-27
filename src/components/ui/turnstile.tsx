"use client";

import { useEffect, useRef } from "react";

interface TurnstileProps {
  onSuccess: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
}

export function Turnstile({ onSuccess, onError, onExpire }: TurnstileProps) {
  const ref = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | undefined>(undefined);

  useEffect(() => {
    const scriptId = "cf-turnstile-script";

    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    const checkTurnstile = setInterval(() => {
      if (window.turnstile && ref.current) {
        clearInterval(checkTurnstile);
        widgetId.current = window.turnstile.render(ref.current, {
          sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!,
          callback: (token: string) => onSuccess(token),
          "error-callback": () => onError?.(),
          "expired-callback": () => onExpire?.(),
          theme: "dark",
        });
      }
    }, 200);

    return () => {
      clearInterval(checkTurnstile);
      if (widgetId.current && window.turnstile) {
        window.turnstile.remove(widgetId.current);
      }
    };
  }, [onSuccess, onError, onExpire]);

  return <div ref={ref} />;
}
