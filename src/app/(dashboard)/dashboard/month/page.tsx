import { getFilteredClosedTrades } from "@/db/queries/trades";
import { listStrategies } from "@/db/queries/strategies";
import { listTags } from "@/db/queries/tags";
import { buildDashboardPayload } from "@/lib/metrics/buildDashboardPayload";
import { filterStateFromSearchParams } from "@/lib/filters/parseFilterParams";
import { getCurrentMonthRange } from "@/lib/utils/date";
import { DashboardFilterBar } from "@/components/dashboard/dashboard-filter-bar";
import { MetricsOverview } from "@/components/dashboard/metrics-overview";

export default async function MonthDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const quickFilter = filterStateFromSearchParams(params);
  const { from, to } = getCurrentMonthRange();

  const [trades, strategies, tags] = await Promise.all([
    getFilteredClosedTrades({ ...quickFilter, dateFrom: from, dateTo: to }),
    listStrategies(),
    listTags(),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Aktueller Monat: {from} – {to}
      </p>
      <DashboardFilterBar strategies={strategies} tags={tags} />
      <MetricsOverview data={buildDashboardPayload(trades)} />
    </div>
  );
}
