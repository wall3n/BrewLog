import type { SVGProps } from 'react';

type IconName =
  | 'home' | 'plus' | 'search' | 'clock' | 'history' | 'bean' | 'flask'
  | 'recipe' | 'equipment' | 'chart' | 'settings' | 'arrowLeft' | 'arrowRight'
  | 'arrowUp' | 'arrowDown' | 'check' | 'x' | 'star' | 'starFill' | 'play'
  | 'pause' | 'reset' | 'edit' | 'trash' | 'copy' | 'filter' | 'droplet'
  | 'flame' | 'thermo' | 'scale' | 'espresso' | 'frenchPress' | 'pourOver'
  | 'aeropress' | 'mokaPot' | 'coldBrew' | 'drip' | 'siphon' | 'custom'
  | 'user' | 'download' | 'upload' | 'chevronRight' | 'chevronDown' | 'chevronUp'
  | 'sparkles' | 'refractometer' | 'grid' | 'list' | 'more' | 'sun' | 'moon';

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName | string;
  size?: number;
}

const PATHS: Record<string, React.ReactNode> = {
  home: <><path d="M3 12 12 3l9 9"/><path d="M5 10v10h14V10"/></>,
  plus: <><path d="M12 5v14M5 12h14"/></>,
  search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  history: <><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l3 2"/></>,
  bean: <><path d="M5 18c3-1 5-3 6-6s3-5 6-6"/><path d="M5 18c-1.5-3 0-7 3-9s7-3.5 10-3c.5 3-1 7-3 9s-7 4.5-10 3z"/></>,
  flask: <><path d="M9 3h6"/><path d="M10 3v6.5L4.5 18a2 2 0 0 0 1.7 3h11.6a2 2 0 0 0 1.7-3L14 9.5V3"/><path d="M7 14h10"/></>,
  recipe: <><path d="M4 4h12a2 2 0 0 1 2 2v14l-3-2-3 2-3-2-3 2-2-2V4z"/><path d="M8 8h6M8 12h6M8 16h4"/></>,
  equipment: <><path d="M5 8h14l-1 9a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 8z"/><path d="M9 8V5a3 3 0 0 1 6 0v3"/></>,
  chart: <><path d="M3 21h18"/><path d="M5 21V11"/><path d="M11 21V7"/><path d="M17 21v-6"/></>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.65 1.65 0 0 0-1.8-.3 1.65 1.65 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.65 1.65 0 0 0-1-1.5 1.65 1.65 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.65 1.65 0 0 0 .3-1.8 1.65 1.65 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.65 1.65 0 0 0 1.5-1 1.65 1.65 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.65 1.65 0 0 0 1.8.3h0a1.65 1.65 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.65 1.65 0 0 0 1 1.5h0a1.65 1.65 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.65 1.65 0 0 0-.3 1.8v0a1.65 1.65 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.65 1.65 0 0 0-1.5 1z"/></>,
  arrowLeft: <><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></>,
  arrowRight: <><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></>,
  arrowUp: <><path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></>,
  arrowDown: <><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></>,
  check: <><path d="M5 12l5 5L20 7"/></>,
  x: <><path d="M18 6L6 18M6 6l12 12"/></>,
  star: <><path d="m12 2 3.1 6.3 7 1-5 4.9 1.2 6.8L12 18l-6.3 3 1.2-6.8-5-4.9 7-1z"/></>,
  starFill: <><path d="m12 2 3.1 6.3 7 1-5 4.9 1.2 6.8L12 18l-6.3 3 1.2-6.8-5-4.9 7-1z" fill="currentColor"/></>,
  play: <><path d="M6 4l14 8-14 8z" fill="currentColor"/></>,
  pause: <><path d="M6 4h4v16H6zM14 4h4v16h-4z" fill="currentColor"/></>,
  reset: <><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></>,
  edit: <><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></>,
  trash: <><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></>,
  copy: <><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>,
  filter: <><path d="M3 4h18"/><path d="M7 12h10"/><path d="M10 20h4"/></>,
  droplet: <><path d="M12 2.5s7 7.5 7 12a7 7 0 1 1-14 0c0-4.5 7-12 7-12z"/></>,
  flame: <><path d="M12 22c4 0 7-3 7-7 0-3-2-5-3-7-1 2-2 3-3 3 0-3-1-5-3-7-1 4-5 6-5 11a7 7 0 0 0 7 7z"/></>,
  thermo: <><path d="M14 14.5V4a2 2 0 1 0-4 0v10.5a4 4 0 1 0 4 0z"/></>,
  scale: <><path d="M2 9h20"/><path d="M5 9l-2 6a4 4 0 0 0 8 0L9 9"/><path d="M19 9l-2 6a4 4 0 0 0 8 0l-2-6" transform="translate(-4 0)"/><path d="M12 9v12"/><path d="M6 21h12"/></>,
  espresso: <><path d="M5 8h14l-1 9a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 8z"/><path d="M19 11h2a2 2 0 0 1 0 4h-2.5"/><path d="M9 4v2M12 4v2M15 4v2"/></>,
  frenchPress: <><rect x="7" y="3" width="10" height="18" rx="1"/><path d="M7 9h10"/><path d="M9 3V2h6v1"/><path d="M11 13h2"/></>,
  pourOver: <><path d="M6 4h12l-2 7H8z"/><path d="M9 11l1 6h4l1-6"/><path d="M10 17v3h4v-3"/></>,
  aeropress: <><path d="M8 3h8v4l-1 12a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2L8 7z"/><path d="M8 7h8"/><circle cx="12" cy="13" r="1.5"/></>,
  mokaPot: <><path d="M5 11h14l-1 9a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2z"/><path d="M9 11V8a3 3 0 0 1 6 0v3"/><path d="M17 14h2a2 2 0 0 1 0 4h-1.5"/></>,
  coldBrew: <><path d="M7 3h10v18H7z"/><path d="M7 8h10"/><path d="M10 12c0 1 2 1 2 2s-2 1-2 2"/><path d="M14 13c0 1 2 1 2 2"/></>,
  drip: <><path d="M5 4h14"/><path d="M7 4l2 7h6l2-7"/><path d="M9 11l2 5h2l2-5"/><path d="M11 16v3"/><path d="M13 16v3"/></>,
  siphon: <><circle cx="12" cy="7" r="4"/><path d="M10 11v3h4v-3"/><path d="M8 14h8v6H8z"/></>,
  custom: <><circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/></>,
  user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
  download: <><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></>,
  upload: <><path d="M12 21V9"/><path d="m7 14 5-5 5 5"/><path d="M5 3h14"/></>,
  chevronRight: <><path d="m9 6 6 6-6 6"/></>,
  chevronDown: <><path d="m6 9 6 6 6-6"/></>,
  chevronUp: <><path d="m6 15 6-6 6 6"/></>,
  sparkles: <><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.5 5.5l2.5 2.5M16 16l2.5 2.5M5.5 18.5l2.5-2.5M16 8l2.5-2.5"/></>,
  refractometer: <><rect x="3" y="9" width="18" height="6" rx="1"/><path d="M7 9V6M11 9V6M15 9V6M19 9V6"/></>,
  grid: <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></>,
  list: <><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></>,
  more: <><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></>,
  sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></>,
  moon: <><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></>,
};

export function Icon({ name, size = 18, ...rest }: IconProps) {
  const path = PATHS[name];
  if (!path) return null;
  return (
    <svg
      width={size} height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {path}
    </svg>
  );
}
