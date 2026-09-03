import { useEffect } from "react";
import { fmtUsd, shortHash } from "../lib/chain";
import type { QueueStep } from "../hooks/useSweepQueue";
import { ProgressBar, TokenLogo } from "./ui";
import { CheckIcon, ExtIcon, FlameIcon, RefreshIcon, Spinner, WarnIcon, XIcon, CoinIcon, EthIcon, BroomIcon } from "./icons";

interface Props {
  open: boolean;
  mode: "demo" | "live" | null;
  steps: QueueStep[];
  running: boolean;
  finished: boolean;
  progress: number;
  destination: "sweep" | "eth" | "burn";
  summary: { confirmed: number; failed: number; usdSwept: number; failedSymbols: string[] };
  onClose: () => void;
  onAbort: () => void;
  onRetry: () => void;
}

export function ExecutionModal(p: Props) {
  useEffect(() => {
    if (!p.open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !p.running) p.onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [p.open, p.running, p.onClose]);

  if (!p.open) return null;

  const destMeta =
    p.destination === "sweep"
      ? { label: "$SWEEP", color: "text-hood-400", icon: <CoinIcon size={15} /> }
      : p.destination === "eth"
        ? { label: "ETH", color: "text-cyanx-400", icon: <EthIcon size={15} /> }
        : { label: "0x…dEaD", color: "text-redx-400", icon: <FlameIcon size={15} /> };

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-ink-950/85 p-4 backdrop-blur-sm">
      <div className="rise-in flex max-h-[88vh] w-full max-w-xl flex-col overflow-hidden rounded-xl border border-ink-600 bg-ink-800 shadow-[0_40px_100px_-20px_rgba(0,0,0,.95)]">
        {/* head */}
        <div className="border-b border-ink-600 bg-ink-850/80 px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className={destMeta.color}>{p.running ? <Spinner size={17} /> : destMeta.icon}</span>
              <h2 className="font-display text-[15px] font-bold tracking-wide text-mist-100">
                {p.running ? "Executing sweep queue" : p.finished ? "Queue complete" : "Queue"}
              </h2>
              <span className="chip text-mist-500">→ {destMeta.label}</span>
            </div>
            <div className="flex items-center gap-2">
              {p.running && (
                <button onClick={p.onAbort} className="btn-ghost px-2.5 py-1.5 text-[11px] text-amberx-400 hover:text-amberx-400">
                  ABORT
                </button>
              )}
              <button
                onClick={p.onClose}
                disabled={p.running}
                className="text-mist-600 transition-colors hover:text-mist-100 disabled:opacity-30"
                aria-label="Close"
              >
                <XIcon size={16} />
              </button>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <ProgressBar value={p.progress} tone={p.running ? "amber" : p.summary.failed > 0 ? "red" : "green"} />
            <span className="shrink-0 font-mono text-[11px] font-semibold text-mist-300">
              {Math.round(p.progress * 100)}%
            </span>
          </div>
          {p.mode === "demo" && (
            <p className="mt-2 font-mono text-[9.5px] uppercase tracking-[0.2em] text-cyanx-400/80">
              ◈ simulated execution — hashes are demo artifacts
            </p>
          )}
        </div>

        {/* steps */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <ol className="space-y-2">
            {p.steps.map((s, i) => (
              <li
                key={s.id}
                className={`flex items-center gap-3 rounded-lg border px-3.5 py-2.5 transition-all duration-300 ${
                  s.status === "active"
                    ? "border-amberx-500/50 bg-amberx-500/[0.06]"
                    : s.status === "submitted"
                      ? "border-cyanx-500/40 bg-cyanx-500/[0.05]"
                      : s.status === "confirmed"
                        ? "border-hood-500/35 bg-hood-500/[0.04]"
                        : s.status === "failed"
                          ? "border-redx-500/45 bg-redx-500/[0.06]"
                          : "border-ink-700 bg-ink-850/50 opacity-70"
                }`}
              >
                <span className="w-5 shrink-0 text-center font-mono text-[10px] text-mist-600">{String(i + 1).padStart(2, "0")}</span>
                <TokenLogo symbol={s.symbol} hue={s.hue} size={26} dead={s.kind === "burn"} />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-mono text-[11.5px] font-medium text-mist-100">{s.label}</div>
                  {s.status === "submitted" && s.hash && (
                    <a
                      href={s.txUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-0.5 inline-flex items-center gap-1 font-mono text-[10px] text-cyanx-400 hover:underline"
                    >
                      {shortHash(s.hash)} <ExtIcon size={9} />
                    </a>
                  )}
                  {s.status === "confirmed" && s.hash && (
                    <a
                      href={s.txUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-0.5 inline-flex items-center gap-1 font-mono text-[10px] text-hood-500/80 hover:underline"
                    >
                      confirmed · {shortHash(s.hash)} <ExtIcon size={9} />
                    </a>
                  )}
                  {s.status === "failed" && s.error && (
                    <div className="mt-0.5 truncate font-mono text-[10px] text-redx-400" title={s.error}>
                      ✕ {s.error}
                    </div>
                  )}
                </div>
                <StepStatusIcon status={s.status} />
              </li>
            ))}
          </ol>
        </div>

        {/* footer summary */}
        {p.finished && (
          <div className="border-t border-ink-600 bg-ink-850/80 px-5 py-4">
            <div className="flex flex-wrap items-center gap-2">
              <Chip tone="green"><CheckIcon size={11} /> {p.summary.confirmed} swept</Chip>
              {p.summary.failed > 0 && <Chip tone="red"><WarnIcon size={11} /> {p.summary.failed} failed</Chip>}
              <Chip tone="dim">{fmtUsd(p.summary.usdSwept)} recovered</Chip>
              {p.summary.failedSymbols.length > 0 && (
                <span className="font-mono text-[10px] text-mist-600">failed: {p.summary.failedSymbols.join(", ")}</span>
              )}
            </div>
            <div className="mt-3.5 flex gap-2.5">
              {p.summary.failed > 0 && (
                <button onClick={p.onRetry} className="btn-ghost flex flex-1 items-center justify-center gap-2 px-4 py-2.5 text-[12px]">
                  <RefreshIcon size={13} /> RETRY FAILED ({p.summary.failed})
                </button>
              )}
              <button onClick={p.onClose} className="btn-primary flex flex-1 items-center justify-center gap-2 px-4 py-2.5 text-[13px]">
                <BroomIcon size={15} /> DONE — RESCAN
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StepStatusIcon({ status }: { status: QueueStep["status"] }) {
  switch (status) {
    case "queued":
      return <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-ink-500" />;
    case "active":
      return <Spinner size={15} className="shrink-0 text-amberx-400" />;
    case "submitted":
      return <span className="shrink-0 font-mono text-[9px] font-bold uppercase tracking-widest text-cyanx-400">pending</span>;
    case "confirmed":
      return <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-hood-500/15 text-hood-400"><CheckIcon size={11} /></span>;
    case "failed":
      return <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-redx-500/15 text-redx-400"><XIcon size={11} /></span>;
    case "skipped":
      return <span className="shrink-0 font-mono text-[9px] uppercase tracking-widest text-mist-600">skip</span>;
  }
}

function Chip({ tone, children }: { tone: "green" | "red" | "dim"; children: React.ReactNode }) {
  const cls =
    tone === "green"
      ? "border-hood-500/40 bg-hood-500/10 text-hood-400"
      : tone === "red"
        ? "border-redx-500/40 bg-redx-500/10 text-redx-400"
        : "border-ink-600 bg-ink-800 text-mist-400";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 font-mono text-[11px] font-semibold ${cls}`}>
      {children}
    </span>
  );
}
