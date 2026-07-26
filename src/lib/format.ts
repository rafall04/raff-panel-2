/**
 * Shared display formatters.
 *
 * These used to be copy-pasted per view, which let the dashboard and the
 * traffic page disagree about how many decimals a figure gets — the sort of
 * inconsistency that reads as sloppiness even when the numbers are right.
 */

const BYTE_UNITS = ["B", "KB", "MB", "GB", "TB"] as const;

/**
 * Human-readable byte size. Drops the decimal once the figure reaches three
 * digits (or is plain bytes), so a tile never has to fit "1023.4 MB".
 */
export function formatBytes(value: number): string {
  if (!Number.isFinite(value) || value <= 0) {
    return "0 B";
  }

  let size = value;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < BYTE_UNITS.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  const decimals = size >= 100 || unitIndex === 0 ? 0 : 1;
  return `${size.toFixed(decimals)} ${BYTE_UNITS[unitIndex]}`;
}

export const currencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
});

/** "12 Mar 2025" — compact enough for a list row, unambiguous across locales. */
export function formatDate(value: string | number | Date): string {
  return new Date(value).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const MONTH_ID = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
] as const;

/**
 * "26 Jul 2026" from a bare `YYYY-MM-DD` string, without going through `Date`.
 *
 * The backend sends calendar dates (daily traffic buckets) with no time or zone.
 * `new Date("2026-07-26")` parses as UTC midnight, so a viewer in a negative
 * offset renders the *previous* day — the row would disagree with the figure
 * next to it. Parsing the parts literally keeps a calendar date a calendar date.
 * Falls back to the raw input if the shape is unexpected.
 */
export function formatIsoDate(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return value;
  }
  const [, year, month, day] = match;
  const monthLabel = MONTH_ID[Number(month) - 1];
  if (!monthLabel) {
    return value;
  }
  return `${Number(day)} ${monthLabel} ${year}`;
}

/** "12 Mar 2025, 14.05" — for "last updated" style stamps. */
export function formatDateTime(value: string | number | Date): string {
  return new Date(value).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
