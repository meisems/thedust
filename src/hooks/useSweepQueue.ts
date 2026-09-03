import { useCallback, useMemo, useRef, useState } from "react";
import { isAddress, maxUint256, type PublicClient, type WalletClient } from "viem";
import {
  ADDRESSES,
  erc20Abi,
  explorerTx,
  PROTOCOL_FEE_BPS,
  PRICES,
  robinhoodChain,
  routerAbi,
  SLIPPAGE_PCT,
  SWAP_DEADLINE_MIN,
} from "../lib/chain";
import { fakeTxHash, pickFailReason, rand, wait, type DustToken } from "../lib/demo";

export type Destination = "sweep" | "eth" | "burn";
export type StepStatus = "queued" | "active" | "submitted" | "confirmed" | "failed" | "skipped";
export type StepKind = "approve" | "fee" | "swap" | "burn";

export interface QueueStep {
  id: string;
  tokenAddress: string;
  symbol: string;
  hue: number;
  kind: StepKind;
  label: string;
  status: StepStatus;
  hash?: string;
  error?: string;
  txUrl?: string;
}

export interface QueueSummary {
  confirmed: number;
  failed: number;
  skipped: number;
  usdSwept: number;
  failedSymbols: string[];
}

interface UseSweepQueueArgs {
  mode: "demo" | "live" | null;
  address: string | null;
  isVip: boolean;
  destination: Destination;
  publicClient: PublicClient | null | undefined;
  walletClient: WalletClient | null | undefined;
}

const feeUsdOf = (t: DustToken, isVip: boolean, destination: Destination) =>
  destination === "eth" && !isVip ? t.usdValue * (PROTOCOL_FEE_BPS / 10_000) : 0;

/**
 * useSweepQueue — Phase 3 sequential execution pipeline.
 * Runs one transaction at a time (no nonce collisions), mirrors every
 * state change into a visual checklist, and supports abort + retry.
 */
