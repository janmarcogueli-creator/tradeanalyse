import { describe, it, expect } from "vitest";
import { longHoldLosses } from "./longHoldLosses";
import type { ClosedTrade } from "@/lib/metrics/types";
import type { InsightContext } from "../types";

let nextId = 1;
function trade(netPnl: number, holdingSeconds: number | null): ClosedTrade {
  return {
    id: nextId++,
    symbol: "AAPL",
    assetCategory: "STK",
    direction: "long",
    closeTime: "2024-01-01T10:00:00",
    netPnl,
    grossPnl: netPnl,
    commissions: 0,
    holdingSeconds,
    rMultiple: null,
  };
}

function ctx(trades: ClosedTrade[]): InsightContext {
  return { trades, byStrategy: [] };
}

describe("longHoldLosses rule", () => {
  it("flags when the longer-held half loses much more often than the shorter-held half", () => {
    const trades: ClosedTrade[] = [
      ...Array.from({ length: 5 }, (_, i) => trade(50, 100 + i * 10)), // short, all wins
      ...Array.from({ length: 5 }, (_, i) => trade(-50, 5000 + i * 10)), // long, all losses
    ];
    const result = longHoldLosses(ctx(trades));
    expect(result).toHaveLength(1);
    expect(result[0].ruleKey).toBe("longHoldLosses");
    expect(result[0].scope).toEqual({ type: "holdingTime" });
  });

  it("does not flag below the minimum sample size", () => {
    const trades: ClosedTrade[] = [
      ...Array.from({ length: 2 }, (_, i) => trade(50, 100 + i)),
      ...Array.from({ length: 2 }, (_, i) => trade(-50, 5000 + i)),
    ];
    expect(longHoldLosses(ctx(trades))).toEqual([]);
  });

  it("does not flag when loss rate is similar across durations", () => {
    // Both halves (by holding time, ascending) get the same 3-win/2-loss mix,
    // so the median split sees an identical loss rate on both sides.
    const pnlPattern = [50, -50, 50, -50, 50];
    const trades: ClosedTrade[] = [
      ...pnlPattern.map((pnl, i) => trade(pnl, 100 + i * 500)),
      ...pnlPattern.map((pnl, i) => trade(pnl, 3000 + i * 500)),
    ];
    expect(longHoldLosses(ctx(trades))).toEqual([]);
  });

  it("ignores trades with no recorded holding time", () => {
    const trades: ClosedTrade[] = Array.from({ length: 10 }, () => trade(-50, null));
    expect(longHoldLosses(ctx(trades))).toEqual([]);
  });
});
