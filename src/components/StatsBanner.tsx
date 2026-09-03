import { CountUp, Reveal, StatusPill, spring } from "./ui";
import { GasIcon, GhostIcon, RadarIcon, WalletIcon, ZapIcon } from "./icons";
import { fmtUsd } from "../lib/chain";
import { motion } from "framer-motion";

interface Props {
  totalUsd: number;
  tokenCount: number;
  liquidUsd: number;
  deadCount: number;
  gasUsdAll: number;
  ignoredCount: number;
  loading: boolean;
  lastScan: Date | null;
  connected: boolean;
  onAttach: () => void;
}

/* ------------------------------------------------------------------ */
/*  the opening readout — how much money is stuck as dust              */
/* ------------------------------------------------------------------ */
export function StatsBanner(p: Props) {
  return (
    <Reveal>
      <section className="card relative overflow-hidden px-6 pb-6 pt-7 sm:px-8">
        {/* faint corner tint */}
        <div
          className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full"
          style={{ background: "var(--acc-soft)", filter: "blur(60px)", opacity: 0.7 }}
        />

        <div className="relative flex items-center justify-between gap-3">
          <span className="lbl">total stranded dust</span>
          {p.loading ? (
            <StatusPill tone="sky">
              <RadarIcon size={12} /> sniffing balances
            </StatusPill>
          ) : !p.connected ? (
            <StatusPill tone="muted">standby</StatusPill>
          ) : p.lastScan ? (
            <StatusPill tone="acc">
              indexed {p.lastScan.toLocaleTimeString("en-US", { hour12: false })}
            </StatusPill>
          ) : null}
        </div>

        <div className="relative mt-3 flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="font-display text-[56px] font-bold leading-none tracking-tight text-ink sm:text-7xl">
              {p.loading ? (
                <span className="skeleton inline-block h-16 w-64 align-middle sm:h-20" />
              ) : p.connected ? (
                <CountUp value={p.totalUsd} prefix="$" />
              ) : (
                <span className="text-faint">$ —.——</span>
              )}
            </div>
            <p className="mt-3 max-w-md text-[13.5px] leading-relaxed text-muted">
              {p.loading
                ? "reading every ERC-20 you forgot about…"
                : p.connected
                  ? `${p.tokenCount} tiny positions, one broom. below $5 counts as dust — feelings don't.`
                  : "can't count dust without a wallet. attach one and we'll do the embarrassing math."}
            </p>
            {!p.connected && !p.loading && (
              <motion.button
                type="button"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                transition={spring}
                onClick={p.onAttach}
                className="mt-4 flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold text-white"
                style={{ background: "var(--acc)" }}
              >
                <WalletIcon size={15} /> attach a wallet
              </motion.button>
            )}
          </div>
        </div>

        {/* stat strip */}
        <div className="relative mt-7 grid grid-cols-2 gap-y-4 border-t pt-5 sm:grid-cols-4" style={{ borderColor: "var(--line)" }}>
          <Stat icon={<RadarIcon size={15} />} tone="var(--acc-soft)" fg="var(--acc-ink)" label="dust tokens" value={p.loading || !p.connected ? "—" : String(p.tokenCount)} />
          <Stat icon={<ZapIcon size={15} />} tone="var(--sky-soft)" fg="var(--sky-ink)" label="recoverable" value={p.loading || !p.connected ? "—" : fmtUsd(p.liquidUsd)} />
          <Stat icon={<GhostIcon size={15} />} tone="var(--coral-soft)" fg="var(--coral-ink)" label="dead & rugged" value={p.loading || !p.connected ? "—" : String(p.deadCount)} />
          <Stat icon={<GasIcon size={15} />} tone="var(--gold-soft)" fg="var(--gold-ink)" label="gas to sweep all" value={p.loading || !p.connected ? "—" : fmtUsd(p.gasUsdAll, 4)} hint={p.connected && p.ignoredCount > 0 ? `${p.ignoredCount} token${p.ignoredCount > 1 ? "s" : ""} over cutoff stay put` : undefined} />
        </div>
      </section>
    </Reveal>
  );
}

function Stat({ icon, tone, fg, label, value, hint }: { icon: React.ReactNode; tone: string; fg: string; label: string; value: string; hint?: string }) {
  return (
    <div className="flex items-center gap-3 pr-4" title={hint}>
      <span className="squircle h-9 w-9 shrink-0" style={{ background: tone, color: fg }}>
        {icon}
      </span>
      <div className="min-w-0">
        <div className="truncate font-display text-lg font-bold leading-tight text-ink">{value}</div>
        <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-faint">{label}</div>
      </div>
    </div>
  );
}


