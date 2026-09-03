import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, useAccount, useBalance, useConnect, useDisconnect, usePublicClient, useReadContract, useSwitchChain, useWalletClient } from "wagmi";
import { formatEther } from "viem";
import { injected } from "wagmi/connectors";

import { wagmiConfig } from "./lib/wagmi";
import {
  ADDRESSES, erc20Abi, explorerAddress, fmtUsd, MIN_HOLDING_TIER, PRICES, robinhoodChain, shortAddr,
} from "./lib/chain";
import { DEMO_VIP_SWEEP_BALANCE, DEMO_WALLET } from "./lib/demo";
import { useDustTokens, type Mode } from "./hooks/useDustTokens";
import { useSweepQueue, type Destination } from "./hooks/useSweepQueue";

import { ToastProvider, useToasts } from "./components/Toasts";
import { Header, Ticker, ConnectModal } from "./components/Header";
import { StatsBanner } from "./components/StatsBanner";
import { DestinationSelector } from "./components/DestinationSelector";
import { DustTable } from "./components/DustTable";
import { SweepConsole, type ActivityEntry } from "./components/SweepConsole";
import { ExecutionModal } from "./components/ExecutionModal";
import { Reveal } from "./components/ui";
import { CopyIcon, ExtIcon, BroomIcon } from "./components/icons";

const queryClient = new QueryClient();

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
/*  Shell — all state orchestration                                    */
/* ================================================================== */

