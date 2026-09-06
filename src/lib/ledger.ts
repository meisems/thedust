import { sanitizeLabel } from "./chain";

/* ------------------------------------------------------------------ */
/*  the ledger — every sweep, every wallet, public by nature.          */
/*  live  : hydrated from the router's on-chain tx feed (all users).   */
/*  demo  : your sweeps + a simulated community pulse.                 */
/* ------------------------------------------------------------------ */

export type LedgerDestination = "sweep" | "eth" | "burn";

export interface LedgerEntry {
  id: string;
  ts: number;
  hash?: string;
  wallet: string; // anonymized display label e.g. 0x12ab…9f3c
  walletAddr: string;
  symbols: string[];
  count: number;
  usd: number;
  destination: LedgerDestination;
  own: boolean; // did *this* browser make it?
  live: boolean; // sourced from on-chain feed vs simulated
}

const KEY = "ponsweep.ledger.v1";
const MAX = 80;

export function anonAddress(a: string): string {
  if (!a || a.length < 10) return "0x????";
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

export function loadLedger(): LedgerEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, MAX) : [];
  } catch {
    return [];
  }
}

export function saveLedger(entries: LedgerEntry[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(entries.slice(0, MAX)));
  } catch {
    /* private mode — ledger stays in memory only */
  }
}

/* ---------------- community pulse (demo) ---------------- */

const PULSE_WALLETS = [
  "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063",
  "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
  "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
  "0x9a71012B13CA4d3D0Cdc72A177DF3ef03b0E76A3",
  "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6",
  "0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7",
  "0x4e3Decbb3645551B8A19f0eA1678079FCB33fB4c",
  "0x6b175474E89094C44Da98b954EedeAC495271d0F",
];

const PULSE_TOKENS = [
  ["BROC", "WICK"],
  ["RATS"],
  ["MOON", "WEN", "SLIP"],
  ["APEL"],
  ["PHP", "RTT"],
  ["GME2"],
  ["TSLAx"],
  ["NVDAx", "MOON"],
  ["RUGZ", "SQUID2", "SAFU47"],
  ["WICK", "SLIP"],
];

const rnd = (min: number, max: number) => min + Math.random() * (max - min);
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

export function communityEntry(id: number): LedgerEntry {
  const symbols = pick(PULSE_TOKENS);
  const burn = symbols.every((s) => ["RUGZ", "SQUID2", "SAFU47"].includes(s));
  const dest: LedgerDestination = burn ? "burn" : Math.random() < 0.55 ? "sweep" : "eth";
  return {
    id: `pulse-${id}`,
    ts: Date.now() - Math.floor(rnd(0, 40_000)),
    wallet: anonAddress(pick(PULSE_WALLETS)),
    walletAddr: pick(PULSE_WALLETS),
    symbols: symbols.map((s) => sanitizeLabel(s, 10)),
    count: symbols.length,
    usd: Number(rnd(0.4, 18).toFixed(2)),
    destination: dest,
    own: false,
    live: false,
  };
}

/** a few back-dated entries so the ledger never opens empty in demo */
export function seedCommunity(count: number): LedgerEntry[] {
  return Array.from({ length: count }, (_, i) => ({
    ...communityEntry(i),
    ts: Date.now() - Math.floor(rnd(60_000, 6 * 60_000)),
  })).sort((a, b) => b.ts - a.ts);
}

export function relativeTime(ts: number): string {
  const s = Math.max(1, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}
