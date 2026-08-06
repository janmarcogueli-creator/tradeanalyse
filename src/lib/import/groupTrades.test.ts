import { describe, it, expect } from "vitest";
import { groupFills, resolvePrimaryTradeIndexForFill, type FillForGrouping } from "./groupTrades";

function fill(overrides: Partial<FillForGrouping> & { id: number }): FillForGrouping {
  return {
    buySell: "BUY",
    quantity: 100,
    price: 150,
    multiplier: 1,
    commission: 1,
    datetime: "2024-01-02T09:00:00",
    assetCategory: "STK",
    ...overrides,
  };
}

describe("groupFills", () => {
  it("groups a simple round trip into one closed trade", () => {
    const fills = [
      fill({ id: 1, buySell: "BUY", quantity: 100, price: 150, datetime: "2024-01-02T09:35:00" }),
      fill({ id: 2, buySell: "SELL", quantity: 100, price: 152.5, datetime: "2024-01-02T10:15:00" }),
    ];
    const [trade] = groupFills(fills);

    expect(trade.status).toBe("closed");
    expect(trade.direction).toBe("long");
    expect(trade.quantity).toBe(100);
    expect(trade.avgEntryPrice).toBe(150);
    expect(trade.avgExitPrice).toBe(152.5);
    expect(trade.grossPnl).toBeCloseTo(250);
    expect(trade.commissions).toBeCloseTo(2);
    expect(trade.netPnl).toBeCloseTo(248);
    expect(trade.fillIds).toEqual([1, 2]);
  });

  it("keeps scale-in fills in the same trade and computes a weighted average entry", () => {
    const fills = [
      fill({ id: 1, buySell: "BUY", quantity: 50, price: 151, datetime: "2024-01-02T11:00:00" }),
      fill({ id: 2, buySell: "BUY", quantity: 50, price: 151.5, datetime: "2024-01-02T11:05:00" }),
      fill({ id: 3, buySell: "SELL", quantity: 100, price: 153, datetime: "2024-01-02T11:30:00" }),
    ];
    const [trade] = groupFills(fills);

    expect(trade.status).toBe("closed");
    expect(trade.quantity).toBe(100);
    expect(trade.avgEntryPrice).toBeCloseTo(151.25);
    expect(trade.grossPnl).toBeCloseTo((153 - 151.25) * 100);
    expect(trade.fillIds).toEqual([1, 2, 3]);
  });

  it("keeps scale-out (partial close) fills in the same trade until fully flat", () => {
    const fills = [
      fill({ id: 1, buySell: "BUY", quantity: 100, price: 100, datetime: "2024-01-02T09:00:00" }),
      fill({ id: 2, buySell: "SELL", quantity: 40, price: 110, datetime: "2024-01-02T09:10:00" }),
      fill({ id: 3, buySell: "SELL", quantity: 60, price: 115, datetime: "2024-01-02T09:20:00" }),
    ];
    const [trade] = groupFills(fills);

    expect(trade.status).toBe("closed");
    expect(trade.avgExitPrice).toBeCloseTo((40 * 110 + 60 * 115) / 100);
    expect(trade.fillIds).toEqual([1, 2, 3]);
  });

  it("splits a reversal execution into a close and a new open", () => {
    const fills = [
      fill({ id: 1, buySell: "BUY", quantity: 100, price: 100, datetime: "2024-01-02T09:00:00" }),
      // Single execution: closes the 100 long and opens a 50 short.
      fill({ id: 2, buySell: "SELL", quantity: 150, price: 105, datetime: "2024-01-02T09:30:00" }),
    ];
    const [closed, opened] = groupFills(fills);

    expect(closed.status).toBe("closed");
    expect(closed.direction).toBe("long");
    expect(closed.quantity).toBe(100);
    expect(closed.avgExitPrice).toBe(105);
    expect(closed.fillIds).toEqual([1, 2]);

    expect(opened.status).toBe("open");
    expect(opened.direction).toBe("short");
    expect(opened.quantity).toBe(50);
    expect(opened.avgEntryPrice).toBe(105);
    expect(opened.fillIds).toEqual([2]);
  });

  it("leaves a position with no closing fill as open", () => {
    const fills = [fill({ id: 1, buySell: "BUY", quantity: 100, price: 150 })];
    const [trade] = groupFills(fills);

    expect(trade.status).toBe("open");
    expect(trade.closeTime).toBeNull();
    expect(trade.avgExitPrice).toBeNull();
    expect(trade.netPnl).toBeNull();
  });

  it("is deterministic and idempotent when re-run on the same fills", () => {
    const fills = [
      fill({ id: 1, buySell: "BUY", quantity: 100, price: 150, datetime: "2024-01-02T09:35:00" }),
      fill({ id: 2, buySell: "SELL", quantity: 100, price: 152.5, datetime: "2024-01-02T10:15:00" }),
    ];
    expect(groupFills(fills)).toEqual(groupFills(fills));
  });
});

describe("resolvePrimaryTradeIndexForFill", () => {
  it("assigns the later group to a reversal fill shared by two trades", () => {
    const fills = [
      fill({ id: 1, buySell: "BUY", quantity: 100, price: 100, datetime: "2024-01-02T09:00:00" }),
      fill({ id: 2, buySell: "SELL", quantity: 150, price: 105, datetime: "2024-01-02T09:30:00" }),
    ];
    const groups = groupFills(fills);
    const primary = resolvePrimaryTradeIndexForFill(groups);

    expect(primary.get(1)).toBe(0); // only in the closed trade
    expect(primary.get(2)).toBe(1); // reversal fill -> the newly opened trade wins
  });
});
