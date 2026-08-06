import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getFilteredClosedTrades } from "@/db/queries/trades";
import { listStrategies } from "@/db/queries/strategies";
import { listTags } from "@/db/queries/tags";
import { buildDashboardPayload } from "@/lib/metrics/buildDashboardPayload";
import { filterStateFromSearchParams } from "@/lib/filters/parseFilterParams";
import { DashboardFilterBar } from "@/components/dashboard/dashboard-filter-bar";
import { MetricsOverview } from "@/components/dashboard/metrics-overview";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const quickFilter = filterStateFromSearchParams(params);
  const currentYearStart = `${new Date().getFullYear()}-01-01`;

  const [allTimeTrades, ytdTrades, strategies, tags] = await Promise.all([
    getFilteredClosedTrades(quickFilter),
    getFilteredClosedTrades({ ...quickFilter, dateFrom: currentYearStart }),
    listStrategies(),
    listTags(),
  ]);

  const allTimeData = buildDashboardPayload(allTimeTrades);
  const ytdData = buildDashboardPayload(ytdTrades);

  return (
    <div className="flex flex-col gap-4">
      <DashboardFilterBar strategies={strategies} tags={tags} />
      <Tabs defaultValue="all-time">
        <TabsList>
          <TabsTrigger value="all-time">All-Time</TabsTrigger>
          <TabsTrigger value="ytd">YTD</TabsTrigger>
        </TabsList>
        <TabsContent value="all-time">
          <MetricsOverview data={allTimeData} />
        </TabsContent>
        <TabsContent value="ytd">
          <MetricsOverview data={ytdData} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
