import type { GroupMetrics } from "@/lib/metrics/buildDashboardPayload";
import { GroupPerformanceChart } from "./GroupPerformanceChart";

/** Top/Flop: best N and worst N symbols by netPnl. `groups` must already be
 * sorted descending by netPnl (buildDashboardPayload guarantees this). */
export function SymbolPerformanceChart({ groups, topN = 5 }: { groups: GroupMetrics[]; topN?: number }) {
  const top = groups.slice(0, topN);
  const flop = groups.slice(-topN).filter((g) => !top.includes(g));
  const topFlop = [...top, ...flop];

  return <GroupPerformanceChart data={topFlop.map((g) => ({ label: g.label, netPnl: g.metrics.netPnl }))} />;
}
