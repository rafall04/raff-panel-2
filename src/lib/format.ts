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
