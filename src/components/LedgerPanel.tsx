import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Monogram, StatusPill, spring } from "./ui";
import { EthIcon, ExternalIcon, FlameIcon, GhostIcon, RefreshIcon, ZapIcon } from "./icons";
import { explorerTx, PRICES, routerTxFeed } from "../lib/chain";
import {
  anonAddress,
  communityEntry,
  relativeTime,
  seedCommunity,
  type LedgerDestination,
  type LedgerEntry,
} from "../lib/ledger";

interface Props {
  ownEntries: LedgerEntry[];
  mode: "demo" | "live" | null;
}

/* deterministic hue so a symbol always renders the same colour */
const hueOf = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
  return h;
};

/* ------------------------------------------------------------------ */
/*  the public ledger — every sweep by every wallet, streamed live     */
/* ------------------------------------------------------------------ */
export function LedgerPanel({ ownEntries, mode }: Props) {
  const [pulse, setPulse] = useState<LedgerEntry[]>(() => seedCommunity(9));
  const [onchain, setOnchain] = useState<LedgerEntry[]>([]);
  const [liveLoading, setLiveLoading] = useState(false);
  const [tick, setTick] = useState(0);
  const pulseSeq = useRef(100);

  /* demo: a steady drip of other people's sweeps keeps the room alive */
  useEffect(() => {
    if (mode !== "demo") return;
    const id = setInterval(() => {
      pulseSeq.current += 1;
      const e = communityEntry(pulseSeq.current);
      e.ts = Date.now();
      setPulse((prev) => [e, ...prev].slice(0, 40));
    }, 14_000);
    return () => clearInterval(id);
  }, [mode]);

  /* live: read the router's on-chain history — that's literally everyone */
  const fetchOnchain = useCallback(async () => {
    if (mode !== "live") return;
    setLiveLoading(true);
    try {
      const res = await fetch(routerTxFeed());
      if (!res.ok) throw new Error(String(res.status));
      const json = await res.json();
      const items: any[] = json?.items ?? [];
      const mapped: LedgerEntry[] = items
        .filter((it) => it?.hash && it?.from?.hash)
        .slice(0, 30)
        .map((it, i) => {
          const transfers: any[] = Array.isArray(it.token_transfers) ? it.token_transfers : [];
          const symbols = [
            ...new Set(transfers.map((t) => t?.token?.symbol).filter(Boolean) as string[]),
          ].slice(0, 3);
          const toDead = transfers.some(
            (t) => String(t?.to?.hash ?? "").toLowerCase() === "0x000000000000000000000000000000000000dead"
          );
          const ethValue = Number(it.value ?? "0") / 1e18;
          return {
            id: `chain-${it.hash}`,
            ts: it.timestamp ? Date.parse(it.timestamp) : Date.now() - i * 60_000,
            hash: it.hash,
            wallet: anonAddress(it.from.hash),
            walletAddr: it.from.hash,
            symbols: symbols.length ? symbols : ["router"],
            count: transfers.length || 1,
            usd: ethValue > 0 ? Number((ethValue * PRICES.ETH).toFixed(2)) : 0,
            destination: (toDead ? "burn" : symbols.length ? "sweep" : "eth") as LedgerDestination,
            own: false,
            live: true,
          };
        });
      setOnchain(mapped);
    } catch {
      /* explorer unreachable — fall back to an empty live feed quietly */
    } finally {
      setLiveLoading(false);
    }
  }, [mode]);

  useEffect(() => {
    fetchOnchain();
  }, [fetchOnchain]);

  /* re-render relative times every 20s */
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 20_000);
    return () => clearInterval(id);
  }, []);

  const entries = useMemo(() => {
    const pool = mode === "live" ? [...ownEntries, ...onchain] : [...ownEntries, ...pulse];
    return pool.sort((a, b) => b.ts - a.ts).slice(0, 40);
  }, [mode, ownEntries, onchain, pulse, tick]);

  const isLive = mode === "live";

  return (
    <section className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 pb-4 pt-5">
        <div className="flex items-center gap-2.5">
          <h2 className="font-display text-lg font-bold tracking-tight text-ink">the public ledger</h2>
          <StatusPill tone={isLive ? "acc" : "sky"}>
            <span className="pulse-dot inline-block h-1.5 w-1.5 rounded-full" style={{ background: isLive ? "var(--acc)" : "var(--sky)" }} />
            {isLive ? "on-chain · everyone" : "demo · everyone"}
          </StatusPill>
        </div>
        {isLive && (
          <button
            type="button"
            onClick={fetchOnchain}
            disabled={liveLoading}
            aria-label="refresh ledger"
            className="squircle h-9 w-9 border text-muted transition-colors hover:border-line-strong hover:text-ink disabled:opacity-50"
            style={{ borderColor: "var(--line)" }}
          >
            <span className={liveLoading ? "spin-slow inline-flex" : "inline-flex"}>
              <RefreshIcon size={15} />
            </span>
          </button>
        )}
      </div>

      <p className="border-t px-6 pb-4 pt-3 text-xs leading-relaxed text-muted" style={{ borderColor: "var(--line)" }}>
        {isLive
          ? "every transaction routed through the DEX router, straight off Blockscout. that's every wallet, including yours."
          : "a simulated crowd of apes cleaning up after themselves. your sweeps slot right in."}
      </p>

      <div className="border-t" style={{ borderColor: "var(--line)" }}>
        {entries.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-12 text-center">
            <span className="squircle h-12 w-12" style={{ background: "var(--bg-soft)", color: "var(--faint)", borderRadius: 18 }}>
              <GhostIcon size={22} />
            </span>
            <p className="mt-3 font-display text-base font-bold text-ink">nothing swept yet</p>
            <p className="mt-1 text-xs text-muted">the ledger is judging you. be the first.</p>
          </div>
        ) : (
          <ul>
            <AnimatePresence initial={false}>
              {entries.map((e) => (
                <LedgerRow key={e.id} entry={e} />
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>
    </section>
  );
}

function LedgerRow({ entry: e }: { entry: LedgerEntry }) {
  const destMeta: Record<LedgerDestination, { icon: React.ReactNode; label: string; tone: "acc" | "sky" | "coral" }> = {
    sweep: { icon: <ZapIcon size={12} />, label: "→ $SWEEP", tone: "acc" },
    eth: { icon: <EthIcon size={12} />, label: "→ ETH", tone: "sky" },
    burn: { icon: <FlameIcon size={12} />, label: "burned", tone: "coral" },
  };
  const d = destMeta[e.destination];

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={spring}
      className="flex items-center gap-3 border-b px-6 py-3 last:border-b-0"
      style={{ borderColor: "var(--line)" }}
    >
      {/* wallet */}
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className="font-mono text-[11px] text-muted">{e.wallet}</span>
        {e.own && (
          <span className="rounded-full px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-wide" style={{ background: "var(--acc-soft)", color: "var(--acc-ink)" }}>
            you
          </span>
        )}
        {e.live && !e.own && (
          <span className="hidden rounded-full px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-wide sm:inline-block" style={{ background: "var(--bg-soft)", color: "var(--faint)" }}>
            on-chain
          </span>
        )}
      </div>

      {/* symbols */}
      <div className="hidden items-center -space-x-1.5 md:flex">
        {e.symbols.slice(0, 3).map((s, i) => (
          <span key={`${s}-${i}`} className="rounded-full border" style={{ borderColor: "var(--card)" }}>
            <Monogram symbol={s} hue={hueOf(s)} size={22} />
          </span>
        ))}
        {e.count > 3 && <span className="pl-2 font-mono text-[10px] text-faint">+{e.count - 3}</span>}
      </div>

      {/* destination + value */}
      <div className="flex shrink-0 items-center gap-2.5">
        <span className="font-mono text-[11.5px] font-bold text-ink">{e.usd > 0 ? `$${e.usd.toFixed(2)}` : "—"}</span>
        <StatusPill tone={d.tone}>
          {d.icon}
          <span className="hidden sm:inline">{d.label}</span>
        </StatusPill>
      </div>

      {/* time + link */}
      <div className="flex w-16 shrink-0 items-center justify-end gap-2">
        <span className="font-mono text-[10px] text-faint">{relativeTime(e.ts)}</span>
        {e.hash && (
          <a
            href={explorerTx(e.hash)}
            target="_blank"
            rel="noopener noreferrer"
            referrerPolicy="no-referrer"
            aria-label="view transaction"
            className="squircle h-6 w-6 text-faint transition-colors hover:bg-bg-soft hover:text-ink"
            style={{ borderRadius: 8 }}
          >
            <ExternalIcon size={12} />
          </a>
        )}
      </div>
    </motion.li>
  );
}
