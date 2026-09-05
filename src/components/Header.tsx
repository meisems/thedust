import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { spring, Monogram } from "./ui";
import { ChevronDownIcon, CopyIcon, CrownIcon, ExternalIcon, LogoMark, MoonIcon, SunIcon, WalletIcon, XIcon } from "./icons";
import { EXPLORER_URL, shortAddr } from "../lib/chain";

interface Props {
  theme: string;
  onToggleTheme: () => void;
  address: string | null;
  mode: "demo" | "live" | null;
  isVip: boolean;
  onOpenWallet: () => void;
  onDisconnect: () => void;
}

/* ------------------------------------------------------------------ */
/*  sticky frosted header                                              */
/* ------------------------------------------------------------------ */
export function Header({ theme, onToggleTheme, address, mode, isVip, onOpenWallet, onDisconnect }: Props) {
  const [menu, setMenu] = useState(false);

  return (
    <header className="glass sticky top-0 z-50 border-b" style={{ borderColor: "var(--line)" }}>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        {/* brand */}
        <div className="flex items-center gap-2.5">
          <span className="squircle h-9 w-9 text-on-acc" style={{ background: "var(--acc)", borderRadius: 13 }}>
            <LogoMark size={20} />
          </span>
          <div className="leading-none">
            <span className="font-display text-[17px] font-bold tracking-tight text-ink">dustsweep</span>
            <span className="mt-0.5 block font-mono text-[9.5px] uppercase tracking-[0.16em] text-faint">
              robinhood chain · 4663
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {mode === "demo" && (
            <span className="chip hidden border-transparent sm:inline-flex" style={{ background: "var(--gold-soft)", color: "var(--gold-ink)" }}>
              demo money
            </span>
          )}
          {isVip && (
            <span className="chip hidden border-transparent md:inline-flex" style={{ background: "var(--gold-soft)", color: "var(--gold-ink)" }}>
              <CrownIcon size={13} /> vip
            </span>
          )}

          {/* network pill */}
          <span className="chip hidden border-transparent bg-bg-soft sm:inline-flex">
            <span className="pulse-dot h-2 w-2 rounded-full" style={{ background: "var(--acc)" }} />
            mainnet
          </span>

          {/* theme toggle */}
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label="toggle theme"
            className="relative flex h-9 w-[62px] items-center justify-between rounded-full border px-2 outline-none transition-colors hover:border-line-strong"
            style={{ borderColor: "var(--line)", background: "var(--bg-soft)" }}
          >
            <SunIcon size={14} className={theme === "light" ? "text-gold" : "text-faint"} />
            <MoonIcon size={14} className={theme === "dark" ? "text-sky" : "text-faint"} />
            <motion.span
              className="absolute left-1 top-1 flex h-7 w-7 items-center justify-center rounded-full"
              style={{ background: "var(--card)", boxShadow: "var(--shadow-sm)" }}
              animate={{ x: theme === "light" ? 0 : 30 }}
              transition={spring}
            >
              {theme === "light" ? <SunIcon size={13} className="text-gold" /> : <MoonIcon size={13} className="text-sky" />}
            </motion.span>
          </button>

          {/* wallet */}
          {address ? (
            <div className="relative">
              <motion.button
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={() => setMenu((m) => !m)}
                className="flex h-9 items-center gap-2 rounded-full border py-1 pl-1 pr-2.5 outline-none transition-colors hover:border-line-strong"
                style={{ borderColor: "var(--line)", background: "var(--card)" }}
              >
                <Monogram symbol={address.slice(2, 4)} hue={158} size={28} />
                <span className="font-mono text-xs text-ink-2">{shortAddr(address)}</span>
                <motion.span animate={{ rotate: menu ? 180 : 0 }} transition={spring} className="text-faint">
                  <ChevronDownIcon size={14} />
                </motion.span>
              </motion.button>

              <AnimatePresence>
                {menu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setMenu(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.94 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.96 }}
                      transition={spring}
                      className="card absolute right-0 top-11 z-20 w-52 overflow-hidden !rounded-2xl p-1.5"
                    >
                      <MenuItem
                        icon={<CopyIcon size={15} />}
                        label="copy address"
                        onClick={() => {
                          navigator.clipboard?.writeText(address).catch(() => {});
                          setMenu(false);
                        }}
                      />
                      <a
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-medium text-ink-2 transition-colors hover:bg-bg-soft hover:text-ink"
                        href={`${EXPLORER_URL}/address/${address}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => setMenu(false)}
                      >
                        <ExternalIcon size={15} className="text-muted" /> view on blockscout
                      </a>
                      <MenuItem icon={<XIcon size={15} />} label="disconnect" danger onClick={onDisconnect} />
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <motion.button
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              onClick={onOpenWallet}
              className="flex h-9 items-center gap-2 rounded-full px-4 text-[13px] font-semibold text-on-acc"
              style={{ background: "var(--acc)" }}
            >
              <WalletIcon size={15} /> attach wallet
            </motion.button>
          )}
        </div>
      </div>
    </header>
  );
}

function MenuItem({ icon, label, onClick, danger }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => {
        onClick();
      }}
      className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[13px] font-medium transition-colors hover:bg-bg-soft ${
        danger ? "text-coral-ink" : "text-ink-2 hover:text-ink"
      }`}
    >
      <span className={danger ? "text-coral" : "text-muted"}>{icon}</span> {label}
    </button>
  );
}