export function useSweepQueue({ mode, address, isVip, destination, publicClient, walletClient }: UseSweepQueueArgs) {
  const [steps, setSteps] = useState<QueueStep[]>([]);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const abortRef = useRef(false);
  const lastTokensRef = useRef<DustToken[]>([]);

  const updateStep = (id: string, patch: Partial<QueueStep>) =>
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  const buildSteps = useCallback(
    (tokens: DustToken[], dest: Destination, vip: boolean): QueueStep[] => {
      const out: QueueStep[] = [];
      const destLabel = dest === "sweep" ? "$SWEEP" : "ETH";
      for (const t of tokens) {
        if (dest !== "burn") {
          out.push({
            id: `${t.address}:approve`,
            tokenAddress: t.address,
            symbol: t.symbol,
            hue: t.hue,
            kind: "approve",
            label: `Approve Router — ${t.symbol}`,
            status: "queued",
          });
        }
        if (dest === "eth" && !vip && t.usdValue > 0) {
          out.push({
            id: `${t.address}:fee`,
            tokenAddress: t.address,
            symbol: t.symbol,
            hue: t.hue,
            kind: "fee",
            label: `Protocol fee 2.5% — ${t.symbol}`,
            status: "queued",
          });
        }
        out.push({
          id: `${t.address}:main`,
          tokenAddress: t.address,
          symbol: t.symbol,
          hue: t.hue,
          kind: dest === "burn" ? "burn" : "swap",
          label:
            dest === "burn"
              ? `Burn ${t.symbol} → 0x…dEaD`
              : `Swap ${t.symbol} → ${destLabel}`,
          status: "queued",
        });
      }
      return out;
    },
    []
  );

  /* ---------------- execution ---------------- */

  const runStep = useCallback(
    async (step: QueueStep, token: DustToken | undefined): Promise<void> => {
      updateStep(step.id, { status: "active", error: undefined });

      /* allowance already covers the balance → nothing to approve */
      if (step.kind === "approve" && token) {
        if (mode === "demo") {
          if (token.preApproved) {
            await wait(260);
            updateStep(step.id, { status: "skipped" });
            return;
          }
        } else if (publicClient && address) {
          try {
            const allowance = (await publicClient.readContract({
              address: token.address as `0x${string}`,
              abi: erc20Abi,
              functionName: "allowance",
              args: [address as `0x${string}`, ADDRESSES.dexRouter as `0x${string}`],
            })) as bigint;
            if (allowance >= token.balanceRaw) {
              updateStep(step.id, { status: "skipped" });
              return;
            }
          } catch {
            /* fall through and approve anyway */
          }
        }
      }

      if (mode === "demo" || !token) {
        await wait(step.kind === "approve" ? rand(550, 900) : rand(950, 1500));
        const hash = fakeTxHash();
        updateStep(step.id, { status: "submitted", hash, txUrl: explorerTx(hash) });
        await wait(rand(650, 1050));
        const failP = step.kind === "approve" ? 0.05 : step.kind === "burn" ? 0.03 : 0.12;
        if (Math.random() < failP) {
          updateStep(step.id, { status: "failed", error: pickFailReason() });
        } else {
          updateStep(step.id, { status: "confirmed" });
        }
        return;
      }

      /* ---- live path: viem wallet + public clients ---- */
      try {
        if (!walletClient || !publicClient || !address) throw new Error("Wallet unavailable — reconnect on Chain 4663");
        const account = walletClient.account;
        if (!account) throw new Error("No active account");
        /* paranoid: never send value against an unverified address */
        if (
          !isAddress(token.address) ||
          !isAddress(ADDRESSES.dexRouter) ||
          !isAddress(ADDRESSES.platformToken) ||
          !isAddress(ADDRESSES.weth) ||
          !isAddress(ADDRESSES.dead) ||
          !isAddress(account.address)
        ) {
          throw new Error("address failed checksum verification — refusing to sign");
        }
        const common = { chain: robinhoodChain, account } as const;

        let hash: `0x${string}`;
        if (step.kind === "approve") {
          hash = await walletClient.writeContract({
            ...common,
            address: token.address as `0x${string}`,
            abi: erc20Abi,
            functionName: "approve",
            args: [ADDRESSES.dexRouter as `0x${string}`, maxUint256],
          });
        } else if (step.kind === "fee") {
          const feeAmount = (token.balanceRaw * BigInt(PROTOCOL_FEE_BPS)) / 10_000n;
          hash = await walletClient.writeContract({
            ...common,
            address: token.address as `0x${string}`,
            abi: erc20Abi,
            functionName: "transfer",
            args: [ADDRESSES.platformToken as `0x${string}`, feeAmount],
          });
        } else if (step.kind === "burn") {
          hash = await walletClient.writeContract({
            ...common,
            address: token.address as `0x${string}`,
            abi: erc20Abi,
            functionName: "transfer",
            args: [ADDRESSES.dead as `0x${string}`, token.balanceRaw],
          });
        } else {
          /* swap */
          const toSweep = destination === "sweep";
          let path: string[] = toSweep
            ? [token.address, ADDRESSES.weth, ADDRESSES.platformToken]
            : [token.address, ADDRESSES.weth];
          let amountIn = token.balanceRaw;
          if (destination === "eth" && !isVip) {
            amountIn = amountIn - (amountIn * BigInt(PROTOCOL_FEE_BPS)) / 10_000n;
          }
          let amountOutMin = 0n;
          try {
            const amounts = (await publicClient.readContract({
              address: ADDRESSES.dexRouter as `0x${string}`,
              abi: routerAbi,
              functionName: "getAmountsOut",
              args: [amountIn, path as `0x${string}`[]],
            })) as bigint[];
            amountOutMin = (amounts[amounts.length - 1] * BigInt(100 - SLIPPAGE_PCT)) / 100n;
          } catch {
            path = toSweep ? [token.address, ADDRESSES.platformToken] : path; // try direct pair
            amountOutMin = 0n; // supportingFeeOnTransfer tokens: accept market
          }
          const deadline = BigInt(Math.floor(Date.now() / 1000) + SWAP_DEADLINE_MIN * 60);
          hash = await walletClient.writeContract({
            ...common,
            address: ADDRESSES.dexRouter as `0x${string}`,
            abi: routerAbi,
            functionName: toSweep
              ? "swapExactTokensForTokensSupportingFeeOnTransferTokens"
              : "swapExactTokensForETHSupportingFeeOnTransferTokens",
            args: [amountIn, amountOutMin, path as `0x${string}`[], address as `0x${string}`, deadline],
          });
        }

        updateStep(step.id, { status: "submitted", hash, txUrl: explorerTx(hash) });
        const receipt = await publicClient.waitForTransactionReceipt({ hash, timeout: 120_000 });
        if (receipt.status === "success") updateStep(step.id, { status: "confirmed" });
        else updateStep(step.id, { status: "failed", error: "transaction reverted on-chain" });
      } catch (e: any) {
        const msg: string = e?.shortMessage ?? e?.message ?? "transaction rejected";
        updateStep(step.id, { status: "failed", error: msg.slice(0, 120) });
      }
    },
    [mode, destination, isVip, address, publicClient, walletClient]
  );

  const start = useCallback(
    async (tokens: DustToken[], dest: Destination, vip: boolean) => {
      if (tokens.length === 0 || running) return;
      lastTokensRef.current = tokens;
      abortRef.current = false;
      const built = buildSteps(tokens, dest, vip);
      setSteps(built);
      setFinished(false);
      setRunning(true);

      const byAddr = new Map(tokens.map((t) => [t.address, t]));
      for (const step of built) {
        if (abortRef.current) {
          setSteps((prev) => prev.map((s) => (s.status === "queued" ? { ...s, status: "skipped" } : s)));
          break;
        }
        await runStep(step, byAddr.get(step.tokenAddress));
      }
      setRunning(false);
      setFinished(true);
    },
    [buildSteps, runStep, running]
  );

  const abort = useCallback(() => {
    abortRef.current = true;
  }, []);

  const retryFailed = useCallback(async () => {
    const failedAddrs = new Set(
      steps.filter((s) => s.status === "failed").map((s) => s.tokenAddress)
    );
    const retryTokens = lastTokensRef.current.filter((t) => failedAddrs.has(t.address));
    if (retryTokens.length > 0) await start(retryTokens, destination, isVip);
  }, [steps, destination, isVip, start]);

  const reset = useCallback(() => {
    setSteps([]);
    setFinished(false);
    setRunning(false);
  }, []);

  /* ---------------- derived ---------------- */

  const doneCount = steps.filter((s) => ["confirmed", "failed", "skipped"].includes(s.status)).length;
  const progress = steps.length === 0 ? 0 : doneCount / steps.length;

  const summary: QueueSummary = useMemo(() => {
    const confirmedMain = steps.filter((s) => s.kind !== "approve" && s.kind !== "fee" && s.status === "confirmed");
    const failedAddrs = new Set(steps.filter((s) => s.status === "failed").map((s) => s.tokenAddress));
    const usdSwept = lastTokensRef.current
      .filter((t) => confirmedMain.some((c) => c.tokenAddress === t.address) && !failedAddrs.has(t.address))
      .reduce((s, t) => s + t.usdValue, 0);
    return {
      confirmed: new Set(confirmedMain.map((c) => c.tokenAddress)).size,
      failed: failedAddrs.size,
      skipped: steps.filter((s) => s.status === "skipped").length,
      usdSwept,
      failedSymbols: [...new Set(steps.filter((s) => s.status === "failed").map((s) => s.symbol))],
    };
  }, [steps]);

  return { steps, running, finished, progress, summary, start, abort, retryFailed, reset, gasPerTx: PRICES.gasPerTx };
}
