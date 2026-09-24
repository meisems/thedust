import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { spring } from "./ui";

/* ------------------------------------------------------------------ */
/*  loader — a portal, not a splash screen                             */
/*  0. a rift tears open, rings spin up around a glowing core          */
/*  1. the wordmark gets pulled out of the rift, letter by letter      */
/*  2. deadpan status lines swap while the rift keeps breathing        */
/*  3. the whole thing gets sucked back into the rift and vanishes     */
/* ------------------------------------------------------------------ */

const DEADPAN = [
  "tearing a hole in the mempool…",
  "counting dust bunnies…",
  "found 14. gross.",
  "ok. ready when you are.",
];

const WORD = "ponsweep";

export function Loader({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState(0); // 0 rift opens · 1 wordmark pulled out · 2 deadpan · 3 sucked back in
  const [line, setLine] = useState(0);
  const [skippable, setSkippable] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 750);
    const t2 = setTimeout(() => setPhase(2), 1550);
    const t3 = setTimeout(() => setSkippable(true), 1250);
    const lineTimers = DEADPAN.map((_, i) => setTimeout(() => setLine(i), 1600 + i * 430));
    const t4 = setTimeout(() => setPhase(3), 1600 + DEADPAN.length * 430 + 330);
    return () => {
      [t1, t2, t3, t4, ...lineTimers].forEach(clearTimeout);
    };
  }, []);

  const skip = () => skippable && setPhase(3);
  const open = phase < 3;

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex cursor-pointer flex-col items-center justify-center overflow-hidden"
      style={{ background: "var(--bg)" }}
      onClick={skip}
      animate={{ opacity: open ? 1 : 0 }}
      transition={{ duration: 0.55, delay: open ? 0 : 0.32, ease: "easeInOut" }}
      onAnimationComplete={() => phase === 3 && onDone()}
    >
      {/* everything below collapses back into the rift on exit */}
      <motion.div
        className="flex flex-col items-center"
        animate={open ? { scale: 1, rotate: 0, opacity: 1 } : { scale: 0.04, rotate: -34, opacity: 0.3 }}
        transition={{ duration: 0.5, ease: [0.76, 0, 0.24, 1] }}
      >
        {/* ---------------- the rift ---------------- */}
        <div className="relative flex h-[132px] w-[132px] items-center justify-center">
          {/* swirling nebula glow behind the rings */}
          <motion.div
            className="absolute inset-[-30%] rounded-full opacity-70 blur-2xl"
            style={{
              background: "conic-gradient(from 0deg, var(--portal-a), var(--portal-c), var(--portal-b), var(--portal-a))",
              animation: "ds-portal-spin 5s linear infinite",
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.55 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />

          {/* concentric rift rings */}
          <motion.svg
            width="132"
            height="132"
            viewBox="0 0 132 132"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ ...spring, delay: 0.05 }}
            className="relative"
          >
            <g style={{ transformOrigin: "66px 66px", animation: "ds-portal-spin 7s linear infinite" }}>
              <circle cx="66" cy="66" r="58" fill="none" stroke="var(--portal-b)" strokeWidth="1.6" strokeDasharray="10 9" opacity="0.85" />
            </g>
            <g style={{ transformOrigin: "66px 66px", animation: "ds-portal-spin-rev 5s linear infinite" }}>
              <circle cx="66" cy="66" r="43" fill="none" stroke="var(--portal-c)" strokeWidth="1.6" strokeDasharray="7 8" opacity="0.9" />
            </g>
            <g style={{ transformOrigin: "66px 66px", animation: "ds-portal-spin 3.2s linear infinite" }}>
              <circle cx="66" cy="66" r="28" fill="none" stroke="var(--portal-a)" strokeWidth="2" strokeDasharray="5 6" />
            </g>
            <circle cx="66" cy="66" r="13" fill="var(--portal-a)" style={{ animation: "ds-portal-flicker 1.4s ease-in-out infinite" }} />
          </motion.svg>
        </div>

        {/* ---------------- wordmark pulled out of the rift ---------------- */}
        <div className="mt-6 overflow-hidden">
          <div className="flex">
            {WORD.split("").map((ch, i) => (
              <motion.span
                key={i}
                className="font-display text-4xl font-bold tracking-tight text-ink"
                initial={{ y: "70%", opacity: 0, scale: 0.5 }}
                animate={phase >= 1 ? { y: 0, opacity: 1, scale: 1 } : { y: "70%", opacity: 0, scale: 0.5 }}
                transition={{ ...spring, delay: i * 0.035 }}
              >
                {ch}
              </motion.span>
            ))}
          </div>
        </div>

        {/* ---------------- deadpan status line ---------------- */}
        <div className="mt-4 h-5 overflow-hidden">
          <AnimatePresence mode="wait">
            {phase >= 2 && (
              <motion.p
                key={line}
                initial={{ y: 16, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -16, opacity: 0 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="font-mono text-xs text-muted"
              >
                {DEADPAN[line]}
                <span className="cursor-blink ml-1 inline-block h-3 w-[7px] translate-y-[2px]" style={{ background: "var(--acc)" }} />
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {skippable && phase < 3 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute bottom-10 font-mono text-[10.5px] uppercase tracking-[0.18em] text-faint"
        >
          click to skip — the rift understands
        </motion.p>
      )}
    </motion.div>
  );
}
