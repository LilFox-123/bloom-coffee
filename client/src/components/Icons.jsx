const base = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

export const IconDashboard = (p) => (
  <svg {...base} {...p}>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
  </svg>
);

export const IconTable = (p) => (
  <svg {...base} {...p}>
    <rect x="3" y="8" width="18" height="3" rx="1" />
    <path d="M6 11v8M18 11v8M9 11v4M15 11v4" />
  </svg>
);

export const IconClipboard = (p) => (
  <svg {...base} {...p}>
    <rect x="6" y="4" width="12" height="17" rx="2" />
    <path d="M9 4h6v3H9zM9 11h6M9 15h4" />
  </svg>
);

export const IconMenuBook = (p) => (
  <svg {...base} {...p}>
    <path d="M12 6c-2-1.5-5-1.5-7 0v12c2-1.5 5-1.5 7 0M12 6c2-1.5 5-1.5 7 0v12c-2-1.5-5-1.5-7 0M12 6v12" />
  </svg>
);

export const IconReceipt = (p) => (
  <svg {...base} {...p}>
    <path d="M5 3v18l2-1.5L9 21l2-1.5L13 21l2-1.5L17 21l2-1.5V3l-2 1.5L15 3l-2 1.5L11 3 9 4.5 7 3 5 4.5z" />
    <path d="M8 8h8M8 12h8M8 16h5" />
  </svg>
);

export const IconUsers = (p) => (
  <svg {...base} {...p}>
    <circle cx="9" cy="8" r="3" />
    <path d="M3 20c0-3 2.7-5 6-5s6 2 6 5" />
    <path d="M16 11a3 3 0 0 0 0-6M21 20c0-2.5-1.5-4.3-4-4.8" />
  </svg>
);

export const IconPerson = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" />
  </svg>
);

export const IconBox = (p) => (
  <svg {...base} {...p}>
    <path d="M21 8 12 3 3 8l9 5 9-5z" />
    <path d="M3 8v8l9 5 9-5V8M12 13v8" />
  </svg>
);

export const IconChartBar = (p) => (
  <svg {...base} {...p}>
    <path d="M4 20V4M4 20h16" />
    <rect x="7" y="11" width="3" height="6" />
    <rect x="12" y="7" width="3" height="10" />
    <rect x="17" y="13" width="3" height="4" />
  </svg>
);

export const IconLogout = (p) => (
  <svg {...base} {...p}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
  </svg>
);

export const IconSearch = (p) => (
  <svg {...base} {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

export const IconPlus = (p) => (
  <svg {...base} {...p}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const IconEdit = (p) => (
  <svg {...base} {...p}>
    <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
  </svg>
);

export const IconTrash = (p) => (
  <svg {...base} {...p}>
    <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />
  </svg>
);

export const IconLock = (p) => (
  <svg {...base} {...p}>
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
);

export const IconUnlock = (p) => (
  <svg {...base} {...p}>
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 7.5-2" />
  </svg>
);

export const IconRevenue = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v10M9.5 9.5C9.5 8 10.5 7.5 12 7.5s2.5.7 2.5 2-1 1.8-2.5 2-2.5.5-2.5 2 1 2 2.5 2 2.5-.6 2.5-2" />
  </svg>
);

export const IconCart = (p) => (
  <svg {...base} {...p}>
    <circle cx="9" cy="20" r="1.5" />
    <circle cx="18" cy="20" r="1.5" />
    <path d="M2 3h3l2.4 12.4a1 1 0 0 0 1 .8h8.7a1 1 0 0 0 1-.8L21 7H6" />
  </svg>
);

export const IconWarn = (p) => (
  <svg {...base} {...p}>
    <path d="M12 3 2 20h20L12 3zM12 9v5M12 17h.01" />
  </svg>
);

export const IconPrint = (p) => (
  <svg {...base} {...p}>
    <path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" />
    <rect x="6" y="14" width="12" height="7" rx="1" />
  </svg>
);

export const IconEye = (p) => (
  <svg {...base} {...p}>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export const IconInbox = (p) => (
  <svg {...base} {...p}>
    <path d="M3 12h5l2 3h4l2-3h5" />
    <path d="M5 5h14l2 7v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6z" />
  </svg>
);

export const IconMenu = (p) => (
  <svg {...base} {...p}>
    <path d="M3 6h18M3 12h18M3 18h18" />
  </svg>
);

export const IconClose = (p) => (
  <svg {...base} {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

export const IconBean = (p) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
    <ellipse cx="12" cy="12" rx="7" ry="10" transform="rotate(35 12 12)" />
    <path
      d="M8 6c2 3 2 9 -1 12"
      stroke="#2C1A0E"
      strokeWidth="1.2"
      fill="none"
      strokeLinecap="round"
      opacity="0.5"
    />
  </svg>
);

export const IconQr = (p) => (
  <svg {...base} {...p}>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <path d="M14 14h3v3M21 14v7M17 21h4M14 21v-3" />
  </svg>
);
