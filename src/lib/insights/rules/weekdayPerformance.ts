import { calcPnlByWeekdayHour, calcWinrate } from "@/lib/metrics/calculate";
import { weekdayLabel } from "@/lib/utils/format";
import type { Insight, InsightContext } from "../types";

const MIN_SAMPLE_SIZE = 5;
const WINRATE_GAP_THRESHOLD = 0.2; // 20 percentage points below overall

/** Flags weekdays whose winrate lags the overall winrate by a wide margin —
 * "you lose more on Fridays" style pattern. Requires a minimum sample size
 * per weekday to avoid flagging noise from 1-2 trades. */
export function weekdayPerformance(ctx: InsightContext): Insight[] {
  const overallWinrate = calcWinrate(ctx.trades);
  if (overallWinrate === null) return [];

  const breakdown = calcPnlByWeekdayHour(ctx.trades);
  const insights: Insight[] = [];

  for (const day of breakdown) {
    if (day.tradeCount < MIN_SAMPLE_SIZE) continue;
    const dayWinrate = calcWinrate(ctx.trades.filter((t) => new Date(t.closeTime).getDay() === day.weekday));
    if (dayWinrate === null) continue;

    if (overallWinrate - dayWinrate >= WINRATE_GAP_THRESHOLD) {
      insights.push({
        ruleKey: "weekdayPerformance",
        severity: "warning",
        title: `Schwache Performance am ${weekdayLabel(day.weekday)}`,
        description: `Winrate am ${weekdayLabel(day.weekday)} liegt bei ${(dayWinrate * 100).toFixed(0)}% über ${day.tradeCount} Trades, gegenüber ${(overallWinrate * 100).toFixed(0)}% im Durchschnitt.`,
        scope: { type: "weekday", value: day.weekday },
      });
    }
  }

  return insights;
}
