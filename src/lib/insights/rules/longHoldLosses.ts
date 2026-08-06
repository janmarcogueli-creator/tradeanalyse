import { calcWinrate } from "@/lib/metrics/calculate";
import { formatDuration } from "@/lib/utils/format";
import type { Insight, InsightContext } from "../types";

const MIN_SAMPLE_SIZE = 10;
const LOSS_RATE_GAP_THRESHOLD = 0.15; // 15 percentage points worse

/** Splits trades at the median holding time and flags when the longer-held
 * half loses meaningfully more often than the shorter-held half — "big
 * losses on trades held longer than X" pattern. */
export function longHoldLosses(ctx: InsightContext): Insight[] {
  const withDuration = ctx.trades.filter((t) => t.holdingSeconds !== null);
  if (withDuration.length < MIN_SAMPLE_SIZE) return [];

  const sorted = [...withDuration].sort((a, b) => a.holdingSeconds! - b.holdingSeconds!);
  const medianIndex = Math.floor(sorted.length / 2);
  const medianHoldingSeconds = sorted[medianIndex].holdingSeconds!;

  const shortHeld = sorted.slice(0, medianIndex);
  const longHeld = sorted.slice(medianIndex);

  const shortWinrate = calcWinrate(shortHeld);
  const longWinrate = calcWinrate(longHeld);
  if (shortWinrate === null || longWinrate === null) return [];

  const shortLossRate = 1 - shortWinrate;
  const longLossRate = 1 - longWinrate;

  if (longLossRate - shortLossRate >= LOSS_RATE_GAP_THRESHOLD) {
    return [
      {
        ruleKey: "longHoldLosses",
        severity: "warning",
        title: "Hohe Verluste bei langer Haltedauer",
        description: `Trades über ${formatDuration(medianHoldingSeconds)} Haltedauer verlieren zu ${(longLossRate * 100).toFixed(0)}% (vs. ${(shortLossRate * 100).toFixed(0)}% bei kürzer gehaltenen Trades).`,
        scope: { type: "holdingTime" },
      },
    ];
  }

  return [];
}
