import { useEffect, useMemo, useRef, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, useConnect, usePublicClient, useSwitchChain, useWalletClient } from "wagmi";
import { injected } from "wagmi/connectors";
import { AnimatePresence, motion } from "framer-motion";
import { wagmiConfig } from "./lib/wagmi";
import { ADDRESSES, erc20Abi, EXPLORER_URL, MIN_HOLDING_TIER, MIN_HOLDING_TIER_FMT, PRICES, robinhoodChain } from "./lib/chain";
import { DEMO_VIP_SWEEP_BALANCE, DEMO_WALLET } from "./lib/demo";
import { useDustTokens, type Mode } from "./hooks/useDustTokens";
import { useSweepQueue, type Destination } from "./hooks/useSweepQueue";
import { Header } from "./components/Header";
import { StatsBanner } from "./components/StatsBanner";
import { DestinationSelector } from "./components/DestinationSelector";
import { DustTable } from "./components/DustTable";
import { SweepConsole, type FeedItem } from "./components/SweepConsole";
import { LedgerPanel } from "./components/LedgerPanel";
import { anonAddress, loadLedger, saveLedger, type LedgerEntry } from "./lib/ledger";
import { ExecutionModal } from "./components/ExecutionModal";
import { ToastProvider, useToast } from "./components/Toasts";
import { Loader } from "./components/Loader";
import { Reveal, spring } from "./components/ui";
import { AlertIcon, ShieldIcon, SparkIcon, WalletIcon } from "./components/icons";

const queryClient = new QueryClient();

const MARQUEE = [
  "dust is just money you forgot about",
  "the average ape wallet hides 10+ tokens worth under $5",
  "sweeping to $SWEEP is 0% fee — forever, obviously",
  "gas on chain 4663 costs less than a gumball",
  "burned tokens live at 0x…dEaD. visit them sometime",
  "your bags are smaller than you remember",
  "one broom. three exits. zero contracts",
];

