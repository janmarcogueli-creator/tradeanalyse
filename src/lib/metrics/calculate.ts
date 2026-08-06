import type { ClosedTrade, MetricsResult } from "./types";
import { buildEquityCurve } from "./equity";
import { getMaxDrawdown } from "./drawdown";
import { calcConsecutiveStreaks } from "./streaks";

// All metric functions operate on `netPnl` (post-commission) unless noted
// otherwise, so figures are directly comparable to the account's real P&L.

export function calcWinrate(trades: ClosedTrade[]): number | null {
  if (trades.length === 0) return null;
  const wins = trades.filter((t) => t.netPnl > 0).length;
  return wins / trades.length;
}

export function calcProfitFactor(trades: ClosedTrade[]): number | null {
  const grossProfit = trades.filter((t) => t.netPnl > 0).reduce((sum, t) => sum + t.netPnl, 0);
  const grossLoss = trades.filter((t) => t.netPnl < 0).reduce((sum, t) => sum + t.netPnl, 0);
  if (grossLoss === 0) return null; // undefined without any losing trades to divide by
  return grossProfit / Math.abs(grossLoss);
}

export function calcExpectancy(trades: ClosedTrade[]): number {
  if (trades.length === 0) return 0;
  return trades.reduce((sum, t) => sum + t.netPnl, 0) / trades.length;
}

export function calcAvgWinLoss(trades: ClosedTrade[]): { avgWin: number | null; avgLoss: number | null } {
  const wins = trades.filter((t) => t.netPnl > 0);
  const losses = trades.filter((t) => t.netPnl < 0);
  return {
    avgWin: wins.length ? wins.reduce((s, t) => s + t.netPnl, 0) / wins.length : null,
    avgLoss: losses.length ? losses.reduce((s, t) => s + t.netPnl, 0) / losses.length : null,
  };
}

/** Average win / average loss ratio — a proxy for R:R absent per-trade risk data. */
export function calcRRRatio(trades: ClosedTrade[]): number | null {
  const { avgWin, avgLoss } = calcAvgWinLoss(trades);
  if (avgWin === null || avgLoss === null || avgLoss === 0) return null;
  return avgWin / Math.abs(avgLoss);
}

export function calcLargestWinLoss(trades: ClosedTrade[]): { largestWin: number | null; largestLoss: number | null } {
  if (trades.length === 0) return { largestWin: null, largestLoss: null };
  const pnls = trades.map((t) => t.netPnl);
  return { largestWin: Math.max(...pnls, 0) || null, largestLoss: Math.min(...pnls, 0) || null };
}

export function calcAvgHoldingTime(trades: ClosedTrade[]): number | null {
  const withDuration = trades.filter((t): t is ClosedTrade & { holdingSeconds: number } => t.holdingSeconds !== null);
  if (withDuration.length === 0) return null;
  return withDuration.reduce((sum, t) => sum + t.holdingSeconds, 0) / withDuration.length;
}

/** Daily-return-based Sharpe ratio, annualized by √252. Uses absolute daily
 * net PnL rather than a %-of-equity return, since this local journal doesn't
 * track account equity — a documented simplification, not a textbook Sharpe. */
export function calcSharpeRatio(trades: ClosedTrade[]): number | null {
  if (trades.length < 2) return null;

  const byDay = new Map<string, number>();
  for (const t of trades) {
    const day = t.closeTime.slice(0, 10);
    byDay.set(day, (byDay.get(day) ?? 0) + t.netPnl);
  }
  const dailyReturns = [...byDay.values()];
  if (dailyReturns.length < 2) return null;

  const mean = dailyReturns.reduce((s, v) => s + v, 0) / dailyReturns.length;
  const variance = dailyReturns.reduce((s, v) => s + (v - mean) ** 2, 0) / dailyReturns.length;
  const stdDev = Math.sqrt(variance);
  if (stdDev === 0) return null;

  return (mean / stdDev) * Math.sqrt(252);
}

export function calcRecoveryFactor(trades: ClosedTrade[]): number | null {
  const maxDrawdown = getMaxDrawdown(buildEquityCurve(trades));
  if (!maxDrawdown || maxDrawdown.value === 0) return null;
  const netPnl = trades.reduce((sum, t) => sum + t.netPnl, 0);
  return netPnl / Math.abs(maxDrawdown.value);
}

export interface WeekdayBreakdown {
  weekday: number; // 0=Sunday .. 6=Saturday
  tradeCount: number;
  netPnl: number;
  winrate: number | null;
}

const MIN_SAMPLE_SIZE = 3;

/** Per-weekday PnL/winrate. Days with fewer than MIN_SAMPLE_SIZE trades still
 * appear (tradeCount visible) but their winrate is null to avoid noise. */
export function calcPnlByWeekdayHour(trades: ClosedTrade[]): WeekdayBreakdown[] {
  const byWeekday = new Map<number, ClosedTrade[]>();
  for (const t of trades) {
    const weekday = new Date(t.closeTime).getDay();
    const list = byWeekday.get(weekday) ?? [];
    list.push(t);
    byWeekday.set(weekday, list);
  }

  return Array.from({ length: 7 }, (_, weekday) => {
    const dayTrades = byWeekday.get(weekday) ?? [];
    return {
      weekday,
      tradeCount: dayTrades.length,
      netPnl: dayTrades.reduce((sum, t) => sum + t.netPnl, 0),
      winrate: dayTrades.length >= MIN_SAMPLE_SIZE ? calcWinrate(dayTrades) : null,
    };
  });
}

export function calculateMetrics(trades: ClosedTrade[]): MetricsResult {
  const { avgWin, avgLoss } = calcAvgWinLoss(trades);
  const { largestWin, largestLoss } = calcLargestWinLoss(trades);
  const streaks = calcConsecutiveStreaks(trades);
  const maxDrawdown = getMaxDrawdown(buildEquityCurve(trades));

  return {
    tradeCount: trades.length,
    winrate: calcWinrate(trades),
    profitFactor: calcProfitFactor(trades),
    expectancy: calcExpectancy(trades),
    avgWin,
    avgLoss,
    rrRatio: calcRRRatio(trades),
    netPnl: trades.reduce((sum, t) => sum + t.netPnl, 0),
    grossPnl: trades.reduce((sum, t) => sum + t.grossPnl, 0),
    commissions: trades.reduce((sum, t) => sum + t.commissions, 0),
    largestWin,
    largestLoss,
    avgHoldingSeconds: calcAvgHoldingTime(trades),
    maxConsecutiveWins: streaks.maxConsecutiveWins,
    maxConsecutiveLosses: streaks.maxConsecutiveLosses,
    maxDrawdown,
    recoveryFactor: calcRecoveryFactor(trades),
    sharpeRatio: calcSharpeRatio(trades),
  };
}
