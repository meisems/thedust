import { motion } from "framer-motion";
import { CountUp, ProgressBar, Reveal, spring, StatusPill } from "./ui";
import { ArrowRightIcon, BroomIcon, CrownIcon, FlameIcon, GhostIcon, ShieldIcon, ZapIcon } from "./icons";
import { fmtUsd, MIN_HOLDING_TIER, PRICES, PROTOCOL_FEE_PCT } from "../lib/chain";
import type { Destination } from "../hooks/useSweepQueue";
import type { DustToken } from "../lib/demo";

export interface FeedItem {
  id: number;
  text: string;
  ok: boolean;
  time: string;
}

interface Props {
  selectedTokens: DustToken[];
  mismatchCount: number;
  destination: Destination;
  isVip: boolean;
  sweepBalance: number;
  demoMode: boolean;
  richDemo: boolean;
  onToggleRichDemo: () => void;
  onSweep: () => void;
  running: boolean;
  session: { usd: number; count: number };
  feed: FeedItem[];
  minTierLabel: string;
}

/* ------------------------------------------------------------------ */
/*  the console — what you get, what it costs, and the big red… green  */
/* ------------------------------------------------------------------ */
export function SweepConsole(p: Props) {
  const n = p.selectedTokens.length;
  const value = p.selectedTokens.reduce((s, t) => s + t.usdValue, 0);
  const fee = p.destination === "eth" && !p.isVip ? value * (PROTOCOL_FEE_PCT / 100) : 0;
  const stepsPerToken = p.destination === "burn" ? 1 : p.destination === "sweep" ? 2 : p.isVip ? 2 : 3;
  const gasUsd = n * stepsPerToken * PRICES.gasPerTx * PRICES.ETH;
  const receive = value - fee;
  const destLabel = p.destination === "sweep" ? "$SWEEP" : p.destination === "eth" ? "ETH" : "0x…dEaD";
  const tierPct = Math.min(1, p.sweepBalance / Number(MIN_HOLDING_TIER));

  const btnLabel =
    p.running ? "sweeping…" : n === 0 ? "pick some dust first" : p.destination === "burn" ? `burn ${n} token${n > 1 ? "s" : ""}` : `sweep ${n} token${n > 1 ? "s" : ""}`;

  return (
    <div className="space-y-5">
      {/* console */}
      <Reveal delay={0.05}>
        <section className="card p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold tracking-tight text-ink">sweep console</h2>
            <StatusPill tone={fee === 0 ? "acc" : "sky"}>{fee === 0 ? "0% fee" : `${PROTOCOL_FEE_PCT}% fee`}</StatusPill>
          </div>

          <div className="mt-5 space-y-3">
            <Row label="tokens" value={n === 0 ? "—" : String(n)} />
            <Row label="gross value" value={n === 0 ? "—" : fmtUsd(value)} />
            <Row
              label="protocol fee"
              value={n === 0 ? "—" : fee > 0 ? `−${fmtUsd(fee)}` : "free"}
              valueStyle={fee > 0 ? { color: "var(--gold-ink)" } : { color: "var(--acc-ink)" }}
            />
            <Row label="est. gas" value={n === 0 ? "—" : `~${fmtUsd(gasUsd, 4)}`} />
          </div>

          <div className="mt-5 flex items-end justify-between border-t pt-4" style={{ borderColor: "var(--line)" }}>
            <div>
              <div className="lbl">you receive ≈</div>
              <div className="mt-1 font-display text-[26px] font-bold leading-none tracking-tight text-ink">
                {n === 0 ? "—" : <CountUp value={receive} prefix="$" />}
              </div>
            </div>
            <span className="chip border-transparent bg-bg-soft">
              <ArrowRightIcon size={12} className="text-faint" /> {destLabel}
            </span>
          </div>

          {p.mismatchCount > 0 && n + p.mismatchCount > 0 && (
            <p className="mt-3 flex items-start gap-2 text-xs leading-snug text-muted">
              <GhostIcon size={14} className="mt-0.5 shrink-0 text-faint" />
              {p.destination === "burn"
                ? `${p.mismatchCount} liquid token${p.mismatchCount > 1 ? "s" : ""} need a swap, not a flame — left out of this batch.`
                : `${p.mismatchCount} dead token${p.mismatchCount > 1 ? "s" : ""} can't be sold — the burn pile is their only exit.`}
            </p>
          )}

          <motion.button
            type="button"
            onClick={p.onSweep}
            disabled={n === 0 || p.running}
            whileHover={n > 0 && !p.running ? { scale: 1.02 } : undefined}
            whileTap={n > 0 && !p.running ? { scale: 0.97 } : undefined}
            transition={spring}
            className={`mt-5 flex w-full items-center justify-center gap-2.5 rounded-btn px-5 py-4 font-display text-[15.5px] font-bold transition-opacity disabled:opacity-45 ${p.destination === "burn" ? "text-on-coral" : "text-on-acc"}`}
            style={{ background: p.destination === "burn" ? "var(--coral)" : "var(--acc)" }}
          >
            {p.destination === "burn" ? <FlameIcon size={18} /> : <BroomIcon size={18} />}
            {btnLabel}
          </motion.button>
          <p className="mt-3 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
            slippage 15% · deadline 20 min · one tx at a time
          </p>
        </section>
      </Reveal>

      {/* VIP card */}
      <Reveal delay={0.1}>
        <section
          className="card overflow-hidden"
          style={p.isVip ? { borderColor: "var(--gold)", boxShadow: "0 0 0 1px var(--gold), var(--shadow-md)" } : undefined}
        >
          <div className="flex items-center gap-3.5 px-6 py-5">
            <span className="squircle h-11 w-11 shrink-0" style={{ background: "var(--gold-soft)", color: "var(--gold-ink)" }}>
              {p.isVip ? <CrownIcon size={20} /> : <ShieldIcon size={20} />}
            </span>
            <div className="min-w-0 flex-1">
              {p.isVip ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className="font-display text-[15px] font-bold text-ink">vip · 0% fee tier</span>
                    <StatusPill tone="gold">unlocked</StatusPill>
                  </div>
                  <p className="mt-0.5 text-xs text-muted">holding {p.sweepBalance.toLocaleString("en-US", { maximumFractionDigits: 0 })} $SWEEP. nice.</p>
                </>
              ) : (
                <>
                  <span className="font-display text-[15px] font-bold text-ink">want 0% on eth sweeps?</span>
                  <p className="mt-0.5 text-xs leading-snug text-muted">
                    hold {p.minTierLabel} $SWEEP — or sweep to $SWEEP, which is already free.
                  </p>
                </>
              )}
              {!p.isVip && (
                <div className="mt-2.5 flex items-center gap-2.5">
                  <div className="flex-1">
                    <ProgressBar value={tierPct} tone="var(--gold)" />
                  </div>
                  <span className="font-mono text-[10px] text-faint">{Math.round(tierPct * 100)}%</span>
                </div>
              )}
            </div>
          </div>
          {p.demoMode && !p.isVip && (
            <button
              type="button"
              onClick={p.onToggleRichDemo}
              className="flex w-full items-center justify-between border-t px-6 py-3 transition-colors hover:bg-bg-soft/70"
              style={{ borderColor: "var(--line)" }}
            >
              <span className="font-mono text-[11px] text-muted">pretend i'm rich (demo)</span>
              <Switch on={p.richDemo} />
            </button>
          )}
        </section>
      </Reveal>

      {/* session */}
      <Reveal delay={0.15}>
        <section className="card p-6">
          <div className="flex items-center justify-between">
            <h3 className="lbl">this session</h3>
            <ZapIcon size={14} className="text-faint" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-3xl font-bold tracking-tight text-ink">
              <CountUp value={p.session.usd} prefix="$" />
            </span>
            <span className="font-mono text-[11px] text-muted">recovered · {p.session.count} sweep{p.session.count === 1 ? "" : "s"}</span>
          </div>

          {p.feed.length > 0 ? (
            <ul className="mt-4 space-y-2 border-t pt-4" style={{ borderColor: "var(--line)" }}>
              {p.feed.slice(0, 4).map((f) => (
                <li key={f.id} className="flex items-center gap-2.5 text-xs">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: f.ok ? "var(--acc)" : "var(--coral)" }} />
                  <span className="min-w-0 flex-1 truncate text-ink-2">{f.text}</span>
                  <span className="shrink-0 font-mono text-[10px] text-faint">{f.time}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 border-t pt-4 text-xs text-muted" style={{ borderColor: "var(--line)" }}>
              nothing swept yet. the dust waits. it's patient like that.
            </p>
          )}
        </section>
      </Reveal>
    </div>
  );
}

function Row({ label, value, valueStyle }: { label: string; value: string; valueStyle?: React.CSSProperties }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[13px] text-muted">{label}</span>
      <span className="font-mono text-[13px] font-bold text-ink" style={valueStyle}>
        {value}
      </span>
    </div>
  );
}

function Switch({ on }: { on: boolean }) {
  return (
    <span
      className="relative inline-flex h-[22px] w-10 items-center rounded-full transition-colors"
      style={{ background: on ? "var(--acc)" : "var(--line-strong)" }}
    >
      <motion.span
        className="absolute left-[3px] h-4 w-4 rounded-full bg-white"
        style={{ boxShadow: "var(--shadow-sm)" }}
        animate={{ x: on ? 18 : 0 }}
        transition={spring}
      />
    </span>
  );
}