function Shell() {
  const { push } = useToasts();

  /* ---------- wallet (wagmi) ---------- */
  const { address: liveAddress, chainId, isConnected } = useAccount();
  const { connectAsync } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const publicClient = usePublicClient({ chainId: robinhoodChain.id });
  const { data: walletClient } = useWalletClient();

  const [mode, setMode] = useState<Mode | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [connectOpen, setConnectOpen] = useState(false);
  const [demoVip, setDemoVip] = useState(false);

  /* if the injected wallet drops, fall back to idle */
  useEffect(() => {
    if (mode === "live" && !isConnected) setMode(null);
  }, [mode, isConnected]);

  /* live $SWEEP balance (token gate) */
  const { data: sweepBalRaw } = useReadContract({
    address: ADDRESSES.platformToken as `0x${string}`,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [(liveAddress ?? "0x0000000000000000000000000000000000000000") as `0x${string}`],
    query: { enabled: mode === "live" && !!liveAddress },
  });

  /* live native balance */
  const { data: nativeBal } = useBalance({
    address: liveAddress,
    query: { enabled: mode === "live" && !!liveAddress },
  });

  const address = mode === "demo" ? DEMO_WALLET.address : mode === "live" ? (liveAddress ?? null) : null;
  const sweepBalance =
    mode === "demo" ? (demoVip ? DEMO_VIP_SWEEP_BALANCE : DEMO_WALLET.sweepBalance)
    : Number(sweepBalRaw ?? 0n) / 1e18;
  const nativeBalance = mode === "demo" ? DEMO_WALLET.nativeBalance : Number(formatEther(nativeBal?.value ?? 0n));
  const isVip = sweepBalance >= Number(MIN_HOLDING_TIER);
  const tierProgress = Math.min(1, sweepBalance / Number(MIN_HOLDING_TIER));
  const chainMismatch = mode === "live" && !!chainId && chainId !== robinhoodChain.id;

  /* ---------- connect flows ---------- */
  const connectLive = useCallback(async () => {
    setConnecting(true);
    try {
      const res = await connectAsync({ connector: injected() });
      setMode("live");
      setConnectOpen(false);
      push({ kind: "success", title: "Wallet connected", desc: `Live on ${shortAddr(res.accounts[0] ?? "")} — scanning Robinhood Chain…` });
      if (res.chainId !== robinhoodChain.id) {
        try { await switchChain({ chainId: robinhoodChain.id }); } catch { /* user may approve later */ }
      }
    } catch (e: any) {
      const msg = String(e?.message ?? "");
      push({
        kind: "error",
        title: "No injected wallet found",
        desc: msg.includes("Connector not found") || msg.includes("injected")
          ? "Install MetaMask / Rabby, or launch the Demo Wallet to explore."
          : msg.slice(0, 140),
      });
    } finally {
      setConnecting(false);
    }
  }, [connectAsync, push, switchChain]);

  const connectDemo = useCallback(() => {
    setMode("demo");
    setDemoVip(false);
    setConnectOpen(false);
    push({
      kind: "info",
      title: "Demo wallet attached",
      desc: `${shortAddr(DEMO_WALLET.address)} · 15 dusty positions loaded · execution simulated`,
    });
  }, [push]);

  const disconnectAll = useCallback(() => {
    if (mode === "live") disconnect();
    setMode(null);
    setSelected(new Set());
    push({ kind: "info", title: "Disconnected", desc: "Scanner idle — dust state cleared." });
  }, [mode, disconnect, push]);

  /* ---------- dust indexing ---------- */
  const dust = useDustTokens({ address, mode });

  /* ---------- destination + selection ---------- */
  const [destination, setDestination] = useState<Destination>("sweep");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);

  const eligibleSelected = useMemo(
    () => dust.tokens.filter((t) => selected.has(t.address) && (destination === "burn" ? t.kind === "dead" : t.kind === "liquid")),
    [dust.tokens, selected, destination]
  );

  /* prune selection when route/filter changes */
  useEffect(() => {
    setSelected((prev) => {
      const keep = new Set(
        dust.tokens
          .filter((t) => prev.has(t.address) && (destination === "burn" ? t.kind === "dead" : t.kind === "liquid"))
          .map((t) => t.address)
      );
      return keep.size === prev.size ? prev : keep;
    });
  }, [destination, dust.tokens]);

  const toggle = useCallback((addr: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(addr)) next.delete(addr);
      else next.add(addr);
      return next;
    });
  }, []);

  const setAll = useCallback((addrs: string[], on: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      addrs.forEach((a) => (on ? next.add(a) : next.delete(a)));
      return next;
    });
  }, []);

  /* ---------- sweep queue ---------- */
  const queue = useSweepQueue({
    mode,
    address,
    isVip,
    destination,
    publicClient,
    walletClient,
  });

  const startSweep = useCallback(() => {
    if (eligibleSelected.length === 0 || queue.running) return;
    setModalOpen(true);
    queue.start(eligibleSelected, destination, isVip);
    push({
      kind: "info",
      title: "Sweep queue started",
      desc: `${eligibleSelected.length} token${eligibleSelected.length > 1 ? "s" : ""} → ${destination === "sweep" ? "$SWEEP" : destination === "eth" ? "ETH" : "burn"} · sequential execution, no nonce collisions`,
    });
  }, [eligibleSelected, destination, isVip, queue, push]);

  /* on finish → log activity + toast (once per run) */
  const finishedRef = useRef(false);
  useEffect(() => {
    if (queue.finished && !finishedRef.current && queue.steps.length > 0) {
      finishedRef.current = true;
      const s = queue.summary;
      setActivity((prev) =>
        [
          {
            id: Date.now(),
            time: new Date().toLocaleTimeString("en-US", { hour12: false }),
            dest: destination,
            count: s.confirmed,
            usd: s.usdSwept,
          },
          ...prev,
        ].slice(0, 5)
      );
      if (s.failed > 0) {
        push({ kind: "error", title: `${s.failed} position${s.failed > 1 ? "s" : ""} failed to sweep`, desc: `${s.failedSymbols.join(", ")} — retry from the queue panel.` });
      } else if (s.confirmed > 0) {
        push({ kind: "success", title: "Sweep complete", desc: `${s.confirmed} token${s.confirmed > 1 ? "s" : ""} swept · ${fmtUsd(s.usdSwept)} ${destination === "burn" ? "purged" : "recovered"}` });
      }
    }
    if (!queue.finished) finishedRef.current = false;
  }, [queue.finished, queue.summary, queue.steps.length, destination, push]);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    if (queue.finished) {
      queue.reset();
      setSelected(new Set());
      dust.refresh();
    }
  }, [queue, dust]);

  /* ---------- derived for banner ---------- */
  const gasUsdAll =
    dust.allDust.length > 0
      ? (dust.allDust.length + dust.liquid.filter((t) => !t.preApproved).length + (!isVip ? dust.liquid.length : 0)) *
        PRICES.gasPerTx * PRICES.ETH
      : 0;

  return (
    <div className="relative min-h-screen">
      {/* ambient layers */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-glow-layer" aria-hidden />
      <div className="pointer-events-none fixed inset-0 z-0 bg-grid-layer" aria-hidden />

      <div className="relative z-10">
        <Ticker tokens={mode ? dust.allDust : []} />
        <Header
          mode={mode}
          address={address}
          sweepBalance={sweepBalance}
          nativeBalance={nativeBalance}
          isVip={isVip}
          tierProgress={tierProgress}
          connecting={connecting}
          chainMismatch={chainMismatch}
          onOpenConnect={() => setConnectOpen(true)}
          onDisconnect={disconnectAll}
          onSwitchChain={() => switchChain({ chainId: robinhoodChain.id })}
        />

        <main className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6">
          {/* 01 · readout */}
          <Reveal>
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
            />
          </Reveal>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            {/* left rail */}
            <div className="min-w-0 space-y-6">
              <Reveal delay={80}>
                <DestinationSelector
                  value={destination}
                  onChange={setDestination}
                  isVip={isVip}
                  disabled={queue.running}
                />
              </Reveal>
              <Reveal delay={140}>
                <DustTable
                  tokens={dust.tokens}
                  loading={dust.loading}
                  error={dust.error}
                  connected={!!address}
                  destination={destination}
                  selected={selected}
                  cutoff={dust.cutoff}
                  filter={dust.filter}
                  ignoredCount={dust.ignoredCount}
                  onToggle={toggle}
                  onSetAll={setAll}
                  setCutoff={dust.setCutoff}
                  setFilter={dust.setFilter}
                  onRetry={dust.refresh}
                  onConnect={() => setConnectOpen(true)}
                />
              </Reveal>
            </div>

            {/* right rail */}
            <Reveal delay={200}>
              <SweepConsole
                destination={destination}
                isVip={isVip}
                demoMode={mode === "demo"}
                demoVip={demoVip}
                onToggleDemoVip={setDemoVip}
                sweepBalance={sweepBalance}
                selectedTokens={eligibleSelected}
                running={queue.running}
                onSweep={startSweep}
                onJumpToDest={setDestination}
                activity={activity}
              />
            </Reveal>
          </div>
        </main>

        <Footer onCopy={(label, val) => copyToClipboard(label, val, push)} />
      </div>

      <ConnectModal
        open={connectOpen}
        onClose={() => setConnectOpen(false)}
        onDemo={connectDemo}
        onLive={connectLive}
        connecting={connecting}
      />

      <ExecutionModal
        open={modalOpen}
        mode={mode}
        steps={queue.steps}
        running={queue.running}
        finished={queue.finished}
        progress={queue.progress}
        destination={destination}
        summary={queue.summary}
        onClose={closeModal}
        onAbort={queue.abort}
        onRetry={queue.retryFailed}
      />
    </div>
  );
}

