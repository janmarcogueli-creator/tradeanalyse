import { describe, it, expect } from "vitest";
import { mapFlexTrade, MappingError } from "./mapFlexFields";
import type { FlexTradeXml } from "./types";

function baseTrade(overrides: Partial<FlexTradeXml> = {}): FlexTradeXml {
  return {
    accountId: "U1234567",
    currency: "USD",
    assetCategory: "STK",
    symbol: "AAPL",
    ibExecID: "exec-1",
    tradeID: "trade-1",
    ibOrderID: "order-1",
    buySell: "BUY",
    openCloseIndicator: "O",
    quantity: "100",
    tradePrice: "150.00",
    proceeds: "-15000.00",
    ibCommission: "-1.00",
    ibCommissionCurrency: "USD",
    netCash: "-15001.00",
    tradeDate: "20240102",
    tradeTime: "093500",
    ...overrides,
  };
}

describe("mapFlexTrade", () => {
  it("maps a plain stock trade", () => {
    const fill = mapFlexTrade(baseTrade());
    expect(fill.assetCategory).toBe("STK");
    expect(fill.buySell).toBe("BUY");
    expect(fill.quantity).toBe(100);
    expect(fill.price).toBe(150);
    expect(fill.commission).toBe(1); // sign normalized to positive cost
    expect(fill.tradeDate).toBe("2024-01-02");
    expect(fill.datetime).toBe("2024-01-02T09:35:00");
    expect(fill.multiplier).toBe(1);
  });

  // The Activity Statement report signs quantity by direction (negative for
  // sells) instead of leaving it an unsigned magnitude like Trade
  // Confirmation does — observed directly from a real account. groupTrades
  // relies on quantity always being a positive magnitude (direction comes
  // from buySell alone), so a signed sell quantity must be normalized here.
  it("normalizes a signed sell quantity to a positive magnitude", () => {
    const fill = mapFlexTrade(baseTrade({ buySell: "SELL", quantity: "-40" }));
    expect(fill.quantity).toBe(40);
    expect(fill.buySell).toBe("SELL");
  });

  it("detects ETF via STK + subCategory=ETF", () => {
    const fill = mapFlexTrade(baseTrade({ symbol: "SPY", subCategory: "ETF" }));
    expect(fill.assetCategory).toBe("ETF");
  });

  it("maps futures with multiplier, underlying and expiry", () => {
    const fill = mapFlexTrade(
      baseTrade({
        assetCategory: "FUT",
        symbol: "ESH4",
        underlyingSymbol: "ES",
        multiplier: "50",
        expiry: "20240315",
      }),
    );
    expect(fill.assetCategory).toBe("FUT");
    expect(fill.multiplier).toBe(50);
    expect(fill.underlyingSymbol).toBe("ES");
    expect(fill.expiry).toBe("2024-03-15");
  });

  it("maps options with strike/putCall/multiplier", () => {
    const fill = mapFlexTrade(
      baseTrade({
        assetCategory: "OPT",
        symbol: "AAPL  240119C00150000",
        multiplier: "100",
        strike: "150",
        putCall: "C",
        expiry: "20240119",
      }),
    );
    expect(fill.multiplier).toBe(100);
    expect(fill.strike).toBe(150);
    expect(fill.putCall).toBe("C");
  });

  it("normalizes cancellation buySell values to their base direction", () => {
    const fill = mapFlexTrade(baseTrade({ buySell: "BUY (Ca.)" }));
    expect(fill.buySell).toBe("BUY");
  });

  it("throws MappingError when ibExecID is missing", () => {
    expect(() => mapFlexTrade(baseTrade({ ibExecID: undefined }))).toThrow(MappingError);
  });

  it("throws MappingError for an unsupported asset category", () => {
    expect(() => mapFlexTrade(baseTrade({ assetCategory: "CRYPTO" }))).toThrow(MappingError);
  });

  it("throws MappingError for invalid numeric fields", () => {
    expect(() => mapFlexTrade(baseTrade({ quantity: "not-a-number" }))).toThrow(MappingError);
  });

  // IBKR's Activity Statement report uses dashed dates ("YYYY-MM-DD") and a
  // space-separated combined datetime ("YYYY-MM-DD HH:MM:SS"), unlike the
  // Trade Confirmation report's compact "YYYYMMDD" / "YYYYMMDD;HHMMSS" —
  // observed directly from a real account, not documented anywhere obvious.
  it("handles the Activity Statement's dashed date + space-separated datetime", () => {
    const fill = mapFlexTrade(
      baseTrade({
        tradeDate: "2026-07-14",
        tradeTime: undefined,
        dateTime: "2026-07-14 10:15:22",
      }),
    );
    expect(fill.tradeDate).toBe("2026-07-14");
    expect(fill.datetime).toBe("2026-07-14T10:15:22");
  });

  it("still handles the Trade Confirmation report's compact date + semicolon datetime", () => {
    const fill = mapFlexTrade(
      baseTrade({
        tradeDate: "20240102",
        tradeTime: undefined,
        dateTime: "20240102;093500",
      }),
    );
    expect(fill.tradeDate).toBe("2024-01-02");
    expect(fill.datetime).toBe("2024-01-02T09:35:00");
  });

  it("throws MappingError for an unrecognized date format", () => {
    expect(() => mapFlexTrade(baseTrade({ tradeDate: "07/14/2026" }))).toThrow(MappingError);
  });
});
