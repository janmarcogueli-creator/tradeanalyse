// Builds the date string from local getters rather than toISOString() (which
// converts to UTC) — a UTC round-trip shifts the date near local midnight
// whenever the timezone offset is non-zero (e.g. local midnight Aug 1 CEST
// becomes "2026-07-31" in UTC).
function toIsoDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Monday-based current week (DE convention), from Monday 00:00 through today. */
export function getCurrentWeekRange(): { from: string; to: string } {
  const now = new Date();
  const day = now.getDay(); // 0=Sunday..6=Saturday
  const diffToMonday = day === 0 ? 6 : day - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - diffToMonday);
  return { from: toIsoDate(monday), to: toIsoDate(now) };
}

/** Current calendar month, from the 1st through today. */
export function getCurrentMonthRange(): { from: string; to: string } {
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  return { from: toIsoDate(firstOfMonth), to: toIsoDate(now) };
}

export type TimeframePreset = "all" | "ytd" | "week" | "month" | "custom";

/** Resolves a named dashboard timeframe preset to a dateFrom/dateTo pair.
 * "all" and "custom" return no bounds — "custom" leaves dateFrom/dateTo to
 * whatever the caller already has from the URL (typically user-picked date
 * inputs), it's only listed here so callers can switch over the full set of
 * presets exhaustively. */
export function resolveTimeframePreset(preset: TimeframePreset): { dateFrom?: string; dateTo?: string } {
  switch (preset) {
    case "ytd":
      return { dateFrom: `${new Date().getFullYear()}-01-01` };
    case "week": {
      const { from, to } = getCurrentWeekRange();
      return { dateFrom: from, dateTo: to };
    }
    case "month": {
      const { from, to } = getCurrentMonthRange();
      return { dateFrom: from, dateTo: to };
    }
    case "all":
    case "custom":
      return {};
  }
}
