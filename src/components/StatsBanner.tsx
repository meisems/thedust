import { fmtUsd } from "../lib/chain";
import { CountUp } from "./ui";
import { RadarIcon, SkullIcon, ZapIcon, GhostIcon } from "./icons";

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
}

/** Ambient drifting chart line behind the readout */
function AmbientChart() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.16]"
      viewBox="0 0 800 160"
      preserveAspectRatio="none"
      aria-hidden
    >
      <path
        className="chart-line"
        d="M0 120 L40 112 L80 118 L120 96 L160 104 L200 82 L240 90 L280 64 L320 78 L360 58 L400 70 L440 44 L480 60 L520 38 L560 52 L600 30 L640 46 L680 24 L720 40 L760 18 L800 34"
        fill="none"
        stroke="#22e06f"
        strokeWidth="1.5"
      />
      <path
        d="M0 120 L40 112 L80 118 L120 96 L160 104 L200 82 L240 90 L280 64 L320 78 L360 58 L400 70 L440 44 L480 60 L520 38 L560 52 L600 30 L640 46 L680 24 L720 40 L760 18 L800 34 L800 160 L0 160 Z"
        fill="url(#chartFade)"
        stroke="none"
        opacity="0.5"
      />
      <defs>
        <linearGradient id="chartFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#22e06f" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#22e06f" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function StatsBanner(p: Props) {
  return (
    <section className="panel panel-hover relative overflow-hidden px-5 py-5 sm:px-7 sm:py-6">
      <AmbientChart />
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        {/* headline readout */}
        <div>
          <div className="flex items-center gap-2">
            <RadarIcon size={14} className="text-hood-400" />
            <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-mist-500">
              Scanner readout · dust &lt; $5.00
            </span>
            {p.loading && <span className="font-mono text-[10px] text-hood-400">scanning<span className="cursor-blink">▊</span></span>}
            {!p.loading && !p.connected && (
              <span className="font-mono text-[10px] uppercase tracking-widest text-mist-600">standby</span>
            )}
            {!p.loading && p.lastScan && (
              <span className="font-mono text-[10px] text-mist-600">
                indexed @ {p.lastScan.toLocaleTimeString("en-US", { hour12: false })}
              </span>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1">
            {p.loading ? (
              <div className="skeleton h-14 w-56" />
            ) : (
              <span className={`font-mono text-5xl font-bold tracking-tight sm:text-6xl ${p.connected ? "text-mist-100" : "text-ink-500"}`}>
                {p.connected ? <CountUp value={p.totalUsd} prefix="$" /> : "$ —.——"}
              </span>
            )}
            <span className="font-display text-sm font-semibold uppercase tracking-[0.14em] text-hood-400">
              stranded in dust
            </span>
          </div>
          <p className="mt-1.5 max-w-md text-[13px] leading-snug text-mist-500">
            {p.loading
              ? "Indexing ERC-20 balances via the Blockscout API…"
              : p.connected
                ? `${p.tokenCount} low-balance positions detected across Robinhood Chain. Sweep them into $SWEEP, ETH, or the fire.`
                : "Attach a wallet to index every ERC-20 balance under $5.00 and queue it for consolidation."}
          </p>
        </div>

        {/* satellite stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Dust tokens" value={p.loading ? null : p.connected ? String(p.tokenCount) : "—"} icon={<RadarIcon size={14} />} tone="text-hood-400" />
          <Stat label="Recoverable" value={p.loading ? null : p.connected ? fmtUsd(p.liquidUsd) : "—"} icon={<ZapIcon size={14} />} tone="text-cyanx-400" sub="liquid pairs" />
          <Stat label="Dead / rugged" value={p.loading ? null : p.connected ? String(p.deadCount) : "—"} icon={<SkullIcon size={14} />} tone="text-redx-400" sub="burn eligible" />
          <Stat label="Gas to sweep all" value={p.loading ? null : p.connected ? fmtUsd(p.gasUsdAll, 3) : "—"} icon={<GhostIcon size={14} />} tone="text-amberx-400" sub={p.connected ? `${p.ignoredCount} asset${p.ignoredCount === 1 ? "" : "s"} > $5 ignored` : "awaiting scan"} />
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value, icon, tone, sub }: {
  label: string; value: string | null; icon: React.ReactNode; tone: string; sub?: string;
}) {
  return (
    <div className="panel px-3.5 py-3">
      <div className="flex items-center gap-1.5">
        <span className={tone}>{icon}</span>
        <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-mist-600">{label}</span>
      </div>
      <div className="mt-1.5">
        {value === null ? (
          <div className="skeleton h-6 w-16" />
        ) : (
          <span className={`font-mono text-lg font-semibold ${tone}`}>{value}</span>
        )}
      </div>
      {sub && <div className="mt-0.5 font-mono text-[9.5px] text-mist-600">{sub}</div>}
    </div>
  );
}
