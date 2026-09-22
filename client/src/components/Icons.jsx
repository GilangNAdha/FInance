/** Ikon SVG stroke — tanpa dependensi eksternal */

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

export const Home = (p) => (
  <svg viewBox="0 0 24 24" width={p.size || 22} height={p.size || 22} {...base} aria-hidden="true">
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5.5 9.5V21h13V9.5" />
    <path d="M9.5 21v-6h5v6" />
  </svg>
);

export const List = (p) => (
  <svg viewBox="0 0 24 24" width={p.size || 22} height={p.size || 22} {...base} aria-hidden="true">
    <path d="M8 6h13M8 12h13M8 18h13" />
    <circle cx="4" cy="6" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="4" cy="12" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="4" cy="18" r="1.2" fill="currentColor" stroke="none" />
  </svg>
);

export const Chart = (p) => (
  <svg viewBox="0 0 24 24" width={p.size || 22} height={p.size || 22} {...base} aria-hidden="true">
    <path d="M4 20V10" />
    <path d="M10 20V4" />
    <path d="M16 20v-7" />
    <path d="M22 20H2" />
  </svg>
);

export const Gear = (p) => (
  <svg viewBox="0 0 24 24" width={p.size || 22} height={p.size || 22} {...base} aria-hidden="true">
    <circle cx="12" cy="12" r="3.2" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.55-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34h.09a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87v.09a1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.55 1z" />
  </svg>
);

export const Plus = (p) => (
  <svg viewBox="0 0 24 24" width={p.size || 20} height={p.size || 20} {...base} aria-hidden="true">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const Download = (p) => (
  <svg viewBox="0 0 24 24" width={p.size || 18} height={p.size || 18} {...base} aria-hidden="true">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <path d="m7 10 5 5 5-5" />
    <path d="M12 15V3" />
  </svg>
);

export const ArrowUp = (p) => (
  <svg viewBox="0 0 24 24" width={p.size || 16} height={p.size || 16} {...base} aria-hidden="true">
    <path d="M12 19V5" />
    <path d="m5 12 7-7 7 7" />
  </svg>
);

export const ArrowDown = (p) => (
  <svg viewBox="0 0 24 24" width={p.size || 16} height={p.size || 16} {...base} aria-hidden="true">
    <path d="M12 5v14" />
    <path d="m19 12-7 7-7-7" />
  </svg>
);

export const Wallet = (p) => (
  <svg viewBox="0 0 24 24" width={p.size || 20} height={p.size || 20} {...base} aria-hidden="true">
    <path d="M20 7H5a2 2 0 0 1 0-4h13v4" />
    <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1" />
    <path d="M16 13.5h.01" />
  </svg>
);

export const Calendar = (p) => (
  <svg viewBox="0 0 24 24" width={p.size || 16} height={p.size || 16} {...base} aria-hidden="true">
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M16 3v4M8 3v4M3 11h18" />
  </svg>
);

export const Pencil = (p) => (
  <svg viewBox="0 0 24 24" width={p.size || 15} height={p.size || 15} {...base} aria-hidden="true">
    <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z" />
  </svg>
);

export const Trash = (p) => (
  <svg viewBox="0 0 24 24" width={p.size || 15} height={p.size || 15} {...base} aria-hidden="true">
    <path d="M3 6h18" />
    <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    <path d="M10 11v6M14 11v6" />
  </svg>
);

export const Search = (p) => (
  <svg viewBox="0 0 24 24" width={p.size || 16} height={p.size || 16} {...base} aria-hidden="true">
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

export const FileXls = (p) => (
  <svg viewBox="0 0 24 24" width={p.size || 20} height={p.size || 20} {...base} aria-hidden="true">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
    <path d="m9 13 6 5M15 13l-6 5" />
  </svg>
);

export const Sparkle = (p) => (
  <svg viewBox="0 0 24 24" width={p.size || 16} height={p.size || 16} {...base} aria-hidden="true">
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8" />
  </svg>
);

export const Info = (p) => (
  <svg viewBox="0 0 24 24" width={p.size || 16} height={p.size || 16} {...base} aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 16v-5M12 8h.01" />
  </svg>
);

export const Check = (p) => (
  <svg viewBox="0 0 24 24" width={p.size || 16} height={p.size || 16} {...base} aria-hidden="true">
    <path d="m5 12 5 5L20 7" />
  </svg>
);

export const Close = (p) => (
  <svg viewBox="0 0 24 24" width={p.size || 16} height={p.size || 16} {...base} aria-hidden="true">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

export const Doc = (p) => (
  <svg viewBox="0 0 24 24" width={p.size || 22} height={p.size || 22} {...base} aria-hidden="true">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
    <path d="M8 13h8M8 17h5" />
  </svg>
);
