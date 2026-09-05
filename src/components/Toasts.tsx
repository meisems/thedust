import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { spring } from "./ui";
import { AlertIcon, CheckIcon, InfoIcon, XIcon } from "./icons";

/* ------------------------------------------------------------------ */
/*  toasts — soft cards, deadpan delivery                              */
/* ------------------------------------------------------------------ */

export type ToastKind = "ok" | "info" | "warn" | "err";
interface Toast {
  id: number;
  kind: ToastKind;
  title: string;
  sub?: string;
}

const ToastCtx = createContext<(kind: ToastKind, title: string, sub?: string) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

const KIND_STYLE: Record<ToastKind, { bg: string; fg: string; icon: ReactNode }> = {
  ok: { bg: "var(--acc-soft)", fg: "var(--acc-ink)", icon: <CheckIcon size={16} /> },
  info: { bg: "var(--sky-soft)", fg: "var(--sky-ink)", icon: <InfoIcon size={16} /> },
  warn: { bg: "var(--gold-soft)", fg: "var(--gold-ink)", icon: <AlertIcon size={16} /> },
  err: { bg: "var(--coral-soft)", fg: "var(--coral-ink)", icon: <XIcon size={16} /> },
};

let seq = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const push = useCallback(
    (kind: ToastKind, title: string, sub?: string) => {
      const id = ++seq;
      setToasts((t) => [...t.slice(-3), { id, kind, title, sub }]);
      window.setTimeout(() => dismiss(id), 4600);
    },
    [dismiss]
  );

  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed right-4 top-20 z-[120] flex w-[320px] max-w-[calc(100vw-2rem)] flex-col gap-2.5">
        <AnimatePresence>
          {toasts.map((t) => {
            const s = KIND_STYLE[t.kind];
            return (
              <motion.button
                key={t.id}
                type="button"
                onClick={() => dismiss(t.id)}
                layout
                initial={{ opacity: 0, x: 60, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40, scale: 0.92 }}
                transition={spring}
                className="glass card pointer-events-auto flex items-start gap-3 rounded-2xl p-3.5 text-left shadow-lg"
                style={{ borderColor: "var(--line)" }}
              >
                <span className="squircle mt-0.5 h-8 w-8 shrink-0" style={{ background: s.bg, color: s.fg }}>
                  {s.icon}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[13.5px] font-semibold text-ink">{t.title}</span>
                  {t.sub && <span className="mt-0.5 block text-xs leading-snug text-muted">{t.sub}</span>}
                </span>
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}
