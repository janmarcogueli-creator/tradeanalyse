import type { getFilteredClosedTrades } from "@/db/queries/trades";
import { calculateMetrics, calcPnlByWeekdayHour, type WeekdayBreakdown } from "./calculate";
import type { ClosedTrade, MetricsResult } from "./types";

type JoinedTrade = Awaited<ReturnType<typeof getFilteredClosedTrades>>[number];

function toClosedTrade(t: JoinedTrade): ClosedTrade {
  return {
    id: t.id,
    symbol: t.symbol,
    assetCategory: t.assetCategory,
    direction: t.direction,
    closeTime: t.closeTime as string, // buildTradeWhereClause always filters status="closed"
    netPnl: t.netPnl ?? 0,
    grossPnl: t.grossPnl ?? 0,
    commissions: t.commissions,
    holdingSeconds: t.holdingSeconds,
  };
}

export interface GroupMetrics {
  key: string;
  label: string;
  metrics: MetricsResult;
}

export interface DashboardPayload {
  metrics: MetricsResult;
  weekdayBreakdown: WeekdayBreakdown[];
  byStrategy: GroupMetrics[];
  byAssetClass: GroupMetrics[];
}

function sortByNetPnlDesc(a: GroupMetrics, b: GroupMetrics) {
  return b.metrics.netPnl - a.metrics.netPnl;
}

export function buildDashboardPayload(joinedTrades: JoinedTrade[]): DashboardPayload {
  const closed = joinedTrades.map(toClosedTrade);

  const byAssetClassMap = new Map<string, ClosedTrade[]>();
  for (const t of closed) {
    const list = byAssetClassMap.get(t.assetCategory) ?? [];
    list.push(t);
    byAssetClassMap.set(t.assetCategory, list);
  }

  const byStrategyMap = new Map<string, { label: string; trades: ClosedTrade[] }>();
  for (const jt of joinedTrades) {
    for (const ts of jt.tradeStrategies) {
      const entry = byStrategyMap.get(String(ts.strategyId)) ?? { label: ts.strategy.name, trades: [] };
      entry.trades.push(toClosedTrade(jt));
      byStrategyMap.set(String(ts.strategyId), entry);
    }
  }

  return {
    metrics: calculateMetrics(closed),
    weekdayBreakdown: calcPnlByWeekdayHour(closed),
    byStrategy: Array.from(byStrategyMap.entries())
      .map(([key, { label, trades }]) => ({ key, label, metrics: calculateMetrics(trades) }))
      .sort(sortByNetPnlDesc),
    byAssetClass: Array.from(byAssetClassMap.entries())
      .map(([key, trades]) => ({ key, label: key, metrics: calculateMetrics(trades) }))
      .sort(sortByNetPnlDesc),
  };
}
