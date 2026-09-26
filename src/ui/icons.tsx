/** Minimal inline icons (currentColor). Decorative: buttons always carry a text label or aria-label. */

const base = { width: 16, height: 16, viewBox: '0 0 16 16', 'aria-hidden': true } as const;

export const PlayIcon = () => (
  <svg {...base}>
    <path d="M4 2.5v11l9-5.5z" fill="currentColor" />
  </svg>
);

export const PauseIcon = () => (
  <svg {...base}>
    <rect x="3.5" y="2.5" width="3" height="11" rx="0.5" fill="currentColor" />
    <rect x="9.5" y="2.5" width="3" height="11" rx="0.5" fill="currentColor" />
  </svg>
);

export const StepForwardIcon = () => (
  <svg {...base}>
    <path d="M3 3v10l7-5z" fill="currentColor" />
    <rect x="11" y="3" width="2" height="10" rx="0.5" fill="currentColor" />
  </svg>
);

export const StepBackIcon = () => (
  <svg {...base}>
    <path d="M13 3v10L6 8z" fill="currentColor" />
    <rect x="3" y="3" width="2" height="10" rx="0.5" fill="currentColor" />
  </svg>
);
