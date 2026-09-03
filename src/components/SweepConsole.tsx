import {
  fmtUsd, MIN_HOLDING_TIER_FMT, PRICES, PROTOCOL_FEE_PCT,
} from "../lib/chain";
import type { DustToken } from "../lib/demo";
import type { Destination } from "../hooks/useSweepQueue";
import { CountUp, ProgressBar } from "./ui";
import { ArrowRightIcon, BroomIcon, CoinIcon, EthIcon, FlameIcon, ShieldIcon, ZapIcon } from "./icons";

export interface ActivityEntry {
  id: number;
  time: string;
  dest: Destination;
  count: number;
  usd: number;
}

interface Props {
  destination: Destination;
  isVip: boolean;
  demoMode: boolean;
  demoVip: boolean;
  onToggleDemoVip: (v: boolean) => void;
  sweepBalance: number;
  selectedTokens: DustToken[];
  running: boolean;
  onSweep: () => void;
  onJumpToDest: (d: Destination) => void;
  activity: ActivityEntry[];
}

export function SweepConsole(p: Props) {
  const sel = p.selectedTokens;
  const gross = sel.reduce((s, t) => s + t.usdValue, 0);
  const feePct = p.destination === "eth" && !p.isVip ? PROTOCOL_FEE_PCT : 0;
  const feeUsd = (gross * feePct) / 100;

  const approvals = p.destination === "burn" ? 0 : sel.filter((t) => !t.preApproved).length;
  const feeTxs = p.destination === "eth" && !p.isVip ? sel.filter((t) => t.usdValue > 0).length : 0;
  const totalTxs = sel.length + approvals + feeTxs;
  const gasUsd = totalTxs * PRICES.gasPerTx * PRICES.ETH;

  const net = gross - feeUsd;
  const outSweep = net / PRICES.SWEEP;
  const outEth = net / PRICES.ETH;

  const canSweep = sel.length > 0 && !p.running;
  const btnLabel =
    sel.length === 0
      ? "SELECT DUST TO SWEEP"
      : p.destination === "burn"
        ? `BURN ${sel.length} DEAD TOKEN${sel.length > 1 ? "S" : ""}`
        : `SWEEP ${sel.length} TOKEN${sel.length > 1 ? "S" : ""}`;

  const destIcon =
    p.destination === "sweep" ? <CoinIcon size={14} className="text-hood-400" />
    : p.destination === "eth" ? <EthIcon size={14} className="text-cyanx-400" />
    : <FlameIcon size={14} className="text-redx-400" />;

  const tierProgress = Math.min(1, p.sweepBalance / Number(MIN_HOLDING_TIER_FMT.replace(/,/g, "")));

  return (
    <aside className="flex flex-col gap-4">
      {/* ------- summary ------- */}
      <div className="panel p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-[13px] font-bold uppercase tracking-[0.2em] text-mist-300">04 · Sweep console</h2>
          {destIcon}
        </div>

        <div className="mt-4 flex items-baseline justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-mist-600">Gross dust value</span>
          <span className="font-mono text-2xl font-bold text-mist-100">
            <CountUp value={gross} prefix="$" />
          </span>
        </div>

        <div className="mt-4 space-y-2 border-t border-dashed border-ink-600 pt-3.5 font-mono text-[11.5px]">
          <Row label="Positions" value={sel.length ? `${sel.length} token${sel.length > 1 ? "s" : ""}` : "—"} />
          <Row
            label="Protocol fee"
            value={
              p.destination === "burn" ? "n/a"
              : feePct === 0 ? (
                <span className="text-hood-400">0% {p.destination === "sweep" ? "· $SWEEP route" : "· VIP tier"}</span>
              ) : (
                <span className="text-amberx-400">−{fmtUsd(feeUsd)} ({feePct}%)</span>
              )
            }
          />
          <Row label="Wallet txs" value={sel.length ? `${totalTxs} (${approvals} appr · ${feeTxs} fee · ${sel.length} exec)` : "—"} />
          <Row label="Est. network gas" value={sel.length ? `≈ ${fmtUsd(gasUsd, 3)}` : "—"} />
          {p.destination !== "burn" && <Row label="DEX LP fee" value="0.3% in-route" dim />}
        </div>

        {/* output preview */}
        <div className="mt-4 rounded-lg border border-ink-600 bg-ink-850 p-3.5">
          <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.18em] text-mist-600">
            <span>You receive (est.)</span>
            <span className="flex items-center gap-1"><ZapIcon size={11} className="text-amberx-400" /> 15% slippage guard</span>
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            {p.destination === "burn" ? (
              <>
                <span className="font-mono text-xl font-bold text-redx-400">{sel.length ? `${sel.length} → 0x…dEaD` : "—"}</span>
                <span className="font-mono text-[10.5px] text-mist-600">removed from supply</span>
              </>
            ) : p.destination === "sweep" ? (
              <>
                <span className="font-mono text-xl font-bold text-hood-400">
                  {sel.length ? <CountUp value={outSweep} decimals={0} /> : "—"}
                </span>
                <span className="font-mono text-[10.5px] text-mist-600">$SWEEP @ {fmtUsd(PRICES.SWEEP, 4)}</span>
              </>
            ) : (
              <>
                <span className="font-mono text-xl font-bold text-cyanx-400">
                  {sel.length ? <CountUp value={outEth} decimals={5} /> : "—"}
                </span>
                <span className="font-mono text-[10.5px] text-mist-600">ETH @ {fmtUsd(PRICES.ETH, 0)}</span>
              </>
            )}
          </div>
        </div>

        <button onClick={p.onSweep} disabled={!canSweep} className="btn-primary mt-4 flex w-full items-center justify-center gap-2.5 py-3.5 text-[14px]">
          {p.destination === "burn" ? <FlameIcon size={17} /> : <BroomIcon size={17} />}
          {p.running ? "QUEUE RUNNING…" : btnLabel}
          {sel.length > 0 && !p.running && <ArrowRightIcon size={16} />}
        </button>

        {feePct > 0 && (
          <button
            onClick={() => p.onJumpToDest("sweep")}
            className="mt-2.5 w-full rounded-md border border-hood-500/30 bg-hood-500/[0.06] px-3 py-2 font-mono text-[10.5px] leading-relaxed text-hood-400 transition-all hover:bg-hood-500/[0.12]"
          >
            ↷ Route to $SWEEP instead → 0% fee, no VIP needed
          </button>
        )}
      </div>

      {/* ------- VIP gate ------- */}
      <div className={`panel p-5 ${p.isVip ? "border-hood-500/40" : ""}`}>
        <div className="flex items-center gap-2">
          <ShieldIcon size={15} className={p.isVip ? "text-hood-400" : "text-amberx-400"} />
          <h3 className="font-display text-[12px] font-bold uppercase tracking-[0.18em] text-mist-300">Token gate · VIP tier</h3>
        </div>

        {p.isVip ? (
          <div className="mt-3 rounded-md border border-hood-500/35 bg-hood-500/[0.08] px-3.5 py-3">
            <p className="font-display text-[13px] font-bold tracking-wide text-hood-400">VIP HOLDER: 0% FEE TIER ACTIVATED</p>
            <p className="mt-1 font-mono text-[10.5px] leading-relaxed text-mist-500">
              {p.sweepBalance.toLocaleString("en-US", { maximumFractionDigits: 0 })} $SWEEP held ≥ {MIN_HOLDING_TIER_FMT}. ETH sweeps are completely free.
            </p>
          </div>
        ) : (
          <>
            <p className="mt-2.5 text-[12px] leading-snug text-mist-500">
              Hold <span className="font-mono font-semibold text-mist-100">{MIN_HOLDING_TIER_FMT} $SWEEP</span> for zero-fee ETH sweeps —
              or sweep directly to <span className="font-mono font-semibold text-hood-400">$SWEEP</span> for 0% fee, always.
            </p>
            <div className="mt-3 flex items-center justify-between font-mono text-[10.5px] text-mist-500">
              <span>{p.sweepBalance.toLocaleString("en-US", { maximumFractionDigits: 0 })} held</span>
              <span className="text-amberx-400">{Math.round(tierProgress * 100)}% of tier</span>
            </div>
            <div className="mt-1.5"><ProgressBar value={tierProgress} tone="amber" /></div>
            {p.demoMode && (
              <label className="mt-3.5 flex cursor-pointer items-center justify-between rounded-md border border-dashed border-ink-500 px-3 py-2">
                <span className="font-mono text-[10.5px] text-mist-500">DEMO · simulate holding tier</span>
                <button
                  role="switch"
                  aria-checked={p.demoVip}
                  onClick={(e) => { e.preventDefault(); p.onToggleDemoVip(!p.demoVip); }}
                  className={`relative h-5 w-9 rounded-full transition-colors ${p.demoVip ? "bg-hood-500" : "bg-ink-600"}`}
                >
                  <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-mist-100 transition-all ${p.demoVip ? "left-[18px]" : "left-0.5"}`} />
                </button>
              </label>
            )}
          </>
        )}
      </div>

      {/* ------- activity ------- */}
      <div className="panel p-5">
        <h3 className="font-display text-[12px] font-bold uppercase tracking-[0.18em] text-mist-300">Session activity</h3>
        {p.activity.length === 0 ? (
          <p className="mt-3 font-mono text-[11px] text-mist-600">
            No sweeps yet this session. Completed queues will log here with Blockscout links.
          </p>
        ) : (
          <ul className="mt-3 space-y-2.5">
            {p.activity.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 rounded-md border border-ink-700 bg-ink-850/70 px-3 py-2">
                <div className="flex items-center gap-2.5">
                  {a.dest === "burn" ? <FlameIcon size={13} className="text-redx-400" /> : a.dest === "eth" ? <EthIcon size={13} className="text-cyanx-400" /> : <CoinIcon size={13} className="text-hood-400" />}
                  <div>
                    <div className="font-mono text-[11px] text-mist-300">
                      {a.count} token{a.count > 1 ? "s" : ""} → {a.dest === "sweep" ? "$SWEEP" : a.dest === "eth" ? "ETH" : "burn"}
                    </div>
                    <div className="font-mono text-[9.5px] text-mist-600">{a.time}</div>
                  </div>
                </div>
                <span className="font-mono text-[12px] font-semibold text-mist-100">{fmtUsd(a.usd)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}

function Row({ label, value, dim }: { label: string; value: React.ReactNode; dim?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-mist-600">{label}</span>
      <span className={dim ? "text-mist-600" : "text-mist-300"}>{value}</span>
    </div>
  );
}