export default function App() {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <Shell />
        </ToastProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

/* ================================================================== */

function Shell() {
  const toast = useToast();
  const { connectAsync } = useConnect();
  const { switchChainAsync } = useSwitchChain();
  const publicClient = usePublicClient({ chainId: robinhoodChain.id });
  const { data: walletClient } = useWalletClient();

  /* ------------------------------ ui state ------------------------------ */
  const [loaderDone, setLoaderDone] = useState(false);
  const [theme, setTheme] = useState<string>(() => document.documentElement.dataset.theme ?? "light");
  const [walletOpen, setWalletOpen] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [chainMismatch, setChainMismatch] = useState(false);
  const [mode, setMode] = useState<Mode | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [richDemo, setRichDemo] = useState(false);
  const [destination, setDestination] = useState<Destination>("sweep");
  const [selection, setSelection] = useState<Set<string>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [session, setSession] = useState({ usd: 0, count: 0 });
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [liveSweep, setLiveSweep] = useState(0);
  /* this browser's own sweeps — persisted, shown in the public ledger */
  const [ledgerOwn, setLedgerOwn] = useState<LedgerEntry[]>(() => loadLedger());

  /* ------------------------------ data ------------------------------ */
  const dust = useDustTokens({ address, mode });
  const sweepBalance = mode === "demo" ? (richDemo ? DEMO_VIP_SWEEP_BALANCE : DEMO_WALLET.sweepBalance) : liveSweep;
  const isVip = sweepBalance >= Number(MIN_HOLDING_TIER);

  const queue = useSweepQueue({ mode, address, isVip, destination, publicClient, walletClient });

  /* live VIP read — platformToken.balanceOf */
  useEffect(() => {
    if (mode !== "live" || !publicClient || !address) return;
    let on = true;
    publicClient
      .readContract({
        address: ADDRESSES.platformToken as `0x${string}`,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [address as `0x${string}`],
      })
      .then((b) => on && setLiveSweep(Number(b as bigint) / 1e18))
      .catch(() => {});
    return () => {
      on = false;
    };
  }, [mode, publicClient, address]);

  /* ------------------------------ theme ------------------------------ */
  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    document.documentElement.style.backgroundColor = next === "dark" ? "#131318" : "#faf9f7";
    try {
      localStorage.setItem("ds-theme", next);
    } catch {}
    document.documentElement.classList.add("theme-anim");
    window.setTimeout(() => document.documentElement.classList.remove("theme-anim"), 520);
  };

  /* ------------------------------ wallets ------------------------------ */
  const connectDemo = () => {
    setMode("demo");
    setAddress(DEMO_WALLET.address);
    setWalletOpen(false);
    toast("ok", "demo wallet attached", "fake money, real emotional growth.");
  };

  const connectLive = async () => {
    setConnecting(true);
    setChainMismatch(false);
    try {
      const res = await connectAsync({ connector: injected() });
      if (res.chainId !== robinhoodChain.id) {
        try {
          await switchChainAsync({ chainId: robinhoodChain.id });
        } catch {
          setChainMismatch(true);
          setConnecting(false);
          return;
        }
      }
      setMode("live");
      setAddress(res.accounts[0]);
      setWalletOpen(false);
      toast("ok", "wallet attached", `chain 4663 · ${res.accounts[0].slice(0, 8)}…`);
    } catch (e: any) {
      toast("err", "connection refused", e?.message?.slice(0, 90) ?? "the wallet said no. rude.");
    } finally {
      setConnecting(false);
    }
  };

  const disconnect = () => {
    setMode(null);
    setAddress(null);
    setSelection(new Set());
    setRichDemo(false);
    toast("info", "wallet detached", "the dust remains. it always does.");
  };

  /* ------------------------------ selection ------------------------------ */
  const rawSelected = useMemo(() => dust.tokens.filter((t) => selection.has(t.address)), [dust.tokens, selection]);
  const selectedTokens = useMemo(
    () => (destination === "burn" ? rawSelected.filter((t) => t.kind === "dead") : rawSelected.filter((t) => t.kind === "liquid")),
    [rawSelected, destination]
  );
  const mismatchCount = rawSelected.length - selectedTokens.length;

  const toggleOne = (addr: string) =>
    setSelection((prev) => {
      const next = new Set(prev);
      if (next.has(addr)) next.delete(addr);
      else next.add(addr);
      return next;
    });

  const toggleAll = () =>
    setSelection((prev) => {
      const all = dust.tokens.every((t) => prev.has(t.address));
      return all ? new Set<string>() : new Set(dust.tokens.map((t) => t.address));
    });

  /* ------------------------------ sweep ------------------------------ */
  const onSweep = () => {
    if (selectedTokens.length === 0 || queue.running) return;
    setModalOpen(true);
    queue.start(selectedTokens, destination, isVip);
  };

  /* queue finished → session, feed, toasts, prune, rescan */
  const handledRef = useRef<unknown>(null);
  useEffect(() => {
    if (!queue.finished || queue.steps.length === 0 || handledRef.current === queue.steps) return;
    handledRef.current = queue.steps;
    const s = queue.summary;
    const destLabel = destination === "sweep" ? "$SWEEP" : destination === "eth" ? "ETH" : "the void";
    setSession((prev) => ({ usd: prev.usd + s.usdSwept, count: prev.count + s.confirmed }));
    setFeed((prev) =>
      [
        {
          id: Date.now(),
          ok: s.failed === 0,
          text: s.failed === 0 ? `swept ${s.confirmed} → ${destLabel} (+$${s.usdSwept.toFixed(2)})` : `${s.confirmed} swept · ${s.failed} resisted`,
          time: new Date().toLocaleTimeString("en-US", { hour12: false }),
        },
        ...prev,
      ].slice(0, 6)
    );
    setSelection((prev) => {
      const next = new Set(prev);
      queue.steps.filter((st) => st.status === "confirmed").forEach((st) => next.delete(st.tokenAddress));
      return next;
    });
    /* record this sweep in the public ledger */
    if (s.confirmed > 0 && address) {
      const confirmedMain = queue.steps.filter((st) => st.status === "confirmed" && (st.kind === "swap" || st.kind === "burn"));
      const symbols = [...new Set(confirmedMain.map((st) => st.symbol))];
      const entry: LedgerEntry = {
        id: `own-${Date.now()}`,
        ts: Date.now(),
        hash: mode === "live" ? confirmedMain.find((st) => st.hash)?.hash : undefined,
        wallet: anonAddress(address),
        walletAddr: address,
        symbols,
        count: symbols.length,
        usd: Number(s.usdSwept.toFixed(2)),
        destination,
        own: true,
        live: mode === "live",
      };
      setLedgerOwn((prev) => {
        const next = [entry, ...prev].slice(0, 60);
        saveLedger(next);
        return next;
      });
    }
    if (s.failed === 0 && s.confirmed > 0) {
      toast("ok", destination === "burn" ? "sent to the void." : "dust consolidated.", `${s.confirmed} token${s.confirmed > 1 ? "s" : ""} · +$${s.usdSwept.toFixed(2)} in ${destLabel}. you're welcome.`);
    } else if (s.failed > 0) {
      toast("warn", `${s.failed} token${s.failed > 1 ? "s" : ""} resisted.`, "retry from the modal. they tire eventually.");
    }
    if (s.confirmed > 0) dust.refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queue.finished]);

  /* ------------------------------ ambient motes ------------------------------ */
  const motes = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        id: i,
        left: `${(i * 71 + 13) % 100}%`,
        size: 3 + ((i * 7) % 5),
        d: `${16 + ((i * 5) % 14)}s`,
        dl: `${-((i * 3.7) % 20)}s`,
        x: `${((i % 5) - 2) * 22}px`,
        o: 0.1 + ((i * 13) % 10) / 70,
      })),
    []
  );

  const gasUsdAll = dust.allDust.length * 2.5 * PRICES.gasPerTx * PRICES.ETH;

  /* ================================================================== */

  return (
    <div className="relative min-h-screen">
      {/* ambient background — soft tints + drifting dust motes */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div
          className="absolute -left-32 -top-32 h-[480px] w-[480px] rounded-full"
          style={{ background: "var(--acc-soft)", filter: "blur(90px)", opacity: "var(--tint-o)" }}
        />
        <div
          className="absolute -right-40 top-1/3 h-[420px] w-[420px] rounded-full"
          style={{ background: "var(--gold-soft)", filter: "blur(100px)", opacity: "var(--tint-o)" }}
        />
        {motes.map((m) => (
          <span
            key={m.id}
            className="mote"
            style={{
              left: m.left,
              width: m.size,
              height: m.size,
              ["--d" as string]: m.d,
              ["--dl" as string]: m.dl,
              ["--x" as string]: m.x,
              ["--o" as string]: m.o,
            }}
          />
        ))}
      </div>

      {!loaderDone && <Loader onDone={() => setLoaderDone(true)} />}

      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        address={address}
        mode={mode}
        isVip={isVip}
        onOpenWallet={() => setWalletOpen(true)}
        onDisconnect={disconnect}
      />

      {/* deadpan ticker */}
      <div className="relative z-10 overflow-hidden border-b py-2.5" style={{ borderColor: "var(--line)", background: "var(--card-soft)", backdropFilter: "blur(10px)" }}>
        <div className="marquee-track flex w-max items-center gap-8">
          {[...MARQUEE, ...MARQUEE].map((m, i) => (
            <span key={i} className="flex items-center gap-8 font-mono text-[11px] text-muted">
              {m} <span className="text-faint">·</span>
            </span>
          ))}
        </div>
      </div>

      <motion.main
        className="relative z-10 mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6"
        initial={{ opacity: 0, y: 24 }}
        animate={loaderDone ? { opacity: 1, y: 0 } : {}}
        transition={{ ...spring, delay: 0.15 }}
      >
        <StatsBanner
          totalUsd={dust.totalUsd}
          tokenCount={dust.allDust.length}
          liquidUsd={dust.liquidUsd}
          deadCount={dust.dead.length}
          gasUsdAll={gasUsdAll}
          ignoredCount={dust.ignoredCount}
          loading={dust.loading}
          lastScan={dust.lastScan}
          connected={!!address}
          onAttach={() => setWalletOpen(true)}
        />

        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0 space-y-6">
            <DestinationSelector
              destination={destination}
              setDestination={setDestination}
              isVip={isVip}
              minTierLabel={MIN_HOLDING_TIER_FMT}
              disabled={queue.running}
            />
            <DustTable
              tokens={dust.tokens}
              allCount={dust.allDust.length}
              deadCount={dust.dead.length}
              loading={dust.loading}
              error={dust.error}
              connected={!!address}
              refresh={dust.refresh}
              cutoff={dust.cutoff}
              setCutoff={dust.setCutoff}
              filter={dust.filter}
              setFilter={dust.setFilter}
              selection={selection}
              onToggle={toggleOne}
              onToggleAll={toggleAll}
              ignoredCount={dust.ignoredCount}
              ignoredLabel={dust.ignoredDemo.symbol}
            />
          </div>

          <div className="lg:sticky lg:top-24">
            <SweepConsole
              selectedTokens={selectedTokens}
              mismatchCount={mismatchCount}
              destination={destination}
              isVip={isVip}
              sweepBalance={sweepBalance}
              demoMode={mode === "demo"}
              richDemo={richDemo}
              onToggleRichDemo={() => setRichDemo((r) => !r)}
              onSweep={onSweep}
              running={queue.running}
              session={session}
              feed={feed}
              minTierLabel={MIN_HOLDING_TIER_FMT}
            />
          </div>
        </div>

        {/* the public ledger — every sweep by every wallet */}
        <div className="mt-6">
          <Reveal>
            <LedgerPanel ownEntries={ledgerOwn} mode={mode} />
          </Reveal>
        </div>

        {/* footer */}
        <footer className="mt-14 flex flex-wrap items-center justify-between gap-3 border-t pt-6" style={{ borderColor: "var(--line)" }}>
          <p className="font-mono text-[11px] text-faint">dustsweep — a broom for your blockchain regrets.</p>
          <div className="flex items-center gap-4 font-mono text-[11px]">
            <a className="text-muted transition-colors hover:text-ink" href={EXPLORER_URL} target="_blank" rel="noreferrer">
              blockscout
            </a>
            <a className="text-muted transition-colors hover:text-ink" href={`${EXPLORER_URL}/address/${ADDRESSES.dexRouter}`} target="_blank" rel="noreferrer">
              router
            </a>
            <span className="text-faint">chain 4663 · no contracts · no custody</span>
          </div>
        </footer>
      </motion.main>

      <ExecutionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        steps={queue.steps}
        progress={queue.progress}
        running={queue.running}
        finished={queue.finished}
        summary={queue.summary}
        destination={destination}
        address={address}
        onAbort={queue.abort}
        onRetry={queue.retryFailed}
      />

      {/* wallet sheet */}
      <AnimatePresence>
        {walletOpen && (
          <motion.div className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0" style={{ background: "var(--scrim)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }} onClick={() => setWalletOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 60, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.97 }}
              transition={spring}
              className="card relative w-full max-w-md overflow-hidden rounded-[1.75rem] p-6"
            >
              <h2 className="font-display text-xl font-bold tracking-tight text-ink">attach a wallet</h2>
              <p className="mt-1 text-[13px] text-muted">two doors. same broom.</p>

              <div className="mt-5 space-y-2.5">
                <WalletOption
                  icon={<SparkIcon size={19} />}
                  bg="var(--gold-soft)"
                  fg="var(--gold-ink)"
                  title="demo wallet"
                  sub="instant · fake money · zero shame"
                  onClick={connectDemo}
                />
                <WalletOption
                  icon={<WalletIcon size={19} />}
                  bg="var(--sky-soft)"
                  fg="var(--sky-ink)"
                  title="browser wallet"
                  sub={connecting ? "asked nicely… check the popup" : "must be on robinhood chain · 4663"}
                  onClick={connectLive}
                  busy={connecting}
                />
              </div>

              {chainMismatch && (
                <p className="mt-4 flex items-start gap-2 rounded-2xl px-4 py-3 text-xs leading-snug" style={{ background: "var(--coral-soft)", color: "var(--coral-ink)" }}>
                  <AlertIcon size={15} className="mt-0.5 shrink-0" />
                  wrong chain in there. switch your wallet to Robinhood Chain (4663) and try again.
                </p>
              )}

              <p className="mt-5 flex items-center justify-center gap-1.5 border-t pt-4 font-mono text-[10px] uppercase tracking-[0.14em] text-faint" style={{ borderColor: "var(--line)" }}>
                <ShieldIcon size={12} /> no custody · we just point at the router
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

function WalletOption({ icon, bg, fg, title, sub, onClick, busy }: { icon: React.ReactNode; bg: string; fg: string; title: string; sub: string; onClick: () => void; busy?: boolean }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={busy}
      whileHover={busy ? undefined : { scale: 1.015 }}
      whileTap={busy ? undefined : { scale: 0.98 }}
      transition={spring}
      className="flex w-full items-center gap-4 rounded-2xl border px-4 py-4 text-left outline-none transition-colors hover:border-line-strong disabled:opacity-70"
      style={{ borderColor: "var(--line)", background: "var(--bg-soft)" }}
    >
      <span className="squircle h-11 w-11 shrink-0" style={{ background: bg, color: fg }}>
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-[15px] font-bold text-ink">{title}</span>
        <span className="mt-0.5 block text-xs text-muted">{sub}</span>
      </span>
      {busy && (
        <span className="spin-slow inline-flex text-faint">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 3a9 9 0 1 0 9 9" />
          </svg>
        </span>
      )}
    </motion.button>
  );
}
