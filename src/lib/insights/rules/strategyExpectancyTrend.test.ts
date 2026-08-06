import { describe, it, expect } from "vitest";
import { strategyExpectancyTrend } from "./strategyExpectancyTrend";
import type { ClosedTrade } from "@/lib/metrics/types";
import type { InsightContext, StrategyTrades } from "../types";

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

function ctx(byStrategy: StrategyTrades[]): InsightContext {
  return { trades: byStrategy.flatMap((s) => s.trades), byStrategy };
}

describe("strategyExpectancyTrend rule", () => {
  it("flags a strategy with 3+ consecutive active months of negative expectancy", () => {
    const strategy: StrategyTrades = {
      strategyId: 1,
      strategyName: "Bad Strategy",
      trades: [
        trade(-10, "2024-01-05T10:00:00"),
        trade(-20, "2024-02-05T10:00:00"),
        trade(-30, "2024-03-05T10:00:00"),
      ],
    };

    const result = strategyExpectancyTrend(ctx([strategy]));
    expect(result).toHaveLength(1);
    expect(result[0].ruleKey).toBe("strategyExpectancyTrend");
    expect(result[0].scope).toEqual({ type: "strategy", id: 1 });
  });

  it("does not flag when a positive month breaks the streak", () => {
    const strategy: StrategyTrades = {
      strategyId: 1,
      strategyName: "Recovering Strategy",
      trades: [
        trade(-10, "2024-01-05T10:00:00"),
        trade(-20, "2024-02-05T10:00:00"),
        trade(30, "2024-03-05T10:00:00"), // breaks the streak
        trade(-30, "2024-04-05T10:00:00"),
      ],
    };
    expect(strategyExpectancyTrend(ctx([strategy]))).toEqual([]);
  });

  it("does not flag only 2 consecutive negative months", () => {
    const strategy: StrategyTrades = {
      strategyId: 1,
      strategyName: "Mostly Fine",
      trades: [trade(-10, "2024-01-05T10:00:00"), trade(-20, "2024-02-05T10:00:00")],
    };
    expect(strategyExpectancyTrend(ctx([strategy]))).toEqual([]);
  });

  it("returns [] when there are no strategies", () => {
    expect(strategyExpectancyTrend(ctx([]))).toEqual([]);
  });
});
