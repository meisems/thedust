/* ------------------------------------------------------------------ */
/*  Demo mode — fully simulated wallet, balances and execution.        */
/*  Same data contracts as the live Blockscout / RPC paths, so the UI  */
/*  and queue manager are exercised end-to-end without a wallet.       */
/* ------------------------------------------------------------------ */

export interface DustToken {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  balanceRaw: bigint;
  balance: number;
  usdValue: number;
  change24h: number;
  /** liquid = DEX pair with active reserves · dead = zero liquidity / rugged */
  kind: "liquid" | "dead";
  hue: number;
  /** demo: allowance already ≥ balance (approve step will be skipped) */
  preApproved?: boolean;
}

export const DEMO_WALLET = {
  address: "0xa47ce4c08b15f8d2e91b6f4f2c53d9e07c2d91b3",
  nativeBalance: 0.4218,
  sweepBalance: 4_250.42,
};

export const DEMO_VIP_SWEEP_BALANCE = 12_840.0;

const a = (hex: string) => "0x" + hex.padEnd(40, "0").slice(0, 40);

const raw = (balance: number, decimals: number): bigint => {
  const [int, frac = ""] = balance.toString().split(".");
  const fracPadded = (frac + "0".repeat(decimals)).slice(0, decimals);
  const fracClean = fracPadded.replace(/^0+/, ""); // BigInt rejects leading zeros
  return BigInt(int) * 10n ** BigInt(decimals) + (fracClean ? BigInt(fracClean) : 0n);
};

interface Seed {
  name: string; symbol: string; balance: number; usd: number;
  decimals?: number; kind: "liquid" | "dead"; hue: number;
  change: number; preApproved?: boolean; addr: string;
}

const SEEDS: Seed[] = [
  { name: "Tokenized Tesla Dust", symbol: "TSLAx", balance: 0.00412, usd: 4.31, kind: "liquid", hue: 356, change: 2.4, preApproved: true, addr: a("7e5f4552091a69125d5dfcb7b8c2659029395bdf") },
  { name: "Tokenized NVIDIA Dust", symbol: "NVDAx", balance: 0.0187, usd: 3.86, kind: "liquid", hue: 120, change: -1.1, addr: a("2b5ad5c4795c026514f8317c7a215e218dccd6cf") },
  { name: "Broccoli Army", symbol: "BROC", balance: 12480000, usd: 2.94, kind: "liquid", hue: 96, change: 12.6, addr: a("6813eb9362372eef6200f3b1dbc3f819671cba69") },
  { name: "HoodRats", symbol: "RATS", balance: 5102000, usd: 2.31, kind: "liquid", hue: 26, change: -4.2, preApproved: true, addr: a("1e2f3a4b5c6d7e8f9012345678901234567890aa") },
  { name: "Ape Leftovers", symbol: "APEL", balance: 88200, usd: 1.74, kind: "liquid", hue: 208, change: 0.8, addr: a("f17f52151ebef6c7334fad080c5704d77216b732") },
  { name: "Candle Gremlin", symbol: "WICK", balance: 302100, usd: 1.42, kind: "liquid", hue: 160, change: 5.5, addr: a("c5fdf4076b8f3a5357c5e395ab970b5b54098fef") },
  { name: "Paper Hand Penalty", symbol: "PHP", balance: 912000000, usd: 1.18, kind: "liquid", hue: 300, change: -9.3, preApproved: true, addr: a("821aea9a577a9b44299b9c15c88cf3087f3b5544") },
  { name: "Moon Mission IOU", symbol: "MOON", balance: 40200, usd: 0.96, kind: "liquid", hue: 52, change: 18.9, addr: a("0d1d4e623d10f9fba5db95830f7d3839406c6af2") },
  { name: "Gamma Squeeze", symbol: "GME2", balance: 15400, usd: 0.61, kind: "liquid", hue: 340, change: -2.7, addr: a("2932b7a2355d6fecc4b5c0b6bd44cc31df247a2e") },
  { name: "Wen Lambo Raffle", symbol: "WEN", balance: 77000000, usd: 0.34, kind: "liquid", hue: 190, change: 1.2, addr: a("2191ef87e392377ec08e7c08eb105ef5448eced5") },
  { name: "Slippage Goblin", symbol: "SLIP", balance: 620000, usd: 0.18, kind: "liquid", hue: 276, change: -6.4, preApproved: true, addr: a("0f4f2ac550a1b4e2280d04c21cea7ebd822934b5") },
  { name: "Round Trip Ticket", symbol: "RTT", balance: 1289000, usd: 0.09, kind: "liquid", hue: 76, change: 0.3, addr: a("6330a553fc93768f612722bb8c2ec78ac90b3bbc") },
  { name: "RugZilla V2 (rugged)", symbol: "RUGZ", balance: 44200000, usd: 0.0, kind: "dead", hue: 0, change: -100, addr: a("deadbeefcafe4242deadbeefcafe4242deadbe01") },
  { name: "Squid Game 2.0 (honeypot)", symbol: "SQUID2", balance: 99800000, usd: 0.0, kind: "dead", hue: 320, change: -100, preApproved: true, addr: a("5a3180ce4629a6528a44626531d686a5b46162b4") },
  { name: "SafeMoon Fork 47", symbol: "SAFU47", balance: 310000000, usd: 0.0, kind: "dead", hue: 16, change: -100, addr: a("8626f6940e2eb28930efb4cef49b2d1f2c9c1199") },
];

/** A non-dust holding, to prove the >$5 filter excludes it */
export const DEMO_IGNORED = { symbol: "LINKx", name: "Tokenized Chainlink", usd: 7.42 };

export function buildDemoTokens(): DustToken[] {
  return SEEDS.map((s) => ({
    address: s.addr,
    name: s.name,
    symbol: s.symbol,
    decimals: s.decimals ?? 18,
    balanceRaw: raw(s.balance, s.decimals ?? 18),
    balance: s.balance,
    usdValue: s.usd,
    change24h: s.change,
    kind: s.kind,
    hue: s.hue,
    preApproved: s.preApproved,
  }));
}

/* ---------------- simulation utilities ---------------- */

export const rand = (min: number, max: number) => min + Math.random() * (max - min);

export const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export function fakeTxHash(): string {
  let h = "0x";
  const chars = "0123456789abcdef";
  for (let i = 0; i < 64; i++) h += chars[Math.floor(Math.random() * 16)];
  return h;
}

export function fakeAddress(): string {
  let h = "0x";
  const chars = "0123456789abcdef";
  for (let i = 0; i < 40; i++) h += chars[Math.floor(Math.random() * 16)];
  return h;
}

const FAIL_REASONS = [
  "execution reverted: PancakeRouter: INSUFFICIENT_OUTPUT_AMOUNT",
  "slippage exceeded — pair reserves moved during confirmation",
  "execution reverted: TRANSFER_FAILED (fee-on-transfer token)",
  "replacement transaction underpriced — nonce reused by wallet",
];

export const pickFailReason = () => FAIL_REASONS[Math.floor(Math.random() * FAIL_REASONS.length)];
