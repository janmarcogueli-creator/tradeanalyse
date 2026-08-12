import { getFilteredClosedTrades } from "@/db/queries/trades";
import { listStrategies } from "@/db/queries/strategies";
import { listTags } from "@/db/queries/tags";
import { buildDashboardPayload, toClosedTrade } from "@/lib/metrics/buildDashboardPayload";
import { calcDailyPnl } from "@/lib/metrics/calculate";
import { filterStateFromSearchParams } from "@/lib/filters/parseFilterParams";
import { DashboardFilterBar } from "@/components/dashboard/dashboard-filter-bar";
import { TimeframeSelector } from "@/components/dashboard/timeframe-selector";
import { MetricsOverview } from "@/components/dashboard/metrics-overview";
import { MonthHeroCalendar } from "@/components/charts/MonthHeroCalendar";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const filter = filterStateFromSearchParams(params);
  // The hero calendar always shows full history so month navigation works
  // regardless of which timeframe preset is selected — only symbol/asset
  // class/strategy/tag filters carry over, not the date range.
  const calendarFilter = { ...filter, dateFrom: undefined, dateTo: undefined };

  const [trades, calendarTrades, strategies, tags] = await Promise.all([
    getFilteredClosedTrades(filter),
    getFilteredClosedTrades(calendarFilter),
    listStrategies(),
    listTags(),
  ]);

  const data = buildDashboardPayload(trades);
  const calendarDailyPnl = calcDailyPnl(calendarTrades.map(toClosedTrade));

  return (
    <div className="flex flex-col gap-4">
      <MonthHeroCalendar dailyPnl={calendarDailyPnl} />
      <div className="flex flex-wrap items-center gap-2">
        <TimeframeSelector />
        <DashboardFilterBar strategies={strategies} tags={tags} />
      </div>
      <MetricsOverview data={data} />
    </div>
  );
}
