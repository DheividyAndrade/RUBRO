interface TurnstileWindow {
  turnstile: {
    render: (container: HTMLElement, options: Record<string, unknown>) => string;
    remove: (widgetId: string) => void;
  };
}

declare global {
  interface Window extends TurnstileWindow {}
}

export {};
