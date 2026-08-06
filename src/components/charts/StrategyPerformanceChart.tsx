import type { GroupMetrics } from "@/lib/metrics/buildDashboardPayload";
import { GroupPerformanceChart } from "./GroupPerformanceChart";

export function StrategyPerformanceChart({ groups }: { groups: GroupMetrics[] }) {
  return <GroupPerformanceChart data={groups.map((g) => ({ label: g.label, netPnl: g.metrics.netPnl }))} />;
}
