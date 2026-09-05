import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { isAddress } from "viem";
import { BLOCKSCOUT_API, DUST_CAP_USD_DEFAULT, DUST_FLOOR_USD, sanitizeLabel } from "../lib/chain";
import { buildDemoTokens, DEMO_IGNORED, rand, type DustToken } from "../lib/demo";

export type DustFilter = "all" | "dead";
export type Mode = "demo" | "live";

interface UseDustTokensArgs {
  address: string | null;
  mode: Mode | null;
}

/**
 * useDustTokens — Phase 2 token indexer.
 *
 * live : GET {BLOCKSCOUT_API}/addresses/{address}/tokens → parse ERC-20
 *        balances, value them via the indexer's exchange_rate, and split
 *        liquid (rated, pair with reserves) from dead (unrated / zero-liq).
 * demo : same DustToken contract, simulated feed with a live price-jitter
 *        interval so the terminal feels alive.
 */
export function useDustTokens({ address, mode }: UseDustTokensArgs) {
  const [tokens, setTokens] = useState<DustToken[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastScan, setLastScan] = useState<Date | null>(null);
  const [cutoff, setCutoff] = useState(DUST_CAP_USD_DEFAULT);
  const [filter, setFilter] = useState<DustFilter>("all");
  const scanSeq = useRef(0);

  const scan = useCallback(async () => {
    if (!address || !mode) return;
    const seq = ++scanSeq.current;
    setLoading(true);
    setError(null);

    if (mode === "demo") {
      await new Promise((r) => setTimeout(r, 1300 + rand(0, 500)));
      if (seq !== scanSeq.current) return;
      setTokens(buildDemoTokens());
      setLastScan(new Date());
      setLoading(false);
      return;
    }

    /* ---- live Blockscout path ---- */
    try {
      const res = await fetch(`${BLOCKSCOUT_API}/addresses/${address}/tokens?type=ERC-20`);
      if (!res.ok) throw new Error(`Blockscout responded ${res.status}`);
      const json = await res.json();
      const items: any[] = json?.items ?? [];

      const parsed: DustToken[] = items
        .filter((it) => {
          if (!it?.value || !it?.token) return false;
          try {
            return BigInt(it.value) > 0n && isAddress(String(it.token.address ?? ""));
          } catch {
            return false;
          }
        })
        .map((it) => {
          const t = it.token;
          const decimals = Math.min(36, Math.max(0, Number(t.decimals ?? 18)));
          const balance = Number(BigInt(it.value)) / 10 ** decimals;
          const rate = typeof t.exchange_rate === "string" ? parseFloat(t.exchange_rate) : null;
          const usdValue = rate && isFinite(rate) ? balance * rate : 0;
          return {
            address: t.address,
            name: sanitizeLabel(t.name ?? "unknown token", 32),
            symbol: sanitizeLabel(t.symbol ?? "???", 12),
            decimals,
            balanceRaw: BigInt(it.value),
            balance,
            usdValue,
            change24h: 0,
            /** unrated by the indexer ⇒ no liquid pair ⇒ dead */
            kind: rate && isFinite(rate) && rate > 0 ? ("liquid" as const) : ("dead" as const),
            hue: Math.abs(hashCode(t.address)) % 360,
          };
        });

      if (seq !== scanSeq.current) return;
      setTokens(parsed);
      setLastScan(new Date());
      setLoading(false);
    } catch (e: any) {
      if (seq !== scanSeq.current) return;
      setError(e?.message ?? "Failed to reach the Blockscout indexer");
      setLoading(false);
    }
  }, [address, mode]);

  useEffect(() => {
    setTokens([]);
    setLastScan(null);
    setError(null);
    scan();
  }, [scan]);

  /* demo price jitter — keeps the tape + table breathing */
  useEffect(() => {
    if (mode !== "demo" || loading || tokens.length === 0) return;
    const id = setInterval(() => {
      setTokens((prev) =>
        prev.map((t) => {
          if (t.kind === "dead") return t;
          const drift = rand(-0.035, 0.035);
          return {
            ...t,
            usdValue: Math.max(0, t.usdValue * (1 + drift)),
            change24h: t.change24h + drift * 100,
          };
        })
      );
    }, 4000);
    return () => clearInterval(id);
  }, [mode, loading, tokens.length]);

  /* ---------------- derived ---------------- */

  const allDust = useMemo(
    () => tokens.filter((t) => (t.kind === "dead" ? true : t.usdValue <= cutoff && t.usdValue >= 0)),
    [tokens, cutoff]
  );

  const visible = useMemo(() => {
    const list = filter === "dead" ? allDust.filter((t) => t.kind === "dead") : allDust;
    return [...list].sort((x, y) => y.usdValue - x.usdValue);
  }, [allDust, filter]);

  const ignoredCount = useMemo(
    () => tokens.filter((t) => t.kind === "liquid" && t.usdValue > cutoff).length,
    [tokens, cutoff]
  );

  const liquid = useMemo(() => allDust.filter((t) => t.kind === "liquid"), [allDust]);
  const dead = useMemo(() => allDust.filter((t) => t.kind === "dead"), [allDust]);

  const totalUsd = allDust.reduce((s, t) => s + t.usdValue, 0);
  const liquidUsd = liquid.reduce((s, t) => s + t.usdValue, 0);

  return {
    tokens: visible,
    allDust,
    liquid,
    dead,
    loading,
    error,
    lastScan,
    cutoff,
    setCutoff,
    filter,
    setFilter,
    ignoredCount,
    ignoredDemo: DEMO_IGNORED,
    totalUsd,
    liquidUsd,
    dustFloor: DUST_FLOOR_USD,
    refresh: scan,
  };
}

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return h;
}
