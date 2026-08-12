import { describe, it, expect } from "vitest";
import {
  interpretDayOutcomes,
  interpretHoldingTime,
  interpretLongShort,
  interpretRisk,
  interpretTags,
  interpretWeekdayHour,
} from "./interpretations";
import type { ClosedTrade, MetricsResult } from "./types";
import type { GroupMetrics } from "./buildDashboardPayload";

function metrics(overrides: Partial<MetricsResult>): MetricsResult {
  return {
    tradeCount: 0,
    winrate: null,
    profitFactor: null,
    expectancy: 0,
    avgWin: null,
    avgLoss: null,
    rrRatio: null,
    netPnl: 0,
    grossPnl: 0,
    commissions: 0,
    largestWin: null,
    largestLoss: null,
    avgHoldingSeconds: null,
    maxConsecutiveWins: 0,
    maxConsecutiveLosses: 0,
    maxDrawdown: null,
    recoveryFactor: null,
    sharpeRatio: null,
    ...overrides,
  };
}

describe("interpretLongShort", () => {
  it("flags insufficient data when one side has no trades", () => {
    const groups: GroupMetrics[] = [{ key: "long", label: "Long", metrics: metrics({ tradeCount: 5 }) }];
    expect(interpretLongShort(groups)).toMatch(/Nicht genug/);
  });

  it("names the better-performing side", () => {
    const groups: GroupMetrics[] = [
      { key: "long", label: "Long", metrics: metrics({ tradeCount: 10, netPnl: 500, winrate: 0.6 }) },
      { key: "short", label: "Short", metrics: metrics({ tradeCount: 10, netPnl: -100, winrate: 0.3 }) },
    ];
    expect(interpretLongShort(groups)).toMatch(/^Long performt besser/);
  });
});

describe("interpretDayOutcomes", () => {
  it("handles zero days", () => {
    expect(interpretDayOutcomes({ winningDays: 0, losingDays: 0, breakEvenDays: 0 })).toMatch(/Keine Handelstage/);
  });

  it("reports the winning share", () => {
    expect(interpretDayOutcomes({ winningDays: 3, losingDays: 1, breakEvenDays: 0 })).toMatch(/3 von 4/);
  });
});

describe("interpretWeekdayHour", () => {
  it("requires a minimum sample size per cell", () => {
    const data = [{ weekday: 1, hour: 10, netPnl: 100, tradeCount: 1 }];
    expect(interpretWeekdayHour(data)).toMatch(/Noch nicht genug/);
  });

  it("picks the best and worst reliable cell", () => {
    const data = [
      { weekday: 1, hour: 10, netPnl: 300, tradeCount: 5 },
      { weekday: 2, hour: 14, netPnl: -200, tradeCount: 4 },
    ];
    const result = interpretWeekdayHour(data);
    expect(result).toMatch(/Mo 10:00/);
    expect(result).toMatch(/Di 14:00/);
  });
});

describe("interpretHoldingTime", () => {
  it("handles no buckets", () => {
    expect(interpretHoldingTime([])).toMatch(/Keine Trades/);
  });

  it("names the busiest bucket", () => {
    const buckets = [
      { rangeStart: 0, rangeEnd: 3600, count: 2 },
      { rangeStart: 3600, rangeEnd: 7200, count: 8 },
    ];
    expect(interpretHoldingTime(buckets)).toMatch(/\(8\)/);
  });
});

describe("interpretRisk", () => {
  function rTrade(rMultiple: number): ClosedTrade {
    return {
      id: 1,
      symbol: "AAPL",
      assetCategory: "STK",
      direction: "long",
      closeTime: "2024-01-01T10:00:00",
      netPnl: 10,
      grossPnl: 10,
      commissions: 0,
      holdingSeconds: null,
      rMultiple,
    };
  }

  it("handles no risk-tagged trades", () => {
    expect(interpretRisk([])).toMatch(/Noch keine Trades/);
  });

  it("averages the R-multiple across trades", () => {
    expect(interpretRisk([rTrade(1), rTrade(3)])).toMatch(/Ø 2\.00 R/);
  });
});

describe("interpretTags", () => {
  it("handles no tagged trades", () => {
    expect(interpretTags([{ name: "Fehler", metrics: metrics({ tradeCount: 0 }) }])).toMatch(/keinem Trade/);
  });

  it("names best and worst tag when they differ", () => {
    const tags = [
      { name: "Gut", metrics: metrics({ tradeCount: 3, netPnl: 200 }) },
      { name: "Schlecht", metrics: metrics({ tradeCount: 2, netPnl: -80 }) },
    ];
    const result = interpretTags(tags);
    expect(result).toMatch(/"Gut"/);
    expect(result).toMatch(/"Schlecht"/);
  });
});
