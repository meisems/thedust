import type { Destination } from "../hooks/useSweepQueue";
import { CoinIcon, EthIcon, FlameIcon, ShieldIcon } from "./icons";

interface Props {
  value: Destination;
  onChange: (d: Destination) => void;
  isVip: boolean;
  disabled?: boolean;
}

interface Opt {
  id: Destination;
  title: string;
  desc: string;
  fee: string;
  feeNote: string;
  accent: string;      // border / ring when active
  iconBg: string;
  iconColor: string;
  feeColor: string;
  tag?: string;
  icon: React.ReactNode;
}

export function DestinationSelector({ value, onChange, isVip, disabled }: Props) {
  const opts: Opt[] = [
    {
      id: "sweep",
      title: "Sweep to $SWEEP",
      desc: "Multi-hop route TOKEN → WETH → $SWEEP on the DEX router. Constant buy pressure, zero protocol cut.",
      fee: "0%",
      feeNote: "protocol fee · always",
      accent: "border-hood-500/70 shadow-[0_0_24px_-8px_rgba(34,224,111,.45)]",
      iconBg: "border-hood-500/35 bg-hood-500/10",
      iconColor: "text-hood-400",
      feeColor: "text-hood-400",
      tag: "RECOMMENDED",
      icon: <CoinIcon size={22} />,
    },
    {
      id: "eth",
      title: "Sweep to ETH",
      desc: isVip
        ? "Direct route TOKEN → WETH, unwrapped to native ETH. VIP tier active — the protocol takes nothing."
        : "Direct route TOKEN → WETH, unwrapped to native ETH. A 2.5% protocol cut applies without the VIP tier.",
      fee: isVip ? "0%" : "2.5%",
      feeNote: isVip ? "VIP tier active" : "protocol fee",
      accent: "border-cyanx-500/70 shadow-[0_0_24px_-8px_rgba(69,200,240,.4)]",
      iconBg: "border-cyanx-500/35 bg-cyanx-500/10",
      iconColor: "text-cyanx-400",
      feeColor: isVip ? "text-hood-400" : "text-cyanx-400",
      icon: <EthIcon size={22} />,
    },
    {
      id: "burn",
      title: "Purge / Burn dead tokens",
      desc: "Zero-liquidity & rugged positions are unrecoverable. Ship them to 0x000…dEaD and clean the portfolio.",
      fee: "GAS",
      feeNote: "no value recovered",
      accent: "border-redx-500/70 shadow-[0_0_24px_-8px_rgba(255,92,92,.4)]",
      iconBg: "border-redx-500/35 bg-redx-500/10",
      iconColor: "text-redx-400",
      feeColor: "text-redx-400",
      icon: <FlameIcon size={22} />,
    },
  ];

  return (
    <section>
      <div className="mb-2.5 flex items-baseline justify-between">
        <h2 className="font-display text-[13px] font-bold uppercase tracking-[0.2em] text-mist-300">
          02 · Destination
        </h2>
        <span className="font-mono text-[10px] text-mist-600">route selection changes eligible tokens</span>
      </div>
      <div className="space-y-2.5" role="radiogroup" aria-label="Sweep destination">
        {opts.map((o) => {
          const active = value === o.id;
          return (
            <button
              key={o.id}
              role="radio"
              aria-checked={active}
              disabled={disabled}
              onClick={() => onChange(o.id)}
              className={`panel group flex w-full items-center gap-4 px-4 py-3.5 text-left transition-all duration-200 disabled:opacity-50 ${
                active ? o.accent + " translate-x-1" : "hover:border-ink-500 hover:translate-x-0.5"
              }`}
            >
              {/* radio */}
              <span
                className={`grid h-4.5 w-4.5 shrink-0 place-items-center rounded-full border-2 transition-all ${
                  active ? "border-hood-400" : "border-ink-500 group-hover:border-mist-600"
                }`}
                style={{ width: 18, height: 18 }}
              >
                <span className={`h-2 w-2 rounded-full transition-all ${active ? "scale-100 bg-hood-400" : "scale-0 bg-transparent"}`} />
              </span>

              <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg border ${o.iconBg} ${o.iconColor}`}>
                {o.icon}
              </span>

              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-display text-[15px] font-semibold text-mist-100">{o.title}</span>
                  {o.tag && (
                    <span className="rounded bg-hood-500/15 px-1.5 py-0.5 font-mono text-[9px] font-semibold tracking-[0.16em] text-hood-400">
                      {o.tag}
                    </span>
                  )}
                  {o.id === "eth" && isVip && (
                    <span className="flex items-center gap-1 rounded bg-hood-500/15 px-1.5 py-0.5 font-mono text-[9px] font-semibold tracking-[0.16em] text-hood-400">
                      <ShieldIcon size={10} /> VIP
                    </span>
                  )}
                </span>
                <span className="mt-0.5 block text-[12px] leading-snug text-mist-500">{o.desc}</span>
              </span>

              <span className="shrink-0 text-right">
                <span className={`block font-mono text-xl font-bold ${o.feeColor}`}>{o.fee}</span>
                <span className="block font-mono text-[9.5px] uppercase tracking-wider text-mist-600">{o.feeNote}</span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
