import { useMemo } from "react";
import { fmtNum, fmtUsd, shortAddr, DUST_CAP_USD_DEFAULT } from "../lib/chain";
import type { DustToken } from "../lib/demo";
import type { DustFilter } from "../hooks/useDustTokens";
import type { Destination } from "../hooks/useSweepQueue";
import { Badge, DeltaChip, TokenLogo } from "./ui";
import { CheckIcon, RadarIcon, RefreshIcon, SkullIcon, WarnIcon, WalletIcon } from "./icons";

interface Props {
  tokens: DustToken[];
  loading: boolean;
  error: string | null;
  connected: boolean;
  destination: Destination;
  selected: Set<string>;
  cutoff: number;
  filter: DustFilter;
  ignoredCount: number;
  onToggle: (addr: string) => void;
  onSetAll: (addrs: string[], on: boolean) => void;
  setCutoff: (v: number) => void;
  setFilter: (f: DustFilter) => void;
  onRetry: () => void;
  onConnect: () => void;
}

export function DustTable(p: Props) {
  const eligible = useMemo(
    () => p.tokens.filter((t) => (p.destination === "burn" ? t.kind === "dead" : t.kind === "liquid")),
    [p.tokens, p.destination]
  );
  const eligibleAddrs = eligible.map((t) => t.address);
  const allSelected = eligibleAddrs.length > 0 && eligibleAddrs.every((a) => p.selected.has(a));

  return (
    <section>
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-[13px] font-bold uppercase tracking-[0.2em] text-mist-300">
          03 · Dust positions
        </h2>
        <span className="font-mono text-[10px] text-mist-600">
          {p.connected ? `${eligible.length} eligible · ${p.selected.size} selected` : "scanner idle"}
        </span>
      </div>

      <div className="panel overflow-hidden">
        {/* filter bar */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 border-b border-ink-600 px-4 py-3">
          <div className="flex overflow-hidden rounded-md border border-ink-600">
            {(
              [
                { id: "all", label: "ALL DUST (< $5)" },
                { id: "dead", label: "DEAD / ZERO-LIQ" },
              ] as { id: DustFilter; label: string }[]
            ).map((f) => (
              <button
                key={f.id}
                onClick={() => p.setFilter(f.id)}
                className={`px-3 py-1.5 font-mono text-[10.5px] font-semibold tracking-wider transition-all ${
                  p.filter === f.id
                    ? f.id === "dead"
                      ? "bg-redx-500/15 text-redx-400"
                      : "bg-hood-500/15 text-hood-400"
                    : "bg-ink-800 text-mist-500 hover:text-mist-300"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex min-w-[220px] flex-1 items-center gap-3">
            <span className="font-mono text-[10px] uppercase tracking-widest text-mist-600">Cutoff</span>
            <input
              type="range"
              min={0.5}
              max={DUST_CAP_USD_DEFAULT}
              step={0.25}
              value={p.cutoff}
              onChange={(e) => p.setCutoff(parseFloat(e.target.value))}
              className="dust-slider w-full max-w-[240px]"
              style={{ ["--fill" as any]: `${((p.cutoff - 0.5) / (DUST_CAP_USD_DEFAULT - 0.5)) * 100}%` }}
              aria-label="Dust USD cutoff"
            />
            <span className="chip text-hood-400">≤ {fmtUsd(p.cutoff)}</span>
          </div>

          {p.ignoredCount > 0 && (
            <span className="font-mono text-[10px] text-mist-600">
              {p.ignoredCount} asset{p.ignoredCount > 1 ? "s" : ""} above cutoff ignored
            </span>
          )}
        </div>

        {/* table head */}
        <div className="grid grid-cols-[36px_minmax(0,1fr)_100px_110px_110px] items-center gap-3 border-b border-ink-600 bg-ink-850/70 px-4 py-2.5 sm:grid-cols-[40px_minmax(0,1fr)_130px_130px_130px]">
          <button
            onClick={() => p.onSetAll(eligibleAddrs, !allSelected)}
            disabled={eligibleAddrs.length === 0}
            aria-label="Select all eligible"
            className={`grid h-[17px] w-[17px] place-items-center rounded border transition-all disabled:opacity-30 ${
              allSelected ? "border-hood-400 bg-hood-500 text-ink-950" : "border-ink-500 bg-ink-800 hover:border-hood-500"
            }`}
          >
            {allSelected && <CheckIcon size={11} />}
          </button>
          {["Token", "Balance", "Est. value", "Status"].map((h, i) => (
            <span
              key={h}
              className={`font-mono text-[9.5px] font-semibold uppercase tracking-[0.2em] text-mist-600 ${i > 0 ? "text-right" : ""}`}
            >
              {h}
            </span>
          ))}
        </div>

        {/* body */}
        <div className="max-h-[440px] overflow-y-auto">
          {!p.connected && !p.loading && (
            <EmptyState
              icon={<RadarIcon size={34} className="text-ink-500" />}
              title="Scanner idle — no wallet attached"
              desc="Connect a browser wallet on Robinhood Chain, or spin up the demo wallet to watch the full sweep pipeline run."
            >
              <button onClick={p.onConnect} className="btn-primary flex items-center gap-2 px-5 py-2.5 text-[13px]">
                <WalletIcon size={15} /> CONNECT &amp; SCAN
              </button>
            </EmptyState>
          )}

          {p.loading && (
            <div className="divide-y divide-ink-700">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="grid grid-cols-[40px_minmax(0,1fr)_130px_130px_130px] items-center gap-3 px-4 py-3.5">
                  <div className="skeleton h-4 w-4" />
                  <div className="flex items-center gap-3">
                    <div className="skeleton h-9 w-9 rounded-full" />
                    <div className="space-y-1.5">
                      <div className="skeleton h-3.5 w-28" />
                      <div className="skeleton h-2.5 w-40" />
                    </div>
                  </div>
                  <div className="skeleton ml-auto h-3.5 w-16" />
                  <div className="skeleton ml-auto h-3.5 w-14" />
                  <div className="skeleton ml-auto h-5 w-20" />
                </div>
              ))}
            </div>
          )}

          {p.error && (
            <EmptyState
              icon={<WarnIcon size={32} className="text-amberx-400" />}
              title="Indexer unreachable"
              desc={p.error}
            >
              <button onClick={p.onRetry} className="btn-ghost flex items-center gap-2 px-4 py-2 text-[12px]">
                <RefreshIcon size={13} /> RETRY SCAN
              </button>
            </EmptyState>
          )}

          {!p.loading && !p.error && p.connected && p.tokens.length === 0 && (
            <EmptyState
              icon={<CheckIcon size={32} className="text-hood-400" />}
              title="Zero dust detected"
              desc="This wallet is clean. Every ERC-20 position is either above the cutoff or already swept."
            />
          )}

          {!p.loading && !p.error && p.tokens.map((t, idx) => {
            const isEligible = p.destination === "burn" ? t.kind === "dead" : t.kind === "liquid";
            const checked = p.selected.has(t.address);
            return (
              <div
                key={t.address}
                onClick={() => isEligible && p.onToggle(t.address)}
                className={`group grid cursor-pointer grid-cols-[36px_minmax(0,1fr)_100px_110px_110px] items-center gap-3 border-b border-ink-700/70 px-4 py-3 transition-all duration-150 sm:grid-cols-[40px_minmax(0,1fr)_130px_130px_130px] ${
                  checked
                    ? "bg-hood-500/[0.06] hover:bg-hood-500/[0.09]"
                    : "hover:bg-ink-700/40"
                } ${!isEligible ? "cursor-not-allowed opacity-35" : ""}`}
                style={{ animationDelay: `${idx * 30}ms` }}
              >
                {/* checkbox */}
                <span
                  className={`grid h-[17px] w-[17px] place-items-center rounded border transition-all ${
                    checked ? "border-hood-400 bg-hood-500 text-ink-950 shadow-[0_0_10px_rgba(34,224,111,.5)]" : "border-ink-500 bg-ink-800"
                  } ${isEligible ? "group-hover:border-hood-500" : ""}`}
                >
                  {checked && <CheckIcon size={11} />}
                </span>

                {/* identity */}
                <div className="flex min-w-0 items-center gap-3">
                  <TokenLogo symbol={t.symbol} hue={t.hue} dead={t.kind === "dead"} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-display text-[13.5px] font-semibold text-mist-100">{t.symbol}</span>
                      <span className="hidden truncate text-[11px] text-mist-600 md:inline">{t.name}</span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 font-mono text-[10px] text-mist-600">
                      <span>{shortAddr(t.address)}</span>
                      {!isEligible && (
                        <span className="text-amberx-500/90">
                          {p.destination === "burn" ? "· liquid — switch destination to swap" : "· no route — burn only"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* balance */}
                <div className="text-right font-mono text-[12px] text-mist-300">{fmtNum(t.balance)}</div>

                {/* value */}
                <div className="text-right">
                  <div className={`font-mono text-[13px] font-semibold ${t.kind === "dead" ? "text-redx-400" : "text-mist-100"}`}>
                    {t.kind === "dead" ? "UNINDEXED" : fmtUsd(t.usdValue)}
                  </div>
                  <div className="mt-0.5 flex justify-end"><DeltaChip value={t.change24h} /></div>
                </div>

                {/* status */}
                <div className="flex justify-end">
                  {t.kind === "dead" ? (
                    <Badge tone="red"><SkullIcon size={10} /> ZERO-LIQ</Badge>
                  ) : t.preApproved ? (
                    <Badge tone="cyan">LIQUID · APPR✓</Badge>
                  ) : (
                    <Badge tone="green">LIQUID</Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function EmptyState({ icon, title, desc, children }: {
  icon: React.ReactNode; title: string; desc: string; children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-full border border-ink-600 bg-ink-800">{icon}</div>
      <div>
        <p className="font-display text-[15px] font-semibold text-mist-100">{title}</p>
        <p className="mx-auto mt-1 max-w-sm font-mono text-[11px] leading-relaxed text-mist-500">{desc}</p>
      </div>
      {children}
    </div>
  );
}
