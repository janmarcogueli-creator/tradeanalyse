import type { Insight, InsightContext } from "../types";

const MIN_TRADING_DAYS = 10;
const MIN_HIGH_VOLUME_DAYS = 3;
const HIGH_VOLUME_STDDEV_MULTIPLIER = 1.5;

/** Flags overtrading: days with an unusually high trade count (relative to
 * the rolling average) that also show worse average PnL per trade than
 * normal-volume days — evidence that trading more hurts results. */
export function overtrading(ctx: InsightContext): Insight[] {
  const byDay = new Map<string, typeof ctx.trades>();
  for (const t of ctx.trades) {
    const day = t.closeTime.slice(0, 10);
    const list = byDay.get(day) ?? [];
    list.push(t);
    byDay.set(day, list);
  }

  const days = Array.from(byDay.values());
  if (days.length < MIN_TRADING_DAYS) return [];

  const counts = days.map((d) => d.length);
  const meanCount = counts.reduce((s, c) => s + c, 0) / counts.length;
  const variance = counts.reduce((s, c) => s + (c - meanCount) ** 2, 0) / counts.length;
  const stdDev = Math.sqrt(variance);
  if (stdDev === 0) return [];

  const threshold = meanCount + HIGH_VOLUME_STDDEV_MULTIPLIER * stdDev;
  const highVolumeDays = days.filter((d) => d.length > threshold);
  const normalDays = days.filter((d) => d.length <= threshold);
  if (highVolumeDays.length < MIN_HIGH_VOLUME_DAYS || normalDays.length === 0) return [];

  const avgPnlPerTrade = (dayGroups: (typeof ctx.trades)[]) => {
    const allTrades = dayGroups.flat();
    return allTrades.length ? allTrades.reduce((s, t) => s + t.netPnl, 0) / allTrades.length : 0;
  };

  const highVolumeAvg = avgPnlPerTrade(highVolumeDays);
  const normalAvg = avgPnlPerTrade(normalDays);

  if (highVolumeAvg < normalAvg && (normalAvg <= 0 || highVolumeAvg / normalAvg < 0.5)) {
    return [
      {
        ruleKey: "overtrading",
        severity: "warning",
        title: "Overtrading erkannt",
        description: `An ${highVolumeDays.length} Tagen mit überdurchschnittlich vielen Trades (>${threshold.toFixed(1)} statt Ø ${meanCount.toFixed(1)}) lag der Ø-PnL/Trade bei ${highVolumeAvg.toFixed(2)}$ statt ${normalAvg.toFixed(2)}$ an normalen Tagen.`,
        scope: { type: "overtrading" },
      },
    ];
  }

  return [];
}
