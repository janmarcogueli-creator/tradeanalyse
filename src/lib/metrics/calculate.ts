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

export interface DailyPnl {
  date: string; // YYYY-MM-DD
  netPnl: number;
  tradeCount: number;
}

/** Net PnL bucketed by calendar day (local date of closeTime) — feeds the PnL calendar heatmap. */
export function calcDailyPnl(trades: ClosedTrade[]): DailyPnl[] {
  const byDay = new Map<string, { netPnl: number; tradeCount: number }>();
  for (const t of trades) {
    const day = t.closeTime.slice(0, 10);
    const entry = byDay.get(day) ?? { netPnl: 0, tradeCount: 0 };
    entry.netPnl += t.netPnl;
    entry.tradeCount += 1;
    byDay.set(day, entry);
  }
  return Array.from(byDay.entries())
    .map(([date, v]) => ({ date, ...v }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export interface HistogramBucket {
  rangeStart: number;
  rangeEnd: number;
  count: number;
}

/** Even-width netPnl histogram (win/loss distribution) split into `bucketCount`
 * bins spanning the trade set's min..max — losses and wins share one continuous
 * axis so the bucket straddling zero is visible. */
export function buildPnlHistogram(trades: ClosedTrade[], bucketCount = 12): HistogramBucket[] {
  if (trades.length === 0) return [];
  const pnls = trades.map((t) => t.netPnl);
  const min = Math.min(...pnls);
  const max = Math.max(...pnls);
  if (min === max) return [{ rangeStart: min, rangeEnd: max, count: trades.length }];

  const width = (max - min) / bucketCount;
  const buckets: HistogramBucket[] = Array.from({ length: bucketCount }, (_, i) => ({
    rangeStart: min + i * width,
    rangeEnd: min + (i + 1) * width,
    count: 0,
  }));

  for (const pnl of pnls) {
    const index = Math.min(bucketCount - 1, Math.floor((pnl - min) / width));
    buckets[index].count += 1;
  }
  return buckets;
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

export interface MonthBreakdown {
  month: string; // YYYY-MM
  tradeCount: number;
  netPnl: number;
  winrate: number | null;
}

/** Per-calendar-month PnL/winrate, ordered chronologically. Same
 * MIN_SAMPLE_SIZE noise guard as the weekday breakdown. */
export function calcPnlByMonth(trades: ClosedTrade[]): MonthBreakdown[] {
  const byMonth = new Map<string, ClosedTrade[]>();
  for (const t of trades) {
    const month = t.closeTime.slice(0, 7);
    const list = byMonth.get(month) ?? [];
    list.push(t);
    byMonth.set(month, list);
  }

  return Array.from(byMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, monthTrades]) => ({
      month,
      tradeCount: monthTrades.length,
      netPnl: monthTrades.reduce((sum, t) => sum + t.netPnl, 0),
      winrate: monthTrades.length >= MIN_SAMPLE_SIZE ? calcWinrate(monthTrades) : null,
    }));
}

/** Best/worst N closed trades by netPnl — a quick winners/losers leaderboard. */
export function getTopTrades(
  trades: ClosedTrade[],
  n = 10,
): { winners: ClosedTrade[]; losers: ClosedTrade[] } {
  const sorted = [...trades].sort((a, b) => b.netPnl - a.netPnl);
  return {
    winners: sorted.slice(0, n).filter((t) => t.netPnl > 0),
    losers: sorted
      .slice(-n)
      .reverse()
      .filter((t) => t.netPnl < 0),
  };
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
