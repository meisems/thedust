import { AnimatePresence, motion } from "framer-motion";
import { Monogram, ProgressBar, spring, StatusPill } from "./ui";
import { AlertIcon, CheckIcon, ExternalIcon, FlameIcon, RefreshIcon, XIcon, ZapIcon } from "./icons";
import { explorerAddress } from "../lib/chain";
import type { QueueStep, QueueSummary } from "../hooks/useSweepQueue";
import type { Destination } from "../hooks/useSweepQueue";

interface Props {
  open: boolean;
  onClose: () => void;
  steps: QueueStep[];
  progress: number;
  running: boolean;
  finished: boolean;
  summary: QueueSummary;
  destination: Destination;
  address: string | null;
  onAbort: () => void;
  onRetry: () => void;
}

/* ------------------------------------------------------------------ */
/*  live execution modal — one checklist, zero mercy                   */
/* ------------------------------------------------------------------ */
export function ExecutionModal(p: Props) {
  const done = p.steps.filter((s) => ["confirmed", "failed", "skipped"].includes(s.status)).length;
  const title = p.running ? "sweeping the floor…" : p.summary.failed > 0 ? "mostly sparkling." : "sparkling.";

  return (
    <AnimatePresence>
      {p.open && (
        <motion.div
          className="fixed inset-0 z-[110] flex items-end justify-center p-4 sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* frosted backdrop */}
          <div className="absolute inset-0" style={{ background: "var(--scrim)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }} onClick={p.running ? undefined : p.onClose} />

          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.97 }}
            transition={spring}
            className="card relative flex max-h-[86vh] w-full max-w-lg flex-col overflow-hidden rounded-[1.75rem]"
          >
            {/* header */}
            <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: "var(--line)" }}>
              <div className="flex items-center gap-3">
                <span className="squircle h-10 w-10" style={{ background: p.destination === "burn" ? "var(--coral-soft)" : "var(--acc-soft)", color: p.destination === "burn" ? "var(--coral-ink)" : "var(--acc-ink)" }}>
                  {p.destination === "burn" ? <FlameIcon size={18} /> : <ZapIcon size={18} />}
                </span>
                <div>
                  <h2 className="font-display text-lg font-bold leading-tight tracking-tight text-ink">{title}</h2>
                  <p className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-faint">
                    {done}/{p.steps.length} steps
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusPill tone={p.running ? "sky" : p.summary.failed > 0 ? "coral" : "acc"}>
                  {p.running ? "live" : p.summary.failed > 0 ? `${p.summary.failed} failed` : "done"}
                </StatusPill>
                {!p.running && (
                  <button type="button" onClick={p.onClose} aria-label="close" className="squircle h-8 w-8 text-muted transition-colors hover:bg-bg-soft hover:text-ink" style={{ borderRadius: 12 }}>
                    <XIcon size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* progress */}
            <div className="px-6 pt-4">
              <ProgressBar value={p.progress} tone={p.summary.failed > 0 && p.finished ? "var(--coral)" : "var(--acc)"} />
            </div>

            {/* steps */}
            <div className="min-h-0 flex-1 overflow-y-auto px-3.5 py-3">
              {p.steps.map((s) => (
                <StepRow key={s.id} step={s} />
              ))}
              {p.steps.length === 0 && <p className="px-3 py-6 text-center text-xs text-muted">warming up the queue…</p>}
            </div>

            {/* footer */}
            <div className="border-t px-6 py-4" style={{ borderColor: "var(--line)" }}>
              {p.running ? (
                <div className="flex items-center justify-between gap-3">
                  <p className="font-mono text-[10.5px] text-faint">one tx at a time — nonces are fragile.</p>
                  <button type="button" onClick={p.onAbort} className="chip border-transparent transition-transform hover:scale-105" style={{ background: "var(--coral-soft)", color: "var(--coral-ink)" }}>
                    abort
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-mono text-[11px] text-muted">
                    ${p.summary.usdSwept.toFixed(2)} {p.destination === "burn" ? "sent to the void" : "recovered"} · {p.summary.confirmed} confirmed
                    {p.summary.skipped > 0 ? ` · ${p.summary.skipped} skipped` : ""}
                  </p>
                  <div className="flex items-center gap-2">
                    {p.summary.failed > 0 && (
                      <motion.button
                        type="button"
                        onClick={p.onRetry}
                        whileTap={{ scale: 0.95 }}
                        className="chip border-transparent transition-transform hover:scale-105"
                        style={{ background: "var(--coral-soft)", color: "var(--coral-ink)" }}
                      >
                        <RefreshIcon size={13} /> retry {p.summary.failed} failed
                      </motion.button>
                    )}
                    <motion.button
                      type="button"
                      onClick={p.onClose}
                      whileTap={{ scale: 0.95 }}
                      className="chip border-transparent transition-transform hover:scale-105"
                      style={{ background: "var(--acc)", color: "var(--on-acc)" }}
                    >
                      <CheckIcon size={13} /> nice
                    </motion.button>
                  </div>
                </div>
              )}
              {p.finished && p.address && (
                <a
                  href={explorerAddress(p.address)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 flex items-center gap-1.5 font-mono text-[10.5px] text-faint transition-colors hover:text-ink-2"
                >
                  <ExternalIcon size={12} /> inspect wallet on blockscout
                </a>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------ */

function StepRow({ step }: { step: QueueStep }) {
  const statusChip = (() => {
    switch (step.status) {
      case "queued":
        return <StatusPill tone="muted">queued</StatusPill>;
      case "active":
        return (
          <StatusPill tone="sky">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: "var(--sky)" }} /> in wallet…
          </StatusPill>
        );
      case "submitted":
        return (
          <StatusPill tone="gold">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: "var(--gold)" }} /> confirming…
          </StatusPill>
        );
      case "confirmed":
        return (
          <StatusPill tone="acc">
            <CheckIcon size={11} /> done
          </StatusPill>
        );
      case "failed":
        return (
          <StatusPill tone="coral">
            <XIcon size={11} /> failed
          </StatusPill>
        );
      case "skipped":
        return <StatusPill tone="muted">skipped</StatusPill>;
    }
  })();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl px-2.5 py-2.5 transition-colors"
      style={{ background: step.status === "active" || step.status === "submitted" ? "var(--bg-soft)" : "transparent" }}
    >
      <div className="flex items-center gap-3">
        <Monogram symbol={step.symbol} hue={step.hue} size={32} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-semibold text-ink">{step.label}</div>
          {step.status === "failed" && step.error && (
            <div className="mt-0.5 flex items-start gap-1 text-[11px] leading-snug text-coral-ink">
              <AlertIcon size={12} className="mt-0.5 shrink-0" /> {step.error}
            </div>
          )}
        </div>
        {step.txUrl && (
          <a
            href={step.txUrl}
            target="_blank"
            rel="noreferrer"
            aria-label="view tx"
            className="squircle h-7 w-7 shrink-0 text-faint transition-colors hover:bg-bg-soft hover:text-ink"
            style={{ borderRadius: 10 }}
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalIcon size={13} />
          </a>
        )}
        {statusChip}
      </div>
    </motion.div>
  );
}
