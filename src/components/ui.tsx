import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion } from "framer-motion";

/* soft spring preset — the house physics */
export const spring = { type: "spring" as const, damping: 15, stiffness: 200 };

/* ------------------------------------------------------------------ */
/*  Reveal — gentle scroll reveal                                      */
/* ------------------------------------------------------------------ */
export function Reveal({
  children,
  delay = 0,
  className,
  y = 22,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  y?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ ...spring, delay }}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  CountUp — odometer for USD figures                                 */
/* ------------------------------------------------------------------ */
export function CountUp({
  value,
  prefix = "",
  digits = 2,
  duration = 900,
}: {
  value: number;
  prefix?: string;
  digits?: number;
  duration?: number;
}) {
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);

  useEffect(() => {
    const from = fromRef.current;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (value - from) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return (
    <>
      {prefix}
      {display.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits })}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Monogram — soft hue-tinted token avatar                            */
/* ------------------------------------------------------------------ */
export function Monogram({ symbol, hue, size = 38 }: { symbol: string; hue: number; size?: number }) {
  return (
    <div
      className="squircle shrink-0 font-display font-bold"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        background: `hsl(${hue} 62% 92%)`,
        color: `hsl(${hue} 48% 36%)`,
        boxShadow: "inset 0 0 0 1px rgba(24,24,27,0.06)",
      }}
    >
      {symbol.slice(0, 2).toUpperCase()}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  ProgressBar — soft pill fill                                       */
/* ------------------------------------------------------------------ */
export function ProgressBar({ value, tone = "var(--acc)" }: { value: number; tone?: string }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: "var(--line)" }}>
      <motion.div
        className="h-full rounded-full"
        style={{ background: tone }}
        animate={{ width: `${Math.round(value * 100)}%` }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  StatusPill — tiny rounded badge                                    */
/* ------------------------------------------------------------------ */
export function StatusPill({
  tone,
  children,
}: {
  tone: "acc" | "gold" | "coral" | "sky" | "muted";
  children: ReactNode;
}) {
  const map = {
    acc: { bg: "var(--acc-soft)", fg: "var(--acc-ink)" },
    gold: { bg: "var(--gold-soft)", fg: "var(--gold-ink)" },
    coral: { bg: "var(--coral-soft)", fg: "var(--coral-ink)" },
    sky: { bg: "var(--sky-soft)", fg: "var(--sky-ink)" },
    muted: { bg: "var(--bg-soft)", fg: "var(--muted)" },
  }[tone];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[10.5px] leading-none"
      style={{ background: map.bg, color: map.fg }}
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Check — springy custom checkbox                                    */
/* ------------------------------------------------------------------ */
export function SoftCheck({ checked, onChange, label }: { checked: boolean; onChange: () => void; label?: string }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      className="group inline-flex items-center gap-2.5 outline-none"
    >
      <motion.span
        className="squircle shrink-0"
        style={{
          width: 21,
          height: 21,
          borderRadius: 8,
          background: checked ? "var(--acc)" : "var(--card)",
          boxShadow: checked ? "none" : "inset 0 0 0 1.6px var(--line-strong)",
        }}
        animate={{ scale: checked ? [1, 1.25, 1] : 1 }}
        transition={{ duration: 0.3 }}
      >
        {checked && (
          <motion.svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth={3.4}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.25, delay: 0.05 }}
          >
            <motion.path d="m5.5 12.5 4.3 4.3L18.5 7.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} />
          </motion.svg>
        )}
      </motion.span>
      {label && <span className="font-mono text-[11px] text-muted group-hover:text-ink-2">{label}</span>}
    </button>
  );
}
