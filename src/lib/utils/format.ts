export function formatMoney(value: number | null): string {
  if (value === null) return "–";
  return value.toLocaleString("de-DE", { style: "currency", currency: "USD" });
}

export function formatPercent(value: number | null, digits = 1): string {
  if (value === null) return "–";
  return `${(value * 100).toFixed(digits)}%`;
}

export function formatRatio(value: number | null, digits = 2): string {
  if (value === null) return "–";
  return value.toFixed(digits);
}

export function formatDuration(seconds: number | null): string {
  if (seconds === null) return "–";
  const totalMinutes = Math.round(seconds / 60);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

const WEEKDAY_LABELS_DE = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

export function weekdayLabel(weekday: number): string {
  return WEEKDAY_LABELS_DE[weekday] ?? "?";
}
