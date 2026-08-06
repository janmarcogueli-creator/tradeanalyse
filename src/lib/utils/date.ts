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
