import { motion } from "framer-motion";
import { Monogram, SoftCheck, StatusPill, spring } from "./ui";
import { AlertIcon, GhostIcon, RadarIcon, RefreshIcon, SlidersIcon, SparkIcon } from "./icons";
import { fmtNum, fmtUsd } from "../lib/chain";
import type { DustFilter } from "../hooks/useDustTokens";
import type { DustToken } from "../lib/demo";

interface Props {
  tokens: DustToken[];
  allCount: number;
  deadCount: number;
  loading: boolean;
  error: string | null;
  connected: boolean;
  refresh: () => void;
  cutoff: number;
  setCutoff: (n: number) => void;
  filter: DustFilter;
  setFilter: (f: DustFilter) => void;
  selection: Set<string>;
  onToggle: (addr: string) => void;
  onToggleAll: () => void;
  ignoredCount: number;
  ignoredLabel: string;
}

/* ------------------------------------------------------------------ */
/*  the dust — every embarrassing position, itemized                   */
/* ------------------------------------------------------------------ */
export function DustTable(p: Props) {
  const allSelected = p.tokens.length > 0 && p.tokens.every((t) => p.selection.has(t.address));
  const fillPct = ((p.cutoff - 0.5) / (5 - 0.5)) * 100;

  return (
    <section className="card overflow-hidden">
      {/* header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 pb-4 pt-5">
        <div className="flex items-center gap-2.5">
          <h2 className="font-display text-lg font-bold tracking-tight text-ink">the dust</h2>
          {p.connected && !p.loading && (
            <span className="chip border-transparent bg-bg-soft py-1.5">{p.tokens.length} found</span>
          )}
        </div>
        {p.connected && (
          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            onClick={p.refresh}
            disabled={p.loading}
            aria-label="rescan"
            className="squircle h-9 w-9 border text-muted transition-colors hover:border-line-strong hover:text-ink disabled:opacity-50"
            style={{ borderColor: "var(--line)" }}
          >
            <span className={p.loading ? "spin-slow inline-flex" : "inline-flex"}>
              <RefreshIcon size={16} />
            </span>
          </motion.button>
        )}
      </div>

      {/* filters */}
      {p.connected && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 border-t px-6 py-3.5" style={{ borderColor: "var(--line)" }}>
          <div className="flex items-center gap-1.5">
            <FilterChip active={p.filter === "all"} onClick={() => p.setFilter("all")} label={`all dust · ${p.allCount}`} />
            <FilterChip active={p.filter === "dead"} onClick={() => p.setFilter("dead")} label={`dead only · ${p.deadCount}`} />
          </div>

          <div className="flex min-w-[190px] flex-1 items-center gap-3">
            <SlidersIcon size={15} className="shrink-0 text-faint" />
            <span className="lbl shrink-0">cutoff</span>
            <input
              type="range"
              className="ds-range"
              min={0.5}
              max={5}
              step={0.25}
              value={p.cutoff}
              style={{ ["--fill" as string]: `${fillPct}%` }}
              onChange={(e) => p.setCutoff(parseFloat(e.target.value))}
            />
            <span className="w-12 shrink-0 text-right font-mono text-xs text-ink-2">${p.cutoff.toFixed(2)}</span>
          </div>

          <SoftCheck checked={allSelected} onChange={p.onToggleAll} label="sweep all" />
        </div>
      )}

      {/* body */}
      <div className="border-t" style={{ borderColor: "var(--line)" }}>
        {!p.connected ? (
          <EmptyState
            icon={<GhostIcon size={26} />}
            tone="var(--bg-soft)"
            fg="var(--faint)"
            title="no wallet, no dust"
            sub="attach one and we'll itemize the damage."
          />
        ) : p.loading ? (
          <div className="space-y-3 p-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="skeleton h-10 w-10" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-3.5 w-1/3" />
                  <div className="skeleton h-3 w-1/5" />
                </div>
                <div className="skeleton h-3.5 w-16" />
              </div>
            ))}
          </div>
        ) : p.error ? (
          <EmptyState
            icon={<AlertIcon size={26} />}
            tone="var(--coral-soft)"
            fg="var(--coral-ink)"
            title="the explorer ghosted us"
            sub={p.error}
            action={
              <button type="button" onClick={p.refresh} className="chip border-transparent transition-transform hover:scale-105" style={{ background: "var(--acc)", color: "#fff" }}>
                try again
              </button>
            }
          />
        ) : p.tokens.length === 0 ? (
          <EmptyState
            icon={<SparkIcon size={26} />}
            tone="var(--acc-soft)"
            fg="var(--acc-ink)"
            title="suspiciously clean"
            sub="zero dust under the cutoff. either you're rich or lying."
          />
        ) : (
          <ul>
            {p.tokens.map((t, i) => {
              const checked = p.selection.has(t.address);
              const dead = t.kind === "dead";
              return (
                <motion.li
                  key={t.address}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...spring, delay: Math.min(i * 0.025, 0.3) }}
                  onClick={() => p.onToggle(t.address)}
                  className="flex cursor-pointer items-center gap-3.5 border-b px-6 py-3 transition-colors last:border-b-0 hover:bg-bg-soft/70 sm:gap-4"
                  style={{ borderColor: "var(--line)" }}
                >
                  <SoftCheck checked={checked} onChange={() => p.onToggle(t.address)} />
                  <Monogram symbol={t.symbol} hue={t.hue} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-display text-[14.5px] font-bold text-ink">{t.symbol}</span>
                      {dead && <StatusPill tone="coral"><GhostIcon size={11} /> dead</StatusPill>}
                      {t.preApproved && !dead && <StatusPill tone="muted">approved</StatusPill>}
                    </div>
                    <div className="truncate text-xs text-muted">{t.name}</div>
                  </div>
                  <div className="hidden text-right md:block">
                    <div className="font-mono text-[12.5px] text-ink-2">{fmtNum(t.balance)}</div>
                    <div className="font-mono text-[10px] uppercase text-faint">balance</div>
                  </div>
                  <div className="w-20 text-right">
                    <div className="font-mono text-[13px] font-bold text-ink">{fmtUsd(t.usdValue)}</div>
                    {!dead && t.change24h !== 0 && (
                      <div className={`font-mono text-[10.5px] ${t.change24h >= 0 ? "text-acc-ink" : "text-coral-ink"}`}>
                        {t.change24h >= 0 ? "+" : ""}
                        {t.change24h.toFixed(1)}%
                      </div>
                    )}
                  </div>
                  <div className="hidden w-16 sm:block">
                    {!dead ? <StatusPill tone="acc"><RadarIcon size={11} /> liquid</StatusPill> : <span />}
                  </div>
                </motion.li>
              );
            })}
          </ul>
        )}
      </div>

      {/* footer note */}
      {p.connected && !p.loading && !p.error && p.ignoredCount > 0 && (
        <div className="border-t px-6 py-3" style={{ borderColor: "var(--line)" }}>
          <p className="font-mono text-[10.5px] text-faint">
            {p.ignoredCount} token{p.ignoredCount > 1 ? "s" : ""} over cutoff ignored — {p.ignoredLabel} stays put. respect.
          </p>
        </div>
      )}
    </section>
  );
}

function FilterChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.94 }}
      className="rounded-full px-3.5 py-2 font-mono text-[11px] transition-colors"
      style={{
        background: active ? "var(--acc)" : "var(--bg-soft)",
        color: active ? "#fff" : "var(--muted)",
      }}
    >
      {label}
    </motion.button>
  );
}

function EmptyState({ icon, tone, fg, title, sub, action }: { icon: React.ReactNode; tone: string; fg: string; title: string; sub: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <span className="squircle h-14 w-14" style={{ background: tone, color: fg, borderRadius: 20 }}>
        {icon}
      </span>
      <p className="mt-4 font-display text-lg font-bold text-ink">{title}</p>
      <p className="mt-1 max-w-xs text-[13px] leading-relaxed text-muted">{sub}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
