import { describe, it, expect } from "vitest";
import { overtrading } from "./overtrading";
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

describe("overtrading rule", () => {
  it("flags high-volume days with worse average PnL/trade than normal days", () => {
    const trades: ClosedTrade[] = [];
    // 10 normal days: 1 winning trade each.
    for (let d = 1; d <= 10; d++) {
      trades.push(trade(50, `2024-01-${String(d).padStart(2, "0")}T10:00:00`));
    }
    // 3 high-volume days: 5 losing trades each.
    for (let d = 11; d <= 13; d++) {
      for (let i = 0; i < 5; i++) {
        trades.push(trade(-20, `2024-01-${String(d).padStart(2, "0")}T1${i}:00:00`));
      }
    }

    const result = overtrading(ctx(trades));
    expect(result).toHaveLength(1);
    expect(result[0].ruleKey).toBe("overtrading");
    expect(result[0].scope).toEqual({ type: "overtrading" });
  });

  it("does not flag below the minimum number of trading days", () => {
    const trades: ClosedTrade[] = [];
    for (let d = 1; d <= 5; d++) {
      trades.push(trade(50, `2024-01-${String(d).padStart(2, "0")}T10:00:00`));
    }
    expect(overtrading(ctx(trades))).toEqual([]);
  });

  it("does not flag when volume is uniform across days", () => {
    const trades: ClosedTrade[] = [];
    for (let d = 1; d <= 12; d++) {
      trades.push(trade(10, `2024-01-${String(d).padStart(2, "0")}T10:00:00`));
    }
    expect(overtrading(ctx(trades))).toEqual([]);
  });

  it("does not flag when high-volume days perform just as well as normal days", () => {
    const trades: ClosedTrade[] = [];
    for (let d = 1; d <= 10; d++) {
      trades.push(trade(50, `2024-01-${String(d).padStart(2, "0")}T10:00:00`));
    }
    for (let d = 11; d <= 13; d++) {
      for (let i = 0; i < 5; i++) {
        trades.push(trade(50, `2024-01-${String(d).padStart(2, "0")}T1${i}:00:00`)); // still winning
      }
    }
    expect(overtrading(ctx(trades))).toEqual([]);
  });
});
