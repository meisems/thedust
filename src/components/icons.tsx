import type { SVGProps } from "react";

/* ------------------------------------------------------------------ */
/*  Nucleo-style icon system — smooth geometric line icons.            */
/*  24×24 grid · 1.7px stroke · rounded caps & joins · 16/20/24 sizes  */
/* ------------------------------------------------------------------ */

interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}

function base({ size = 20, ...rest }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    ...rest,
  };
}

export const BroomIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M20 4l-6.2 6.2" />
    <path d="M13.8 10.2l-7 2.9a2 2 0 0 0-.6 3.3l2.2 2.2a2 2 0 0 0 3.3-.6l2.9-7a.75.75 0 0 0-.8-.8Z" />
    <path d="M7.2 17.6l-.9 2.1M10 19.3l-.3 1.6" strokeWidth={1.4} />
  </svg>
);

export const SparkIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 3.5c.55 4.4 3.9 7.75 8.3 8.3-4.4.55-7.75 3.9-8.3 8.3-.55-4.4-3.9-7.75-8.3-8.3 4.4-.55 7.75-3.9 8.3-8.3Z" />
  </svg>
);

export const SunIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="3.8" />
    <path d="M12 3.5v1.8M12 18.7v1.8M3.5 12h1.8M18.7 12h1.8M6 6l1.3 1.3M16.7 16.7L18 18M18 6l-1.3 1.3M7.3 16.7L6 18" />
  </svg>
);

export const MoonIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M19.8 13.6A7.8 7.8 0 0 1 10.4 4.2 8 8 0 1 0 19.8 13.6Z" />
  </svg>
);

export const WalletIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5v-9Z" />
    <path d="M15 12.3h.01" strokeWidth={2.6} />
    <path d="M4 9.2h11.5" strokeWidth={1.4} />
  </svg>
);

export const ChevronDownIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m6.5 9.5 5.5 5.5 5.5-5.5" />
  </svg>
);

export const CopyIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="8.5" y="8.5" width="11" height="11" rx="2.5" />
    <path d="M5.5 15.5h-.2A1.8 1.8 0 0 1 3.5 13.7v-8A1.8 1.8 0 0 1 5.3 3.9h8a1.8 1.8 0 0 1 1.8 1.8v.3" />
  </svg>
);

export const ExternalIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M10 5.5H7A2.5 2.5 0 0 0 4.5 8v9A2.5 2.5 0 0 0 7 19.5h9a2.5 2.5 0 0 0 2.5-2.5v-3" />
    <path d="M13.5 4.5H19.5V10.5" />
    <path d="M19 5 11.5 12.5" />
  </svg>
);

export const RefreshIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3" />
    <path d="M19.7 3.8v3.4h-3.4" />
  </svg>
);

export const RadarIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 8.2V7a2.5 2.5 0 0 1 2.5-2.5h1.3M16.2 4.5h1.3A2.5 2.5 0 0 1 20 7v1.2M20 15.8V17a2.5 2.5 0 0 1-2.5 2.5h-1.3M7.8 19.5H6.5A2.5 2.5 0 0 1 4 17v-1.2" />
    <path d="M12 12h.01" strokeWidth={2.8} />
    <path d="M8.8 12a3.2 3.2 0 0 1 3.2-3.2" strokeWidth={1.4} />
  </svg>
);

export const ZapIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M13 3 5.2 13.4h5.3L11 21l7.8-10.4h-5.3L13 3Z" />
  </svg>
);

export const GhostIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M5 11.2a7 7 0 0 1 14 0V20l-2.3-1.7-2.4 1.7-2.3-1.7-2.3 1.7-2.4-1.7L5 20v-8.8Z" />
    <path d="M9.6 11h.01M14.4 11h.01" strokeWidth={2.6} />
  </svg>
);

export const CoinIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8.2" />
    <path d="M14.6 9.4c-.6-.9-1.6-1.4-2.7-1.4-1.6 0-2.7.8-2.7 1.9 0 2.7 5.6 1.4 5.6 4.2 0 1.2-1.2 2-2.9 2-1.3 0-2.4-.5-3-1.4" strokeWidth={1.4} />
    <path d="M12 6.2v1.6M12 16.2v1.6" strokeWidth={1.4} />
  </svg>
);

export const EthIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m12 3.5 4.8 7.4-4.8 2.9-4.8-2.9L12 3.5Z" />
    <path d="m12 20.5 4.8-7.6-4.8 2.9-4.8-2.9 4.8 7.6Z" />
  </svg>
);

export const FlameIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5Z" />
  </svg>
);

export const CheckIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m5.5 12.5 4.3 4.3L18.5 7.5" />
  </svg>
);

export const XIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />
  </svg>
);

export const AlertIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M10.3 4.6 2.9 17.4a1.9 1.9 0 0 0 1.6 2.9h14.9a1.9 1.9 0 0 0 1.6-2.9L13.7 4.6a1.95 1.95 0 0 0-3.4 0Z" />
    <path d="M12 9.5v4" />
    <path d="M12 16.6h.01" strokeWidth={2.6} />
  </svg>
);

export const InfoIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8.2" />
    <path d="M12 11v5" />
    <path d="M12 7.6h.01" strokeWidth={2.6} />
  </svg>
);

export const ClockIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8.2" />
    <path d="M12 7.5V12l3 2" />
  </svg>
);

export const CrownIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m4.5 8.2 3.7 3.1L12 5.4l3.8 5.9 3.7-3.1-1.3 9.3H5.8L4.5 8.2Z" />
    <path d="M6.5 20.5h11" strokeWidth={1.4} />
  </svg>
);

export const SlidersIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 7.5h9M17.5 7.5H20M4 16.5h2.5M11 16.5h9" />
    <circle cx="15" cy="7.5" r="2.2" />
    <circle cx="8.5" cy="16.5" r="2.2" />
  </svg>
);

export const ArrowRightIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4.5 12h15M13.5 6l6 6-6 6" />
  </svg>
);

export const GasIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M5 20.5V6.3A1.8 1.8 0 0 1 6.8 4.5h5.4A1.8 1.8 0 0 1 14 6.3v14.2" />
    <path d="M3.5 20.5h12" />
    <path d="M14 10.5h2.2a1.3 1.3 0 0 1 1.3 1.3v5.4a1.5 1.5 0 0 0 3 0V10l-2-2" />
    <rect x="7" y="7" width="5" height="3.6" rx="1" strokeWidth={1.4} />
  </svg>
);

export const ShieldIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 3.5 5.5 6v5.2c0 4.4 2.8 7.6 6.5 9.3 3.7-1.7 6.5-4.9 6.5-9.3V6L12 3.5Z" />
    <path d="m9.3 11.8 2 2 3.6-3.9" strokeWidth={1.5} />
  </svg>
);

/* brand mark — broom + spark, used in header & loader */
export const LogoMark = ({ size = 22, className }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M20 4l-6.2 6.2" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
    <path
      d="M13.8 10.2l-7 2.9a2 2 0 0 0-.6 3.3l2.2 2.2a2 2 0 0 0 3.3-.6l2.9-7a.75.75 0 0 0-.8-.8Z"
      fill="currentColor"
      opacity={0.9}
    />
    <path d="M22.5 15.5v4M20.5 17.5h4" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" opacity={0.75} />
  </svg>
);
