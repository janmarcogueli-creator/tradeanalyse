import { getFilteredClosedTrades } from "@/db/queries/trades";
import { listStrategies } from "@/db/queries/strategies";
import { listTags } from "@/db/queries/tags";
import { buildDashboardPayload } from "@/lib/metrics/buildDashboardPayload";
import { filterStateFromSearchParams } from "@/lib/filters/parseFilterParams";
import { AnalysisFilterBar } from "@/components/dashboard/analysis-filter-bar";
import { MetricsOverview } from "@/components/dashboard/metrics-overview";
import { MonthBreakdownTable } from "@/components/dashboard/month-breakdown-table";
import { WinnersLosersTable } from "@/components/dashboard/winners-losers-table";

export default async function AnalysisPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const filter = filterStateFromSearchParams(params);

  const [trades, strategies, tags] = await Promise.all([
    getFilteredClosedTrades(filter),
    listStrategies(),
    listTags(),
  ]);

  const data = buildDashboardPayload(trades);

  return (
    <div className="flex flex-col gap-4">
      <AnalysisFilterBar strategies={strategies} tags={tags} />
      <MonthBreakdownTable data={data.monthBreakdown} />
      <WinnersLosersTable winners={data.topWinners} losers={data.topLosers} />
      <MetricsOverview data={data} />
    </div>
  );
}
