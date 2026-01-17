"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

type ToastVariant = "default" | "success" | "error";

type ToastItem = {
  id: string;
  message: string;
  variant: ToastVariant;
};

type ToastOptions = {
  variant?: ToastVariant;
  durationMs?: number;
};

type ToastContextValue = {
  toast: (message: string, options?: ToastOptions) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const getToastId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `toast-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, options?: ToastOptions) => {
      const id = getToastId();
      const variant = options?.variant ?? "default";
      const durationMs = options?.durationMs ?? 3000;

      setToasts((prev) => [...prev, { id, message, variant }]);

      window.setTimeout(() => dismissToast(id), durationMs);
    },
    [dismissToast],
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-full max-w-sm flex-col gap-2">
        {toasts.map((item) => (
          <div
            key={item.id}
            className={`pointer-events-auto rounded-md border px-4 py-3 text-sm shadow ${
              item.variant === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : item.variant === "error"
                  ? "border-red-200 bg-red-50 text-red-900"
                  : "border-border bg-card text-foreground"
            }`}
          >
            {item.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider.");
  }
  return context;
}
