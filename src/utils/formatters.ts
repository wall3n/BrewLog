export const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export function daysSince(iso: string | undefined): number | null {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

export function roastBucket(days: number | null): 'green' | 'amber' | 'red' {
  if (days == null) return 'red';
  if (days < 7) return 'red';
  if (days <= 21) return 'green';
  if (days <= 42) return 'amber';
  return 'red';
}

export function fmtDate(iso: string): string {
  const d = new Date(iso);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

export function fmtRelDate(iso: string): string {
  const days = daysSince(iso);
  if (days === 0) return 'TODAY';
  if (days === 1) return 'YESTERDAY';
  if (days !== null && days < 7) return `${days}D AGO`;
  return fmtDate(iso).toUpperCase();
}

export function fmtTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}
