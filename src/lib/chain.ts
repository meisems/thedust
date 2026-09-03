import { defineChain } from "viem";
import { parseAbi } from "viem";

/* ------------------------------------------------------------------ */
/*  Robinhood Chain — network definition (Chain ID 4663 / 0x1237)      */
/* ------------------------------------------------------------------ */

export const robinhoodChain = defineChain({
  id: 4663,
  name: "Robinhood Chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.mainnet.chain.robinhood.com"] },
  },
  blockExplorers: {
    default: {
      name: "Blockscout",
      url: "https://robinhoodchain.blockscout.com",
      apiUrl: "https://robinhoodchain.blockscout.com/api/v2",
    },
  },
  contracts: {},
});

export const RPC_URL = robinhoodChain.rpcUrls.default.http[0];
export const EXPLORER_URL = robinhoodChain.blockExplorers.default.url;
export const BLOCKSCOUT_API = robinhoodChain.blockExplorers.default.apiUrl;

/* ------------------------------------------------------------------ */
/*  Key external addresses (all-lowercase → viem checksums internally) */
/*  In production these come from NEXT_PUBLIC_* env vars.              */
/* ------------------------------------------------------------------ */

export const ADDRESSES = {
  /** DEX Uniswap V2 Router deployed on Robinhood Chain */
  dexRouter: "0x7a250d5630b4cf539739df2c5dacb4c659f2488d",
  /** Wrapped ETH on Robinhood Chain */
  weth: "0x4200000000000000000000000000000000000006",
  /** $SWEEP — platform token (deployed via Pons Family) */
  platformToken: "0x5eefa11c0ffeeb00c0ffee4663d157b00d5ea11",
  /** Dead / burn address */
  dead: "0x000000000000000000000000000000000000dead",
} as const;

/** Minimum $SWEEP balance that unlocks the 0% fee tier on ETH sweeps */
export const MIN_HOLDING_TIER = 10_000n;
export const MIN_HOLDING_TIER_FMT = "10,000";

/** Protocol fee taken on ETH sweeps when NOT holding the VIP tier */
export const PROTOCOL_FEE_BPS = 250; // 2.50 %
export const PROTOCOL_FEE_PCT = PROTOCOL_FEE_BPS / 100;

/** Defensive swap settings for volatile meme dust */
export const SLIPPAGE_PCT = 15; // 15% — dust is volatile, misses beat reverts
export const SWAP_DEADLINE_MIN = 20; // 20 minute deadline

/** Reference prices used for estimation (demo oracle) */
export const PRICES = {
  ETH: 3241.8,
  SWEEP: 0.0417,
  gasPerTx: 0.000021, // ETH — Robinhood Chain is cheap
};

export const DUST_FLOOR_USD = 0.05;
export const DUST_CAP_USD_DEFAULT = 5.0;

/* ------------------------------------------------------------------ */
/*  ABIs — only the functions DustSweep touches (zero custom contracts)*/
/* ------------------------------------------------------------------ */

export const erc20Abi = parseAbi([
  "function balanceOf(address owner) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
]);

export const routerAbi = parseAbi([
  "function getAmountsOut(uint256 amountIn, address[] path) view returns (uint256[])",
  "function swapExactTokensForTokensSupportingFeeOnTransferTokens(uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline)",
  "function swapExactTokensForETHSupportingFeeOnTransferTokens(uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline)",
]);

/* ------------------------------------------------------------------ */
/*  Formatting helpers                                                 */
/* ------------------------------------------------------------------ */

export function fmtUsd(v: number, digits?: number): string {
  const d = digits ?? (v >= 1000 ? 0 : v >= 1 ? 2 : v >= 0.01 ? 3 : 4);
  return "$" + v.toLocaleString("en-US", { minimumFractionDigits: Math.min(d, 2), maximumFractionDigits: d });
}

export function fmtNum(v: number): string {
  if (v >= 1e9) return (v / 1e9).toFixed(2) + "B";
  if (v >= 1e6) return (v / 1e6).toFixed(2) + "M";
  if (v >= 1e3) return (v / 1e3).toFixed(2) + "K";
  if (v >= 1) return v.toFixed(2);
  if (v === 0) return "0";
  return v.toPrecision(3);
}

export function shortAddr(a: string): string {
  return a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "—";
}

export function shortHash(h: string): string {
  return h ? `${h.slice(0, 10)}…${h.slice(-6)}` : "—";
}

export function explorerTx(hash: string): string {
  return `${EXPLORER_URL}/tx/${hash}`;
}

export function explorerAddress(addr: string): string {
  return `${EXPLORER_URL}/address/${addr}`;
}

export function explorerApprovals(addr: string): string {
  return `${EXPLORER_URL}/address/${addr}#token_approvals`;
}

/* ------------------------------------------------------------------ */
/*  Security — hostile input from public indexers must never reach     */
/*  the DOM raw: strip control chars + RTL overrides, cap length.      */
/* ------------------------------------------------------------------ */

/* eslint-disable no-control-regex */
const HOSTILE_RE = /[\u0000-\u001F\u007F\u200B-\u200F\u202A-\u202E\u2060-\u2064\uFEFF]/g;
/* eslint-enable no-control-regex */

export function sanitizeLabel(input: unknown, max = 24): string {
  const s = typeof input === "string" ? input : "";
  const clean = s.replace(HOSTILE_RE, "").replace(/\s+/g, " ").trim();
  return clean.length > max ? clean.slice(0, max - 1) + "…" : clean || "???";
}
