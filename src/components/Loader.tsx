import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { spring } from "./ui";

/* ------------------------------------------------------------------ */
/*  loader — four phases:                                              */
/*  1. broom mark draws itself in with a spring                        */
/*  2. mark tilts / squashes, wordmark rises out of a clip mask        */
/*  3. deadpan status lines swap while a cursor blinks                 */
/*  4. the whole panel lifts away like a curtain                       */
/* ------------------------------------------------------------------ */

const DEADPAN = [
  "warming the tiny vacuum…",
  "counting dust bunnies…",
  "found 14. gross.",
  "ok. ready when you are.",
];

const WORD = "dustsweep";

export function Loader({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState(0); // 0 draw · 1 wordmark · 2 deadpan · 3 exit
  const [line, setLine] = useState(0);
  const [skippable, setSkippable] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 850);
    const t2 = setTimeout(() => setPhase(2), 1700);
    const t3 = setTimeout(() => setSkippable(true), 1400);
    const lineTimers = DEADPAN.map((_, i) => setTimeout(() => setLine(i), 1750 + i * 430));
    const t4 = setTimeout(() => setPhase(3), 1750 + DEADPAN.length * 430 + 350);
    return () => {
      [t1, t2, t3, t4, ...lineTimers].forEach(clearTimeout);
    };
  }, []);

  const skip = () => skippable && setPhase(3);

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex cursor-pointer flex-col items-center justify-center overflow-hidden"
      style={{ background: "var(--bg)" }}
      onClick={skip}
      animate={phase === 3 ? { y: "-100%" } : { y: 0 }}
      transition={{ duration: 0.75, ease: [0.83, 0, 0.17, 1] }}
      onAnimationComplete={() => phase === 3 && onDone()}
    >
      {/* soft trailing edge on the curtain */}
      <div className="absolute bottom-0 left-0 h-16 w-full" style={{ background: "var(--bg-soft)", borderRadius: "0 0 50% 50% / 0 0 100% 100%" }} />

      {/* phase 1 — the broom draws itself */}
      <motion.div
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{
          scale: 1,
          opacity: 1,
          rotate: phase >= 1 ? [0, -12, 4, 0] : 0,
        }}
        transition={{
          scale: spring,
          opacity: { duration: 0.3 },
          rotate: { duration: 0.9, times: [0, 0.4, 0.7, 1], ease: "easeInOut" },
        }}
        style={{ color: "var(--acc)" }}
      >
        <svg width="84" height="84" viewBox="0 0 24 24" fill="none">
          <motion.path
            d="M20 4l-6.2 6.2"
            stroke="currentColor"
            strokeWidth={1.9}
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
          <motion.path
            d="M13.8 10.2l-7 2.9a2 2 0 0 0-.6 3.3l2.2 2.2a2 2 0 0 0 3.3-.6l2.9-7a.75.75 0 0 0-.8-.8Z"
            stroke="currentColor"
            strokeWidth={1.9}
            strokeLinejoin="round"
            initial={{ pathLength: 0, fillOpacity: 0 }}
            animate={{ pathLength: 1, fill: "currentColor", fillOpacity: phase >= 1 ? 0.16 : 0 }}
            transition={{ duration: 0.75, ease: "easeInOut" }}
          />
          <motion.path
            d="M22.5 15.5v4M20.5 17.5h4"
            stroke="currentColor"
            strokeWidth={1.7}
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.8 }}
            transition={{ delay: 0.5, duration: 0.4 }}
          />
        </svg>
      </motion.div>

      {/* phase 2 — wordmark rises out of a clip mask */}
      <div className="mt-5 overflow-hidden">
        <div className="flex">
          {WORD.split("").map((ch, i) => (
            <motion.span
              key={i}
              className="font-display text-4xl font-bold tracking-tight text-ink"
              initial={{ y: "110%" }}
              animate={phase >= 1 ? { y: 0 } : { y: "110%" }}
              transition={{ ...spring, delay: i * 0.03 }}
            >
              {ch}
            </motion.span>
          ))}
        </div>
      </div>

      {/* phase 3 — deadpan terminal line */}
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

      {skippable && phase < 3 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute bottom-10 font-mono text-[10.5px] uppercase tracking-[0.18em] text-faint"
        >
          click to skip — the dust understands
        </motion.p>
      )}
    </motion.div>
  );
}
