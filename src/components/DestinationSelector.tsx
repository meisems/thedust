import { motion } from "framer-motion";
import { spring, StatusPill } from "./ui";
import { CoinIcon, EthIcon, FlameIcon } from "./icons";
import type { Destination } from "../hooks/useSweepQueue";

interface Props {
  destination: Destination;
  setDestination: (d: Destination) => void;
  isVip: boolean;
  minTierLabel: string;
  disabled: boolean;
}

/* ------------------------------------------------------------------ */
/*  where does the dust go? three radio rows, one card                 */
/* ------------------------------------------------------------------ */
export function DestinationSelector({ destination, setDestination, isVip, minTierLabel, disabled }: Props) {
  const rows = [
    {
      id: "sweep" as Destination,
      icon: <CoinIcon size={19} />,
      iconBg: "var(--acc-soft)",
      iconFg: "var(--acc-ink)",
      title: "$SWEEP",
      pill: <StatusPill tone="acc">always 0%</StatusPill>,
      sub: "buy pressure included at no extra charge.",
    },
    {
      id: "eth" as Destination,
      icon: <EthIcon size={19} />,
      iconBg: "var(--sky-soft)",
      iconFg: "var(--sky-ink)",
      title: "ETH",
      pill: isVip ? <StatusPill tone="gold">0% · vip</StatusPill> : <StatusPill tone="sky">2.5% fee</StatusPill>,
      sub: isVip ? "fees fear you. sweep away." : `hold ${minTierLabel} $SWEEP to make this free.`,
    },
    {
      id: "burn" as Destination,
      icon: <FlameIcon size={19} />,
      iconBg: "var(--coral-soft)",
      iconFg: "var(--coral-ink)",
      title: "the burn pile",
      pill: <StatusPill tone="coral">no refunds</StatusPill>,
      sub: "rugs & honeypots go straight to 0x…dEaD.",
    },
  ];

  return (
    <section className="card overflow-hidden">
      <div className="flex items-center justify-between px-6 pb-1 pt-5">
        <h2 className="font-display text-lg font-bold tracking-tight text-ink">pick a destination</h2>
        <span className="lbl hidden sm:block">one broom, three directions</span>
      </div>

      <div className="p-2.5">
        {rows.map((r) => {
          const active = destination === r.id;
          return (
            <motion.button
              key={r.id}
              type="button"
              disabled={disabled}
              onClick={() => setDestination(r.id)}
              whileTap={disabled ? undefined : { scale: 0.985 }}
              className="relative flex w-full items-center gap-4 rounded-2xl px-3.5 py-3.5 text-left outline-none transition-colors disabled:opacity-60"
              style={{
                background: active ? "var(--bg-soft)" : "transparent",
                boxShadow: active ? "inset 0 0 0 1.6px var(--acc)" : "inset 0 0 0 1.5px transparent",
              }}
            >
              <span className="squircle h-11 w-11 shrink-0" style={{ background: r.iconBg, color: r.iconFg }}>
                {r.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-display text-[15.5px] font-bold text-ink">{r.title}</span>
                  {r.pill}
                </span>
                <span className="mt-0.5 block text-xs leading-snug text-muted">{r.sub}</span>
              </span>

              {/* radio dot */}
              <span
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                style={{ boxShadow: `inset 0 0 0 1.6px ${active ? "var(--acc)" : "var(--line-strong)"}` }}
              >
                {active && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={spring}
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: "var(--acc)" }}
                  />
                )}
              </span>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}
