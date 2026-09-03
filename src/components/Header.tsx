import { useEffect, useState } from "react";
import { fmtUsd, robinhoodChain, shortAddr } from "../lib/chain";
import type { DustToken } from "../lib/demo";
import type { Mode } from "../hooks/useDustTokens";
import { Badge } from "./ui";
import { BroomIcon, ShieldIcon, Spinner, WalletIcon, XIcon, EthIcon, CoinIcon, WarnIcon } from "./icons";

/* ------------------------------------------------------------------ */
/*  Ticker tape — the terminal's heartbeat                             */
/* ------------------------------------------------------------------ */

export function Ticker({ tokens }: { tokens: DustToken[] }) {
  const items = tokens.length > 0 ? tokens : [];
  const row = (key: string) => (
    <div key={key} className="flex shrink-0 items-center" aria-hidden={key === "b"}>
      {items.map((t) => {
        const up = t.change24h >= 0;
        return (
          <span key={key + t.address} className="mx-5 flex items-center gap-2 font-mono text-[11px] whitespace-nowrap">
            <span className="font-semibold text-mist-300">{t.symbol}</span>
            <span className={t.kind === "dead" ? "text-redx-400" : "text-mist-100"}>
              {t.kind === "dead" ? "$0.00" : fmtUsd(t.usdValue)}
            </span>
            <span className={t.kind === "dead" ? "text-redx-500" : up ? "text-hood-400" : "text-redx-400"}>
              {t.kind === "dead" ? "✕ DEAD" : `${up ? "▲" : "▼"}${Math.abs(t.change24h).toFixed(1)}%`}
            </span>
            <span className="ml-3 text-ink-500">◆</span>
          </span>
        );
      })}
    </div>
  );

  return (
    <div className="relative z-20 flex h-8 items-center overflow-hidden border-b border-ink-600 bg-ink-950/90">
      <div className="absolute left-0 top-0 z-10 flex h-full items-center gap-1.5 border-r border-ink-600 bg-ink-950 px-3">
        <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-hood-500" />
        <span className="font-display text-[10px] font-bold tracking-[0.22em] text-hood-400">LIVE DUST FEED</span>
      </div>
      {items.length > 0 ? (
        <div className="ticker-track flex pl-40">
          {row("a")}
          {row("b")}
        </div>
      ) : (
        <div className="flex w-full items-center justify-center gap-2 pl-40 font-mono text-[11px] text-mist-600">
          <Spinner size={12} /> Awaiting wallet connection — dust scanner idle
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Header                                                             */
/* ------------------------------------------------------------------ */

interface HeaderProps {
  mode: Mode | null;
  address: string | null;
  sweepBalance: number;
  nativeBalance: number;
  isVip: boolean;
  tierProgress: number;
  connecting: boolean;
  chainMismatch: boolean;
  onOpenConnect: () => void;
  onDisconnect: () => void;
  onSwitchChain: () => void;
}

export function Header(p: HeaderProps) {
  const connected = !!p.address;

  return (
    <header className="sticky top-0 z-40 border-b border-ink-600 bg-ink-900/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        {/* brand */}
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg border border-hood-500/40 bg-gradient-to-br from-ink-700 to-ink-900 text-hood-400 shadow-[0_0_18px_-4px_rgba(34,224,111,.5)]">
            <BroomIcon size={21} />
          </div>
          <div className="leading-none">
            <div className="font-display text-lg font-bold tracking-[0.08em] text-mist-100">
              DUST<span className="text-hood-400">SWEEP</span>
            </div>
            <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.24em] text-mist-600">
              Robinhood Chain · Dust Terminal
            </div>
          </div>
        </div>

        {/* right cluster */}
        <div className="flex items-center gap-2.5">
          {/* network chip */}
          <div className="hidden items-center gap-2 rounded-md border border-ink-600 bg-ink-800/80 px-3 py-1.5 md:flex">
            <span className={`h-1.5 w-1.5 rounded-full ${p.chainMismatch ? "bg-amberx-500" : "bg-hood-500 pulse-dot"}`} />
            <span className="font-mono text-[11px] text-mist-300">
              {p.chainMismatch ? "Wrong network" : `Chain ${robinhoodChain.id}`}
            </span>
            <span className="text-ink-500">|</span>
            <span className="font-mono text-[11px] text-mist-500">{p.mode === "demo" ? "SIM RPC" : "MAINNET"}</span>
          </div>

          {p.chainMismatch && (
            <button onClick={p.onSwitchChain} className="btn-ghost flex items-center gap-1.5 px-3 py-2 text-[12px] text-amberx-400 hover:text-amberx-400">
              <WarnIcon size={13} /> Switch to 4663
            </button>
          )}

          {connected ? (
            <div className="flex items-center gap-2.5">
              <div className="hidden items-center gap-3 rounded-md border border-ink-600 bg-ink-800/80 px-3 py-1.5 lg:flex">
                <span className="flex items-center gap-1.5 font-mono text-[11px] text-mist-300">
                  <EthIcon size={12} className="text-cyanx-400" /> {p.nativeBalance.toFixed(4)}
                </span>
                <span className="text-ink-500">·</span>
                <span className="flex items-center gap-1.5 font-mono text-[11px] text-mist-300">
                  <CoinIcon size={13} className="text-hood-400" /> {p.sweepBalance.toLocaleString("en-US", { maximumFractionDigits: 0 })} SWEEP
                </span>
              </div>
              {p.isVip ? (
                <Badge tone="green">
                  <ShieldIcon size={11} /> VIP · 0% fee
                </Badge>
              ) : (
                <Badge tone="amber">{Math.round(p.tierProgress * 100)}% to VIP</Badge>
              )}
              <button
                onClick={p.onDisconnect}
                className="group flex items-center gap-2 rounded-md border border-hood-500/35 bg-hood-500/10 px-3 py-2 font-mono text-[12px] text-hood-300 transition-all hover:border-redx-500/50 hover:bg-redx-500/10 hover:text-redx-400"
                title="Disconnect"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-hood-400 group-hover:bg-redx-400" />
                {shortAddr(p.address!)}
                <XIcon size={11} className="opacity-50 group-hover:opacity-100" />
              </button>
            </div>
          ) : (
            <button onClick={p.onOpenConnect} className="btn-primary flex items-center gap-2 px-4 py-2.5 text-[13px]" disabled={p.connecting}>
              {p.connecting ? <Spinner size={14} /> : <WalletIcon size={15} />}
              {p.connecting ? "CONNECTING…" : "CONNECT WALLET"}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/*  Connect modal                                                      */
/* ------------------------------------------------------------------ */

export function ConnectModal({
  open, onClose, onDemo, onLive, connecting,
}: {
  open: boolean;
  onClose: () => void;
  onDemo: () => void;
  onLive: () => void;
  connecting: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-ink-950/80 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="rise-in w-full max-w-md rounded-xl border border-ink-600 bg-ink-800 p-6 shadow-[0_30px_80px_-20px_rgba(0,0,0,.9)]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold tracking-wide text-mist-100">Plug into the Chain</h2>
          <button onClick={onClose} className="text-mist-600 hover:text-mist-100"><XIcon size={16} /></button>
        </div>
        <p className="mt-1 font-mono text-[11px] text-mist-500">
          Target: Robinhood Chain · RPC <span className="text-mist-300">rpc.mainnet.chain.robinhood.com</span>
        </p>

        <div className="mt-5 space-y-3">
          <button
            onClick={onLive}
            disabled={connecting}
            className="group flex w-full items-center gap-4 rounded-lg border border-ink-600 bg-ink-850 p-4 text-left transition-all hover:border-hood-500/50 hover:bg-ink-700"
          >
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-hood-500/30 bg-hood-500/10 text-hood-400">
              {connecting ? <Spinner size={18} /> : <WalletIcon size={20} />}
            </div>
            <div className="flex-1">
              <div className="font-display text-[14px] font-semibold text-mist-100">Browser Wallet</div>
              <div className="mt-0.5 text-[12px] leading-snug text-mist-500">
                MetaMask / Rabby / Coinbase — real balances, real swaps. Auto-switches to Chain 4663.
              </div>
            </div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-mist-600 group-hover:text-hood-400">Live</span>
          </button>

          <button
            onClick={onDemo}
            className="group flex w-full items-center gap-4 rounded-lg border border-ink-600 bg-ink-850 p-4 text-left transition-all hover:border-cyanx-500/50 hover:bg-ink-700"
          >
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-cyanx-500/30 bg-cyanx-500/10 text-cyanx-400">
              <ZapGhost />
            </div>
            <div className="flex-1">
              <div className="font-display text-[14px] font-semibold text-mist-100">Demo Wallet</div>
              <div className="mt-0.5 text-[12px] leading-snug text-mist-500">
                Simulated wallet loaded with 15 dusty positions — full pipeline, zero risk.
              </div>
            </div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-mist-600 group-hover:text-cyanx-400">Sim</span>
          </button>
        </div>

        <p className="mt-4 rounded-md border border-amberx-500/25 bg-amberx-500/5 px-3 py-2 font-mono text-[10.5px] leading-relaxed text-amberx-400/90">
          ⚠ Dust swaps use {`15%`} slippage tolerance & fee-on-transfer routing. Sweeping is irreversible.
        </p>
      </div>
    </div>
  );
}

function ZapGhost() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 20 V11 A7 7 0 0 1 19 11 V20 L16.7 18 L14.3 20 L12 18 L9.7 20 L7.3 18 Z" />
      <path d="M13 7 L10.5 11 H13.5 L11 15" strokeWidth="1.6" />
    </svg>
  );
}
