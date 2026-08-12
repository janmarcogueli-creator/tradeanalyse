import { describe, it, expect } from "vitest";
import { runInsightRules } from "./runner";
import type { InsightContext } from "./types";

describe("runInsightRules", () => {
  it("returns [] when there is no data to analyze", () => {
    const ctx: InsightContext = { trades: [], byStrategy: [] };
    expect(runInsightRules(ctx)).toEqual([]);
  });

  it("aggregates findings across all registered rules", () => {
    const ctx: InsightContext = {
      trades: [
        {
          id: 1,
          symbol: "AAPL",
          assetCategory: "STK",
          direction: "long",
          closeTime: "2024-01-01T10:00:00", // Monday
          netPnl: -50,
          grossPnl: -50,
          commissions: 0,
          holdingSeconds: null,
    rMultiple: null,
        },
      ],
      byStrategy: [],
    };
    // A single trade can't trigger any rule (all have minimum sample sizes) —
    // this just proves the registry runs every rule without throwing.
    expect(runInsightRules(ctx)).toEqual([]);
  });
});
