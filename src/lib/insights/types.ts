import type { ClosedTrade } from "@/lib/metrics/types";

export type Severity = "info" | "warning" | "critical";

export interface Insight {
  ruleKey: string;
  severity: Severity;
  title: string;
  description: string;
  /** Identifies what this insight is about (e.g. {type:"weekday",value:2}) —
   * combined with ruleKey to dedupe against dismissed insights on re-run. */
  scope: Record<string, string | number>;
}

export interface StrategyTrades {
  strategyId: number;
  strategyName: string;
  trades: ClosedTrade[];
}

export interface InsightContext {
  trades: ClosedTrade[];
  byStrategy: StrategyTrades[];
}

export type InsightRule = (ctx: InsightContext) => Insight[];
