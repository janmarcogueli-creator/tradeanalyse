import { weekdayPerformance } from "./rules/weekdayPerformance";
import { strategyExpectancyTrend } from "./rules/strategyExpectancyTrend";
import { longHoldLosses } from "./rules/longHoldLosses";
import { overtrading } from "./rules/overtrading";
import type { Insight, InsightContext, InsightRule } from "./types";

// Explicit registry (not fs-scanned) so the active rule set is traceable at
// a glance — this is also the extension point for future rules.
const INSIGHT_RULES: InsightRule[] = [weekdayPerformance, strategyExpectancyTrend, longHoldLosses, overtrading];

export function runInsightRules(ctx: InsightContext): Insight[] {
  return INSIGHT_RULES.flatMap((rule) => rule(ctx));
}
