import { describe, it, expect } from "vitest";
import { buildEquityCurve } from "./equity";
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

describe("buildEquityCurve", () => {
  it("accumulates net/gross PnL in close-time order regardless of input order", () => {
    const trades = [
      trade(2, -50, "2024-01-02T10:00:00"),
      trade(1, 100, "2024-01-01T10:00:00"),
      trade(3, 200, "2024-01-03T10:00:00"),
    ];
    const curve = buildEquityCurve(trades);

    expect(curve.map((p) => p.cumulativeNet)).toEqual([100, 50, 250]);
    expect(curve[0].date).toBe("2024-01-01T10:00:00");
  });

  it("returns an empty array for no trades", () => {
    expect(buildEquityCurve([])).toEqual([]);
  });
});
