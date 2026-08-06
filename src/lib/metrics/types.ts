export interface ClosedTrade {
  id: number;
  symbol: string;
  assetCategory: string;
  direction: "long" | "short";
  closeTime: string; // ISO — required, metrics only operate on closed trades
  netPnl: number;
  grossPnl: number;
  commissions: number;
  holdingSeconds: number | null;
}

export interface MetricsResult {
  tradeCount: number;
  winrate: number | null;
  profitFactor: number | null;
  expectancy: number;
  avgWin: number | null;
  avgLoss: number | null;
  rrRatio: number | null;
  netPnl: number;
  grossPnl: number;
  commissions: number;
  largestWin: number | null;
  largestLoss: number | null;
  avgHoldingSeconds: number | null;
  maxConsecutiveWins: number;
  maxConsecutiveLosses: number;
  maxDrawdown: { value: number; percent: number } | null;
  recoveryFactor: number | null;
  sharpeRatio: number | null;
}

export interface EquityPoint {
  date: string; // ISO date (day granularity)
  cumulativeNet: number;
  cumulativeGross: number;
}

export interface DrawdownPoint {
  date: string;
  drawdownValue: number; // <= 0
  drawdownPercent: number; // <= 0
}
