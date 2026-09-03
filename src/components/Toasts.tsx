import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { CheckIcon, WarnIcon, XIcon, ZapIcon, ExtIcon } from "./icons";

export interface Toast {
  id: number;
  kind: "success" | "error" | "info";
  title: string;
  desc?: string;
  link?: { url: string; label: string };
}

interface ToastCtx {
  push: (t: Omit<Toast, "id">) => void;
}

const Ctx = createContext<ToastCtx>({ push: () => {} });
export const useToasts = () => useContext(Ctx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const push = useCallback((t: Omit<Toast, "id">) => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev.slice(-3), { ...t, id }]);
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 6500);
  }, []);

  return (
    <Ctx.Provider value={{ push }}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[90] flex w-[340px] max-w-[calc(100vw-2rem)] flex-col gap-2">
        {toasts.map((t) => {
          const tone =
            t.kind === "success" ? "border-l-hood-500 text-hood-400"
            : t.kind === "error" ? "border-l-redx-500 text-redx-400"
            : "border-l-cyanx-500 text-cyanx-400";
          return (
            <div
              key={t.id}
              className={`toast-in pointer-events-auto rounded-md border border-ink-600 border-l-[3px] bg-ink-800/95 px-3.5 py-3 shadow-[0_16px_40px_-12px_rgba(0,0,0,.8)] backdrop-blur-sm ${tone}`}
            >
              <div className="flex items-start gap-2.5">
                <span className="mt-0.5 shrink-0">
                  {t.kind === "success" ? <CheckIcon size={15} /> : t.kind === "error" ? <WarnIcon size={15} /> : <ZapIcon size={15} />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-[13px] font-semibold tracking-wide text-mist-100">{t.title}</p>
                  {t.desc && <p className="mt-0.5 break-words font-mono text-[11px] leading-snug text-mist-500">{t.desc}</p>}
                  {t.link && (
                    <a
                      href={t.link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex items-center gap-1 font-mono text-[11px] text-cyanx-400 hover:text-cyanx-500 hover:underline"
                    >
                      <ExtIcon size={11} /> {t.link.label}
                    </a>
                  )}
                </div>
                <button
                  onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
                  className="shrink-0 text-mist-600 transition-colors hover:text-mist-100"
                  aria-label="Dismiss"
                >
                  <XIcon size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </Ctx.Provider>
  );
}
