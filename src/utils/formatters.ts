import i18n from '../i18n';

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
  const locale = i18n.language || 'en';
  return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(d);
}

export function fmtRelDate(iso: string): string {
  const days = daysSince(iso);
  if (days === 0) return i18n.t('common.today');
  if (days === 1) return i18n.t('common.yesterday');
  if (days !== null && days < 7) return i18n.t('common.daysAgo', { count: days });
  return fmtDate(iso).toUpperCase();
}

export function fmtTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}
