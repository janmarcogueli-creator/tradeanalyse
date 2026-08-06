import { describe, it, expect } from "vitest";
import {
  calcAvgHoldingTime,
  calcAvgWinLoss,
  calcExpectancy,
  calcLargestWinLoss,
  calcPnlByWeekdayHour,
  calcProfitFactor,
  calcRRRatio,
  calcRecoveryFactor,
  calcSharpeRatio,
  calcWinrate,
  calculateMetrics,
} from "./calculate";
import type { ClosedTrade } from "./types";

function trade(overrides: Partial<ClosedTrade> & { id: number; netPnl: number }): ClosedTrade {
  return {
    symbol: "AAPL",
    assetCategory: "STK",
    direction: "long",
    closeTime: "2024-01-01T10:00:00",
    grossPnl: overrides.netPnl,
    commissions: 0,
    holdingSeconds: null,
    ...overrides,
  };
}

// Hand-computed reference set:
// wins: +100, +200 (Mon, Wed) | losses: -50, -30 (Tue, Thu)
const trades: ClosedTrade[] = [
  trade({ id: 1, netPnl: 100, closeTime: "2024-01-01T10:00:00" }), // Monday
  trade({ id: 2, netPnl: -50, closeTime: "2024-01-02T10:00:00" }), // Tuesday
  trade({ id: 3, netPnl: 200, closeTime: "2024-01-03T10:00:00" }), // Wednesday
  trade({ id: 4, netPnl: -30, closeTime: "2024-01-04T10:00:00" }), // Thursday
];

describe("calculate.ts against a hand-computed trade set", () => {
  it("calcWinrate: 2 wins / 4 trades = 0.5", () => {
    expect(calcWinrate(trades)).toBe(0.5);
  });

  it("calcProfitFactor: 300 gross profit / 80 gross loss = 3.75", () => {
    expect(calcProfitFactor(trades)).toBeCloseTo(3.75);
  });

  it("calcExpectancy: 220 total / 4 trades = 55", () => {
    expect(calcExpectancy(trades)).toBeCloseTo(55);
  });

  it("calcAvgWinLoss: avgWin=150, avgLoss=-40", () => {
    const { avgWin, avgLoss } = calcAvgWinLoss(trades);
    expect(avgWin).toBeCloseTo(150);
    expect(avgLoss).toBeCloseTo(-40);
  });

  it("calcRRRatio: 150/40 = 3.75", () => {
    expect(calcRRRatio(trades)).toBeCloseTo(3.75);
  });

  it("calcLargestWinLoss: 200 / -50", () => {
    const { largestWin, largestLoss } = calcLargestWinLoss(trades);
    expect(largestWin).toBe(200);
    expect(largestLoss).toBe(-50);
  });

  it("calcAvgHoldingTime: ignores trades without holdingSeconds, null if none set", () => {
    expect(calcAvgHoldingTime(trades)).toBeNull();
    const withDuration = [
      trade({ id: 1, netPnl: 10, holdingSeconds: 60 }),
      trade({ id: 2, netPnl: 10, holdingSeconds: 120 }),
    ];
    expect(calcAvgHoldingTime(withDuration)).toBe(90);
  });

  it("calcPnlByWeekdayHour: buckets by weekday with per-day netPnl", () => {
    const breakdown = calcPnlByWeekdayHour(trades);
    const monday = breakdown.find((b) => b.weekday === 1)!;
    const tuesday = breakdown.find((b) => b.weekday === 2)!;
    expect(monday.tradeCount).toBe(1);
    expect(monday.netPnl).toBe(100);
    expect(tuesday.netPnl).toBe(-50);
    // below MIN_SAMPLE_SIZE (3) per day -> winrate suppressed
    expect(monday.winrate).toBeNull();
  });

  it("calcRecoveryFactor: netPnl 220 / maxDrawdown 50 = 4.4", () => {
    // equity path after each trade: 100, 50, 250, 220 -> peak 100 then 250,
    // worst drawdown is at trade 2: 50 - 100 = -50
    expect(calcRecoveryFactor(trades)).toBeCloseTo(4.4);
  });

  it("calculateMetrics aggregates all of the above consistently", () => {
    const result = calculateMetrics(trades);
    expect(result.tradeCount).toBe(4);
    expect(result.winrate).toBe(0.5);
    expect(result.profitFactor).toBeCloseTo(3.75);
    expect(result.netPnl).toBe(220);
    expect(result.maxDrawdown).not.toBeNull();
    expect(result.maxDrawdown!.value).toBeCloseTo(-50);
    expect(result.maxConsecutiveWins).toBe(1);
    expect(result.maxConsecutiveLosses).toBe(1);
  });
});

describe("calculate.ts edge cases", () => {
  it("returns nulls/zeros for an empty trade list", () => {
    const result = calculateMetrics([]);
    expect(result.tradeCount).toBe(0);
    expect(result.winrate).toBeNull();
    expect(result.profitFactor).toBeNull();
    expect(result.expectancy).toBe(0);
    expect(result.maxDrawdown).toBeNull();
  });

  it("calcProfitFactor is null when there are no losing trades", () => {
    const onlyWins = [trade({ id: 1, netPnl: 100 }), trade({ id: 2, netPnl: 50 })];
    expect(calcProfitFactor(onlyWins)).toBeNull();
  });

  it("calcSharpeRatio is null with fewer than 2 distinct trading days", () => {
    expect(calcSharpeRatio([trade({ id: 1, netPnl: 100 })])).toBeNull();
  });

  it("calcSharpeRatio is null when daily returns have zero variance", () => {
    const flat = [
      trade({ id: 1, netPnl: 10, closeTime: "2024-01-01T10:00:00" }),
      trade({ id: 2, netPnl: 10, closeTime: "2024-01-02T10:00:00" }),
    ];
    expect(calcSharpeRatio(flat)).toBeNull();
  });

  it("calcSharpeRatio is a finite positive number for a profitable, varying series", () => {
    const sharpe = calcSharpeRatio(trades);
    expect(sharpe).not.toBeNull();
    expect(Number.isFinite(sharpe)).toBe(true);
    expect(sharpe!).toBeGreaterThan(0);
  });
});
