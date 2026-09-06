import { http, createConfig } from "wagmi";
import { injected } from "wagmi/connectors";
import { robinhoodChain } from "./chain";

/* ------------------------------------------------------------------ */
/*  wagmi v2 config — single chain, public RPC, no custom contracts.   */
/*  Every read/write PonSweep performs goes through this transport.   */
/* ------------------------------------------------------------------ */

export const wagmiConfig = createConfig({
  chains: [robinhoodChain],
  connectors: [injected({ shimDisconnect: true })],
  transports: {
    [robinhoodChain.id]: http(robinhoodChain.rpcUrls.default.http[0], {
      timeout: 12_000,
    }),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
