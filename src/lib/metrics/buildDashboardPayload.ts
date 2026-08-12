import type { getFilteredClosedTrades } from "@/db/queries/trades";
import {
  calculateMetrics,
  calcDailyPnl,
  calcPnlByWeekdayHour,
  calcPnlByMonth,
  calcSymbolTradeCounts,
  buildPnlHistogram,
  getTopTrades,
  type DailyPnl,
  type HistogramBucket,
  type MonthBreakdown,
  type SymbolFrequency,
  type WeekdayBreakdown,
} from "./calculate";
import { buildEquityCurve } from "./equity";
import { buildDrawdownCurve } from "./drawdown";
import type { ClosedTrade, EquityPoint, DrawdownPoint, MetricsResult } from "./types";

export type JoinedTrade = Awaited<ReturnType<typeof getFilteredClosedTrades>>[number];

export function toClosedTrade(t: JoinedTrade): ClosedTrade {
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
    rMultiple: t.rMultiple,
  };
}

export interface GroupMetrics {
  key: string;
  label: string;
  metrics: MetricsResult;
}

export interface DurationPnlPoint {
  symbol: string;
  holdingSeconds: number;
  netPnl: number;
}

export interface DashboardPayload {
  metrics: MetricsResult;
  weekdayBreakdown: WeekdayBreakdown[];
  monthBreakdown: MonthBreakdown[];
  byStrategy: GroupMetrics[];
  byAssetClass: GroupMetrics[];
  byDirection: GroupMetrics[];
  bySymbol: GroupMetrics[];
  symbolFrequency: SymbolFrequency[];
  equityCurve: EquityPoint[];
  drawdownCurve: DrawdownPoint[];
  dailyPnl: DailyPnl[];
  histogram: HistogramBucket[];
  durationVsPnl: DurationPnlPoint[];
  topWinners: ClosedTrade[];
  topLosers: ClosedTrade[];
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

  const byDirectionMap = new Map<string, ClosedTrade[]>();
  for (const t of closed) {
    const list = byDirectionMap.get(t.direction) ?? [];
    list.push(t);
    byDirectionMap.set(t.direction, list);
  }

  const bySymbolMap = new Map<string, ClosedTrade[]>();
  for (const t of closed) {
    const list = bySymbolMap.get(t.symbol) ?? [];
    list.push(t);
    bySymbolMap.set(t.symbol, list);
  }

  const { winners, losers } = getTopTrades(closed);

  return {
    metrics: calculateMetrics(closed),
    weekdayBreakdown: calcPnlByWeekdayHour(closed),
    monthBreakdown: calcPnlByMonth(closed),
    byStrategy: Array.from(byStrategyMap.entries())
      .map(([key, { label, trades }]) => ({ key, label, metrics: calculateMetrics(trades) }))
      .sort(sortByNetPnlDesc),
    byAssetClass: Array.from(byAssetClassMap.entries())
      .map(([key, trades]) => ({ key, label: key, metrics: calculateMetrics(trades) }))
      .sort(sortByNetPnlDesc),
    byDirection: Array.from(byDirectionMap.entries())
      .map(([key, trades]) => ({ key, label: key === "long" ? "Long" : "Short", metrics: calculateMetrics(trades) }))
      .sort(sortByNetPnlDesc),
    bySymbol: Array.from(bySymbolMap.entries())
      .map(([key, trades]) => ({ key, label: key, metrics: calculateMetrics(trades) }))
      .sort(sortByNetPnlDesc),
    symbolFrequency: calcSymbolTradeCounts(closed),
    equityCurve: buildEquityCurve(closed),
    drawdownCurve: buildDrawdownCurve(buildEquityCurve(closed)),
    dailyPnl: calcDailyPnl(closed),
    histogram: buildPnlHistogram(closed),
    durationVsPnl: closed
      .filter((t): t is ClosedTrade & { holdingSeconds: number } => t.holdingSeconds !== null)
      .map((t) => ({ symbol: t.symbol, holdingSeconds: t.holdingSeconds, netPnl: t.netPnl })),
    topWinners: winners,
    topLosers: losers,
  };
}
