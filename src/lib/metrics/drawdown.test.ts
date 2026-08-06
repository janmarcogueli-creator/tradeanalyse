import { describe, it, expect } from "vitest";
import { buildDrawdownCurve, getMaxDrawdown } from "./drawdown";
import type { EquityPoint } from "./types";

function point(date: string, cumulativeNet: number): EquityPoint {
  return { date, cumulativeNet, cumulativeGross: cumulativeNet };
}

describe("buildDrawdownCurve / getMaxDrawdown", () => {
  // equity path: 100 -> 50 -> 250 -> 220 (peak 100 then 250)
  const equity = [point("d1", 100), point("d2", 50), point("d3", 250), point("d4", 220)];

  it("computes drawdown relative to the running peak", () => {
    const dd = buildDrawdownCurve(equity);
    expect(dd.map((d) => d.drawdownValue)).toEqual([0, -50, 0, -30]);
    expect(dd[1].drawdownPercent).toBeCloseTo(-50); // -50/100 * 100
  });

  it("getMaxDrawdown returns the worst point", () => {
    const worst = getMaxDrawdown(equity);
    expect(worst).not.toBeNull();
    expect(worst!.value).toBeCloseTo(-50);
    expect(worst!.percent).toBeCloseTo(-50);
  });

  it("returns null for an empty equity curve", () => {
    expect(getMaxDrawdown([])).toBeNull();
  });

  it("returns zero drawdown for a strictly increasing equity curve", () => {
    const rising = [point("d1", 10), point("d2", 20), point("d3", 30)];
    const worst = getMaxDrawdown(rising);
    expect(worst!.value).toBe(0);
  });
});