function copyToClipboard(label: string, value: string, push: (t: any) => void) {
  navigator.clipboard?.writeText(value).then(
    () => push({ kind: "success", title: `${label} copied`, desc: shortAddr(value) }),
    () => push({ kind: "error", title: "Clipboard unavailable" })
  );
}

/* ================================================================== */
/*  Footer — contracts, network, fine print                            */
/* ================================================================== */

function Footer({ onCopy }: { onCopy: (label: string, val: string) => void }) {
  const contracts = [
    { label: "DEX V2 Router", value: ADDRESSES.dexRouter },
    { label: "WETH", value: ADDRESSES.weth },
    { label: "$SWEEP Token", value: ADDRESSES.platformToken },
    { label: "Burn Address", value: ADDRESSES.dead },
  ];
  return (
    <footer className="relative z-10 border-t border-ink-600 bg-ink-950/70">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-10 sm:px-6 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2">
            <BroomIcon size={16} className="text-hood-400" />
            <span className="font-display text-[13px] font-bold tracking-[0.1em] text-mist-100">
              DUST<span className="text-hood-400">SWEEP</span>
            </span>
          </div>
          <p className="mt-3 max-w-xs text-[12px] leading-relaxed text-mist-500">
            Serverless dust consolidation for Robinhood Chain. Zero custom contracts — only ERC-20 transfers and the
            deployed Uniswap V2 router. All logic runs client-side against public RPC + Blockscout.
          </p>
        </div>

        <div>
          <h4 className="font-mono text-[10px] uppercase tracking-[0.24em] text-mist-600">Key addresses</h4>
          <ul className="mt-3 space-y-2">
            {contracts.map((c) => (
              <li key={c.label} className="flex items-center justify-between gap-3">
                <span className="font-mono text-[11px] text-mist-500">{c.label}</span>
                <span className="flex items-center gap-1.5">
                  <a
                    href={explorerAddress(c.value)}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-[11px] text-mist-300 transition-colors hover:text-hood-400"
                  >
                    {shortAddr(c.value)}
                  </a>
                  <ExtIcon size={10} className="text-mist-600" />
                  <button onClick={() => onCopy(c.label, c.value)} className="text-mist-600 transition-colors hover:text-hood-400" aria-label={`Copy ${c.label}`}>
                    <CopyIcon size={12} />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-mono text-[10px] uppercase tracking-[0.24em] text-mist-600">Network</h4>
          <ul className="mt-3 space-y-1.5 font-mono text-[11px] text-mist-500">
            <li>Chain ID <span className="text-mist-300">4663</span> · hex <span className="text-mist-300">0x1237</span></li>
            <li>Native <span className="text-mist-300">ETH (18 dec)</span></li>
            <li className="break-all">RPC <span className="text-mist-300">rpc.mainnet.chain.robinhood.com</span></li>
            <li>
              Explorer{" "}
              <a href="https://robinhoodchain.blockscout.com" target="_blank" rel="noreferrer" className="text-hood-400 hover:underline">
                robinhoodchain.blockscout.com
              </a>
            </li>
          </ul>
          <p className="mt-4 rounded-md border border-ink-700 bg-ink-850/60 px-3 py-2 font-mono text-[10px] leading-relaxed text-mist-600">
            ⚠ Swaps execute with a 15% slippage guard and fee-on-transfer routing. Dust is volatile; recoverable value is
            an estimate, not a quote. Demo mode simulates execution end-to-end.
          </p>
        </div>
      </div>
      <div className="border-t border-ink-700 py-4 text-center font-mono text-[10px] tracking-wider text-mist-600">
        DUSTSWEEP · built for the apes of Chain 4663 · no contracts deployed, no keys held
      </div>
    </footer>
  );
}
