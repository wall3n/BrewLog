// A roast date is a calendar day. It is stored as the ISO string of local midnight on that day,
// so it shows as the same day in the date field and the day count does not drift.

const DATE_VALUE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 86_400_000;

const pad = (n: number): string => String(n).padStart(2, '0');

function parse(value: string): [number, number, number] | null {
  const m = DATE_VALUE.exec(value);
  if (!m) return null;
  return [Number(m[1]), Number(m[2]) - 1, Number(m[3])];
}

// ISO string → "YYYY-MM-DD" in local time, for <input type="date">.
export function toDateInputValue(iso: string | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// "YYYY-MM-DD" → ISO string of local midnight on that day.
export function fromDateInputValue(value: string): string | undefined {
  const p = parse(value);
  return p ? new Date(p[0], p[1], p[2]).toISOString() : undefined;
}

export function todayInputValue(now: Date): string {
  return toDateInputValue(now.toISOString());
}

// Calendar days from the roast day to today. Negative for a date after today.
export function daysOffRoast(value: string, now: Date): number | null {
  const p = parse(value);
  if (!p) return null;
  return Math.round((Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) - Date.UTC(p[0], p[1], p[2])) / MS_PER_DAY);
}
