import type { DrawdownPoint, EquityPoint } from "./types";

/** Running-peak-based drawdown series from an equity curve (net PnL basis). */
export function buildDrawdownCurve(equity: EquityPoint[]): DrawdownPoint[] {
  let peak = 0;
  return equity.map((point) => {
    peak = Math.max(peak, point.cumulativeNet);
    const drawdownValue = point.cumulativeNet - peak;
    const drawdownPercent = peak > 0 ? (drawdownValue / peak) * 100 : 0;
    return { date: point.date, drawdownValue, drawdownPercent };
  });
}

/** Largest peak-to-trough drop in the equity curve (both as a negative $ value and %). */
export function getMaxDrawdown(equity: EquityPoint[]): { value: number; percent: number } | null {
  if (equity.length === 0) return null;
  const drawdowns = buildDrawdownCurve(equity);
  const worst = drawdowns.reduce((min, d) => (d.drawdownValue < min.drawdownValue ? d : min), drawdowns[0]);
  return { value: worst.drawdownValue, percent: worst.drawdownPercent };
}
