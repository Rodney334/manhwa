"use client";

import { useToastStore } from "@/lib/stores/toast.store";
import { Check, X, Info } from "lucide-react";

const ICONS = {
  success: Check,
  error: X,
  info: Info,
};

const BORDER = {
  success: "border-l-vert",
  error: "border-l-rouge",
  info: "border-l-or",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <>
      {children}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 w-[min(360px,calc(100vw-2.5rem))]">
        {toasts.map((t) => {
          const Icon = ICONS[t.kind];
          return (
            <div
              key={t.id}
              className={`toast-anim flex items-center gap-3 rounded-xl border border-ligne ${BORDER[t.kind]} border-l-[3px] bg-sur2 px-4 py-3 text-[13.5px] text-txt shadow-[0_10px_30px_rgba(0,0,0,.4)]`}
            >
              <Icon size={16} className="shrink-0 text-vert" />
              <span className="flex-1">{t.message}</span>
              <button
                onClick={() => dismiss(t.id)}
                className="text-txt3 hover:text-txt transition-colors"
                aria-label="Fermer"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}
