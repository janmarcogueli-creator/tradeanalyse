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
});
