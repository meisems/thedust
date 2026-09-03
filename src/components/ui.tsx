import { useEffect, useRef, useState, type ReactNode } from "react";

/* ---------------- scroll reveal ---------------- */

export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setOn(true);
          io.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal-base ${on ? "reveal-on" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ---------------- count-up number ---------------- */

export function CountUp({ value, decimals = 2, prefix = "", suffix = "", duration = 700 }: {
  value: number; decimals?: number; prefix?: string; suffix?: string; duration?: number;
}) {
  const [display, setDisplay] = useState(0);
  const prev = useRef(0);
  const raf = useRef(0);

  useEffect(() => {
    const from = prev.current;
    const to = value;
    prev.current = value;
    const t0 = performance.now();
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - k, 3);
      setDisplay(from + (to - from) * eased);
      if (k < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [value, duration]);

  return (
    <span>
      {prefix}
      {display.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
      {suffix}
    </span>
  );
}

/* ---------------- token monogram ---------------- */

export function TokenLogo({ symbol, hue, size = 34, dead = false }: {
  symbol: string; hue: number; size?: number; dead?: boolean;
}) {
  const bg = dead ? "#241417" : `hsl(${hue} 45% 16%)`;
  const fg = dead ? "#ff7a70" : `hsl(${hue} 85% 66%)`;
  const ring = dead ? "#5a2a2e" : `hsl(${hue} 45% 30%)`;
  return (
    <div
      className="grid place-items-center rounded-full font-mono font-semibold shrink-0 select-none"
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at 32% 28%, ${dead ? "#3a1d20" : `hsl(${hue} 45% 22%)`}, ${bg})`,
        border: `1px solid ${ring}`,
        color: fg,
        fontSize: size * 0.3,
        letterSpacing: "-0.02em",
        boxShadow: `0 0 14px -6px ${dead ? "rgba(255,92,92,.5)" : `hsl(${hue} 85% 60% / .45)`}`,
      }}
    >
      {symbol.slice(0, 3)}
    </div>
  );
}

/* ---------------- badges ---------------- */

export function Badge({ tone, children }: { tone: "green" | "red" | "amber" | "cyan" | "dim"; children: ReactNode }) {
  const tones: Record<string, string> = {
    green: "text-hood-400 border-hood-500/40 bg-hood-500/10",
    red: "text-redx-400 border-redx-500/40 bg-redx-500/10",
    amber: "text-amberx-400 border-amberx-500/40 bg-amberx-500/10",
    cyan: "text-cyanx-400 border-cyanx-500/40 bg-cyanx-500/10",
    dim: "text-mist-500 border-ink-500 bg-ink-700/40",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider ${tones[tone]}`}>
      {children}
    </span>
  );
}

/* ---------------- progress bar ---------------- */

export function ProgressBar({ value, tone = "green" }: { value: number; tone?: "green" | "amber" | "red" }) {
  const color = tone === "green" ? "linear-gradient(90deg,#14b857,#3df586)" : tone === "amber" ? "linear-gradient(90deg,#d99a25,#ffc861)" : "linear-gradient(90deg,#c23d3d,#ff7a70)";
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-700">
      <div
        className="h-full rounded-full transition-all duration-500 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, value * 100))}%`, background: color, boxShadow: "0 0 10px rgba(34,224,111,.4)" }}
      />
    </div>
  );
}

/* ---------------- delta chip with flash ---------------- */

export function DeltaChip({ value }: { value: number }) {
  const [flash, setFlash] = useState("");
  const prev = useRef(value);
  useEffect(() => {
    if (Math.abs(value - prev.current) > 1e-9) {
      setFlash(value > prev.current ? "flash-up" : "flash-down");
      prev.current = value;
      const id = setTimeout(() => setFlash(""), 1200);
      return () => clearTimeout(id);
    }
  }, [value]);

  if (Math.abs(value) < 0.005) return <span className="font-mono text-[11px] text-mist-600">—</span>;
  const up = value > 0;
  return (
    <span className={`font-mono text-[11px] ${flash} ${up ? "text-hood-400" : "text-redx-400"}`}>
      {up ? "▲" : "▼"} {Math.abs(value).toFixed(1)}%
    </span>
  );
}
