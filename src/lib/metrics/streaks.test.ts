import { describe, it, expect } from "vitest";
import { calcConsecutiveStreaks } from "./streaks";
import type { ClosedTrade } from "./types";

function trade(id: number, netPnl: number, closeTime: string): ClosedTrade {
  return {
    id,
    symbol: "AAPL",
    assetCategory: "STK",
    direction: "long",
    closeTime,
    netPnl,
    grossPnl: netPnl,
    commissions: 0,
    holdingSeconds: null,
  };
}

describe("calcConsecutiveStreaks", () => {
  it("finds the longest win and loss streaks in chronological order", () => {
    // W W L L L W -> max wins=2, max losses=3, current streak = 1 win
    const trades = [
      trade(1, 10, "2024-01-01"),
      trade(2, 10, "2024-01-02"),
      trade(3, -10, "2024-01-03"),
      trade(4, -10, "2024-01-04"),
      trade(5, -10, "2024-01-05"),
      trade(6, 10, "2024-01-06"),
    ];
    const result = calcConsecutiveStreaks(trades);
    expect(result.maxConsecutiveWins).toBe(2);
    expect(result.maxConsecutiveLosses).toBe(3);
    expect(result.currentStreak).toBe(1);
    expect(result.currentStreakType).toBe("win");
  });

  it("breakeven trades (netPnl === 0) reset the streak", () => {
    const trades = [
      trade(1, 10, "2024-01-01"),
      trade(2, 10, "2024-01-02"),
      trade(3, 0, "2024-01-03"),
      trade(4, 10, "2024-01-04"),
    ];
    const result = calcConsecutiveStreaks(trades);
    expect(result.maxConsecutiveWins).toBe(2);
    expect(result.currentStreak).toBe(1);
  });

  it("returns zeros/null for no trades", () => {
    const result = calcConsecutiveStreaks([]);
    expect(result.maxConsecutiveWins).toBe(0);
    expect(result.maxConsecutiveLosses).toBe(0);
    expect(result.currentStreakType).toBeNull();
  });

  it("is order-independent (sorts by closeTime internally)", () => {
    const chronological = [
      trade(1, 10, "2024-01-01"),
      trade(2, 10, "2024-01-02"),
      trade(3, -10, "2024-01-03"),
    ];
    const shuffled = [chronological[2], chronological[0], chronological[1]];
    expect(calcConsecutiveStreaks(shuffled)).toEqual(calcConsecutiveStreaks(chronological));
  });
});
