import { describe, it, expect } from "vitest";
import { weekdayPerformance } from "./weekdayPerformance";
import type { ClosedTrade } from "@/lib/metrics/types";
import type { InsightContext } from "../types";

let nextId = 1;
function trade(netPnl: number, closeTime: string): ClosedTrade {
  return {
    id: nextId++,
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

function ctx(trades: ClosedTrade[]): InsightContext {
  return { trades, byStrategy: [] };
}

describe("weekdayPerformance rule", () => {
  it("flags a weekday whose winrate lags the overall winrate by >= 20 points, given enough samples", () => {
    const trades: ClosedTrade[] = [];
    // 2024-01-01/08/15/22/29 are all Mondays -> 5 losses, 0 wins.
    for (const d of ["2024-01-01", "2024-01-08", "2024-01-15", "2024-01-22", "2024-01-29"]) {
      trades.push(trade(-50, `${d}T10:00:00`));
    }
    // Tuesdays (01-02/09/16/23/30) and Wednesdays (01-03/10/17/24/31): 10 wins, no Mondays involved.
    for (const d of ["2024-01-02", "2024-01-09", "2024-01-16", "2024-01-23", "2024-01-30"]) {
      trades.push(trade(50, `${d}T10:00:00`));
    }
    for (const d of ["2024-01-03", "2024-01-10", "2024-01-17", "2024-01-24", "2024-01-31"]) {
      trades.push(trade(50, `${d}T10:00:00`));
    }

    const result = weekdayPerformance(ctx(trades));
    expect(result).toHaveLength(1);
    expect(result[0].ruleKey).toBe("weekdayPerformance");
    expect(result[0].scope).toEqual({ type: "weekday", value: 1 }); // Monday
  });

  it("does not flag a weekday below the minimum sample size", () => {
    const trades: ClosedTrade[] = [
      trade(-50, "2024-01-01T10:00:00"),
      trade(-50, "2024-01-08T10:00:00"),
      ...Array.from({ length: 10 }, (_, i) => trade(50, `2024-02-0${(i % 9) + 1}T10:00:00`)),
    ];
    expect(weekdayPerformance(ctx(trades))).toEqual([]);
  });

  it("does not flag when all weekdays perform similarly", () => {
    const trades: ClosedTrade[] = [];
    const dates = ["2024-01-01", "2024-01-02", "2024-01-03", "2024-01-04", "2024-01-05"];
    for (const d of dates) {
      for (let i = 0; i < 5; i++) trades.push(trade(i % 2 === 0 ? 50 : -50, `${d}T10:00:00`));
    }
    expect(weekdayPerformance(ctx(trades))).toEqual([]);
  });

  it("returns [] for an empty trade list", () => {
    expect(weekdayPerformance(ctx([]))).toEqual([]);
  });
});
