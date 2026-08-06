import { calcExpectancy } from "@/lib/metrics/calculate";
import type { Insight, InsightContext } from "../types";

const NEGATIVE_MONTH_STREAK_THRESHOLD = 3;

/** Flags strategies with negative expectancy for 3+ consecutive active
 * months (months the strategy actually traded in, not calendar months). */
export function strategyExpectancyTrend(ctx: InsightContext): Insight[] {
  const insights: Insight[] = [];

  for (const { strategyId, strategyName, trades } of ctx.byStrategy) {
    const byMonth = new Map<string, typeof trades>();
    for (const t of trades) {
      const month = t.closeTime.slice(0, 7); // YYYY-MM
      const list = byMonth.get(month) ?? [];
      list.push(t);
      byMonth.set(month, list);
    }

    const months = Array.from(byMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, monthTrades]) => ({ month, expectancy: calcExpectancy(monthTrades) }));

    let streak = 0;
    let worstStreak = 0;
    let worstStreakEndMonth = "";
    for (const m of months) {
      if (m.expectancy < 0) {
        streak++;
        if (streak > worstStreak) {
          worstStreak = streak;
          worstStreakEndMonth = m.month;
        }
      } else {
        streak = 0;
      }
    }

    if (worstStreak >= NEGATIVE_MONTH_STREAK_THRESHOLD) {
      insights.push({
        ruleKey: "strategyExpectancyTrend",
        severity: "critical",
        title: `Negative Expectancy: ${strategyName}`,
        description: `${strategyName} hatte ${worstStreak} aufeinanderfolgende Monate mit negativer Expectancy (bis ${worstStreakEndMonth}).`,
        scope: { type: "strategy", id: strategyId },
      });
    }
  }

  return insights;
}
