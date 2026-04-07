import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

const ToastContext = createContext(null);

let sequence = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback((type, message) => {
    const id = sequence++;
    setToasts((current) => [...current, { id, type, message }]);
    setTimeout(() => dismiss(id), 2800);
  }, [dismiss]);

  const value = useMemo(
    () => ({
      success: (message) => push("success", message),
      error: (message) => push("error", message),
      info: (message) => push("info", message),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 grid gap-2" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex min-w-[260px] max-w-sm items-center justify-between gap-4 rounded-xl border bg-white px-4 py-3 text-sm shadow-soft animate-floatIn ${
              toast.type === "success"
                ? "border-emerald-200"
                : toast.type === "error"
                  ? "border-rose-200"
                  : "border-slate-200"
            }`}
          >
            <span className="text-slate-700">{toast.message}</span>
            <button type="button" className="text-slate-400 hover:text-slate-600" onClick={() => dismiss(toast.id)}>
              x
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside ToastProvider");
  }
  return context;
}
