import type { ClosedTrade } from "./types";

export interface StreakResult {
  maxConsecutiveWins: number;
  maxConsecutiveLosses: number;
  /** Streak currently in progress as of the most recent trade (0 if none / breakeven). */
  currentStreak: number;
  currentStreakType: "win" | "loss" | null;
}

/** Longest win/loss streaks, ordered by close time. Breakeven trades (netPnl === 0) break a streak. */
export function calcConsecutiveStreaks(trades: ClosedTrade[]): StreakResult {
  const sorted = [...trades].sort((a, b) => Date.parse(a.closeTime) - Date.parse(b.closeTime));

  let maxWins = 0;
  let maxLosses = 0;
  let currentWins = 0;
  let currentLosses = 0;

  for (const trade of sorted) {
    if (trade.netPnl > 0) {
      currentWins++;
      currentLosses = 0;
    } else if (trade.netPnl < 0) {
      currentLosses++;
      currentWins = 0;
    } else {
      currentWins = 0;
      currentLosses = 0;
    }
    maxWins = Math.max(maxWins, currentWins);
    maxLosses = Math.max(maxLosses, currentLosses);
  }

  const currentStreakType = currentWins > 0 ? "win" : currentLosses > 0 ? "loss" : null;
  const currentStreak = currentWins > 0 ? currentWins : currentLosses;

  return { maxConsecutiveWins: maxWins, maxConsecutiveLosses: maxLosses, currentStreak, currentStreakType };
}
