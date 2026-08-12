import type { ClosedTrade, MetricsResult } from "./types";
import type { DayOutcomes, HistogramBucket, WeekdayHourBreakdown } from "./calculate";
import type { GroupMetrics } from "./buildDashboardPayload";
import { formatDuration, formatMoney, formatPercent, weekdayLabel } from "@/lib/utils/format";

const MIN_SAMPLE_SIZE = 3;

export function interpretLongShort(byDirection: GroupMetrics[]): string {
  const long = byDirection.find((g) => g.key === "long");
  const short = byDirection.find((g) => g.key === "short");
  if (!long?.metrics.tradeCount || !short?.metrics.tradeCount) {
    return "Nicht genug Long- und Short-Trades für einen Vergleich.";
  }
  const better = long.metrics.netPnl >= short.metrics.netPnl ? long : short;
  const worse = better === long ? short : long;
  return `${better.label} performt besser: ${formatMoney(better.metrics.netPnl)} bei ${formatPercent(better.metrics.winrate)} Winrate, gegenüber ${formatMoney(worse.metrics.netPnl)} bei ${formatPercent(worse.metrics.winrate)} für ${worse.label}.`;
}

export function interpretDayOutcomes(outcomes: DayOutcomes): string {
  const total = outcomes.winningDays + outcomes.losingDays + outcomes.breakEvenDays;
  if (total === 0) return "Keine Handelstage im gewählten Zeitraum.";
  const winShare = outcomes.winningDays / total;
  return `An ${outcomes.winningDays} von ${total} Handelstagen (${formatPercent(winShare)}) war die Tagesbilanz positiv, an ${outcomes.losingDays} negativ.`;
}

export function interpretWeekdayHour(data: WeekdayHourBreakdown[]): string {
  const reliable = data.filter((d) => d.tradeCount >= MIN_SAMPLE_SIZE);
  if (reliable.length === 0) return "Noch nicht genug Trades pro Zeitfenster für eine verlässliche Aussage.";
  const best = reliable.reduce((a, b) => (b.netPnl > a.netPnl ? b : a));
  const worst = reliable.reduce((a, b) => (b.netPnl < a.netPnl ? b : a));
  return `Beste Handelszeit: ${weekdayLabel(best.weekday)} ${best.hour}:00 Uhr (${formatMoney(best.netPnl)}). Schwächste: ${weekdayLabel(worst.weekday)} ${worst.hour}:00 Uhr (${formatMoney(worst.netPnl)}).`;
}

export function interpretHoldingTime(distribution: HistogramBucket[]): string {
  if (distribution.length === 0) return "Keine Trades mit erfasster Haltedauer.";
  const busiest = distribution.reduce((a, b) => (b.count > a.count ? b : a));
  return `Die meisten Trades (${busiest.count}) werden nach ${formatDuration(busiest.rangeStart)}–${formatDuration(busiest.rangeEnd)} geschlossen.`;
}

export function interpretRisk(rTrades: ClosedTrade[]): string {
  if (rTrades.length === 0) {
    return "Noch keine Trades mit erfasstem Risiko — beim manuellen Anlegen einen Stop-Loss angeben.";
  }
  const avgR = rTrades.reduce((sum, t) => sum + (t.rMultiple ?? 0), 0) / rTrades.length;
  return `Ø ${avgR.toFixed(2)} R über ${rTrades.length} Trade${rTrades.length === 1 ? "" : "s"} mit erfasstem Risiko.`;
}

export function interpretTags(tags: Array<{ name: string; metrics: MetricsResult }>): string {
  const withTrades = tags.filter((t) => t.metrics.tradeCount > 0);
  if (withTrades.length === 0) return "Noch keinem Trade ein Tag zugeordnet.";
  const best = withTrades.reduce((a, b) => (b.metrics.netPnl > a.metrics.netPnl ? b : a));
  const worst = withTrades.reduce((a, b) => (b.metrics.netPnl < a.metrics.netPnl ? b : a));
  if (best.name === worst.name) return `"${best.name}": ${formatMoney(best.metrics.netPnl)} über ${best.metrics.tradeCount} Trades.`;
  return `Stärkstes Tag: "${best.name}" (${formatMoney(best.metrics.netPnl)}). Schwächstes: "${worst.name}" (${formatMoney(worst.metrics.netPnl)}).`;
}
