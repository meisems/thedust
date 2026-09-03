import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };

const base = (size = 16) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

/** Brand mark — broom sweeping a spark trail */
export const BroomIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M4 20 L14.5 9.5" strokeWidth={2.4} />
    <path d="M14.5 9.5 L19 5" strokeWidth={2.4} />
    <path d="M11.5 12.5 L8.5 11 M13.5 14.5 L11 17.5 M15 10.5 L18.5 12.5" />
    <path d="M4 20 L7 17" strokeWidth={2.4} />
  </svg>
);

export const EthIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M12 2.5 L18 12 L12 15.5 L6 12 Z" />
    <path d="M12 17.5 L18 13.8 L12 21.5 L6 13.8 Z" />
  </svg>
);

export const CoinIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M15 8.6 A4.6 4.6 0 1 0 15 15.4" />
    <path d="M15.5 12 H10" />
    <path d="M20.5 4.5 L22 3 M20.5 4.5 L22 6 M20.5 4.5 L19 3" strokeWidth={1.4} />
  </svg>
);

export const FlameIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M12 21c3.9 0 6.5-2.5 6.5-6.2 0-2.8-1.8-4.7-3.2-6.3C13.9 6.9 13 5.2 13 3c-2.8 1.7-4.2 4.2-4.1 6.7-.9-.4-1.5-1.2-1.8-2.2-1 1.3-1.6 3-1.6 4.8C5.5 18.5 8.1 21 12 21Z" />
    <path d="M12 21c1.9 0 3.2-1.3 3.2-3.2 0-1.8-1.4-2.9-3.2-4.6-1.8 1.7-3.2 2.8-3.2 4.6C8.8 19.7 10.1 21 12 21Z" strokeWidth={1.4} />
  </svg>
);

export const SkullIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M12 3a8 8 0 0 0-8 8c0 2.5 1.2 4.4 3 5.7V20a1.5 1.5 0 0 0 3 .1V19h4v1.1a1.5 1.5 0 0 0 3-.1v-3.3c1.8-1.3 3-3.2 3-5.7a8 8 0 0 0-8-8Z" />
    <circle cx="9" cy="11.5" r="1.6" fill="currentColor" stroke="none" />
    <circle cx="15" cy="11.5" r="1.6" fill="currentColor" stroke="none" />
    <path d="M12 14.5 L11 16.5 H13 Z" fill="currentColor" stroke="none" />
  </svg>
);

export const WalletIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M3.5 7.5 A2.5 2.5 0 0 1 6 5 H18 A2.5 2.5 0 0 1 20.5 7.5 V16.5 A2.5 2.5 0 0 1 18 19 H6 A2.5 2.5 0 0 1 3.5 16.5 Z" />
    <path d="M15 12 h5.5 v3.5 H15 a1.75 1.75 0 1 1 0 -3.5 Z" />
    <path d="M6 5 L14.5 2.8 A1.5 1.5 0 0 1 16.3 4.3 V5" />
  </svg>
);

export const RadarIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="4.5" strokeDasharray="2.5 3" />
    <path d="M12 12 L18 6" />
    <circle cx="15" cy="14.5" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="8.5" cy="9.5" r="1.1" fill="currentColor" stroke="none" />
  </svg>
);

export const CheckIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p} strokeWidth={2.4}>
    <path d="M4.5 12.5 L9.5 17.5 L19.5 6.5" />
  </svg>
);

export const XIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p} strokeWidth={2.2}>
    <path d="M6 6 L18 18 M18 6 L6 18" />
  </svg>
);

export const ExtIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p} strokeWidth={2}>
    <path d="M9 5 H5 V19 H19 V15" />
    <path d="M13 5 H19 V11 M19 5 L11 13" />
  </svg>
);

export const ZapIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M13 2 L5 13.5 H11 L10 22 L19 9.5 H13 Z" />
  </svg>
);

export const ShieldIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M12 2.8 L20 6 V11.5 C20 16.5 16.5 20 12 21.5 C7.5 20 4 16.5 4 11.5 V6 Z" />
    <path d="M8.8 12 L11.2 14.4 L15.4 9.6" />
  </svg>
);

export const ArrowRightIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p} strokeWidth={2.2}>
    <path d="M4 12 H20 M14 6 L20 12 L14 18" />
  </svg>
);

export const WarnIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M12 3.5 L21.5 20 H2.5 Z" />
    <path d="M12 9.5 V14" strokeWidth={2.2} />
    <circle cx="12" cy="16.8" r="1" fill="currentColor" stroke="none" />
  </svg>
);

export const RefreshIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p} strokeWidth={2}>
    <path d="M20 12 a8 8 0 1 1 -2.3 -5.6" />
    <path d="M20 3.5 V8 H15.5" />
  </svg>
);

export const CopyIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5 15 H4.5 A1.5 1.5 0 0 1 3 13.5 V4.5 A1.5 1.5 0 0 1 4.5 3 H13.5 A1.5 1.5 0 0 1 15 4.5 V5" />
  </svg>
);

export const GhostIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M5 20 V11 A7 7 0 0 1 19 11 V20 L16.7 18 L14.3 20 L12 18 L9.7 20 L7.3 18 Z" />
    <circle cx="9.3" cy="11" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="14.7" cy="11" r="1.2" fill="currentColor" stroke="none" />
  </svg>
);

export const Spinner = ({ size = 16, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={`spin ${className}`}>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2.6" />
    <path d="M21 12 a9 9 0 0 0 -9 -9" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
  </svg>
);
