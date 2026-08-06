import type { ClosedTrade, EquityPoint } from "./types";

/**
 * Cumulative net/gross PnL series ordered by close time, one point per trade
 * (not per calendar day) — the chart layer (M4) decides how to bucket/render.
 */
export function buildEquityCurve(trades: ClosedTrade[]): EquityPoint[] {
  const sorted = [...trades].sort((a, b) => Date.parse(a.closeTime) - Date.parse(b.closeTime));

  let cumulativeNet = 0;
  let cumulativeGross = 0;
  return sorted.map((trade) => {
    cumulativeNet += trade.netPnl;
    cumulativeGross += trade.grossPnl;
    return { date: trade.closeTime, cumulativeNet, cumulativeGross };
  });
}
