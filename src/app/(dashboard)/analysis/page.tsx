import { getFilteredClosedTrades } from "@/db/queries/trades";
import { listStrategies, getStrategiesPerformance } from "@/db/queries/strategies";
import { listTags, getTagsPerformance } from "@/db/queries/tags";
import { getActiveInsights } from "@/db/queries/insights";
import { buildDashboardPayload, toClosedTrade } from "@/lib/metrics/buildDashboardPayload";
import {
  calcDayOutcomes,
  calcGrowthPercent,
  calcHoldingTimeDistribution,
  calcPnlByMonth,
  calcPnlByWeekdayAndHour,
  calcRMultipleDistribution,
} from "@/lib/metrics/calculate";
import {
  interpretDayOutcomes,
  interpretHoldingTime,
  interpretLongShort,
  interpretRisk,
  interpretTags,
  interpretWeekdayHour,
} from "@/lib/metrics/interpretations";
import { filterStateFromSearchParams } from "@/lib/filters/parseFilterParams";
import { AnalysisFilterBar } from "@/components/dashboard/analysis-filter-bar";
import { TimeframeSelector } from "@/components/dashboard/timeframe-selector";
import { StatCard } from "@/components/dashboard/stat-card";
import { GroupTable } from "@/components/dashboard/group-table";
import { AnalysisSection } from "@/components/analysis/analysis-section";
import { GroupPerformanceChart } from "@/components/charts/GroupPerformanceChart";
import { DrawdownChart } from "@/components/charts/DrawdownChart";
import { WinLossHistogram } from "@/components/charts/WinLossHistogram";
import { HoldingTimeHistogram } from "@/components/charts/HoldingTimeHistogram";
import { WeekdayHourHeatmap } from "@/components/charts/WeekdayHourHeatmap";
import { CountBarChart } from "@/components/charts/CountBarChart";
import { InsightCard } from "@/components/insights/insight-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";
import { formatMoney, formatPercent, formatRatio } from "@/lib/utils/format";

const SEVERITY_ORDER = { critical: 0, warning: 1, info: 2 };

export default async function AnalysisPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const filter = filterStateFromSearchParams(params);
  // No date bound, same non-date filters — needed to compute the equity
  // baseline "before this period" for the Wachstum KPI below.
  const unboundedFilter = { ...filter, dateFrom: undefined, dateTo: undefined };

  const [trades, allTrades, strategies, tags, strategyPerf, tagPerf, insights] = await Promise.all([
    getFilteredClosedTrades(filter),
    getFilteredClosedTrades(unboundedFilter),
    listStrategies(),
    listTags(),
    getStrategiesPerformance(),
    getTagsPerformance(),
    getActiveInsights(),
  ]);

  const data = buildDashboardPayload(trades);
  const closed = trades.map(toClosedTrade);
  const closedAll = allTrades.map(toClosedTrade);
  const baselineTrades = filter.dateFrom ? closedAll.filter((t) => t.closeTime < filter.dateFrom!) : [];

  const growthPercent = calcGrowthPercent(closed, baselineTrades);
  const dayOutcomes = calcDayOutcomes(data.dailyPnl);
  const weekdayHour = calcPnlByWeekdayAndHour(closed);
  const holdingDist = calcHoldingTimeDistribution(closed);
  const rTrades = closed.filter((t) => t.rMultiple !== null);
  const rDist = calcRMultipleDistribution(closed);

  const bestStrategy = data.byStrategy[0] ?? null;
  const months = calcPnlByMonth(closed);
  const bestMonth = months.length > 0 ? months.reduce((a, b) => (b.netPnl > a.netPnl ? b : a)) : null;

  const topStrategies = [...strategyPerf].sort((a, b) => b.metrics.netPnl - a.metrics.netPnl);
  const strategyHighlights = [...topStrategies.slice(0, 3), ...topStrategies.slice(-3).reverse()].filter(
    (s, i, arr) => arr.findIndex((x) => x.id === s.id) === i,
  );

  const topInsights = [...insights].sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]).slice(0, 3);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <TimeframeSelector />
        <AnalysisFilterBar strategies={strategies} tags={tags} />
      </div>

      <div className="grid grid-cols-3 gap-3 max-w-xl">
        <StatCard label="Netto-PnL" value={formatMoney(data.metrics.netPnl)} tone={data.metrics.netPnl >= 0 ? "positive" : "negative"} />
        <StatCard label="Winrate" value={formatPercent(data.metrics.winrate)} />
        <StatCard
          label="Wachstum"
          value={growthPercent === null ? "–" : formatPercent(growthPercent)}
          tone={growthPercent === null ? "neutral" : growthPercent >= 0 ? "positive" : "negative"}
        />
      </div>

      <AnalysisSection
        title="Long vs. Short"
        chart={<GroupPerformanceChart data={data.byDirection.map((g) => ({ label: g.label, netPnl: g.metrics.netPnl }))} />}
        table={<GroupTable title="Richtung" groups={data.byDirection} emptyLabel="Keine Trades im Zeitraum." />}
        interpretation={interpretLongShort(data.byDirection)}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Beste Strategie</CardTitle>
          </CardHeader>
          <CardContent>
            {bestStrategy ? (
              <div className="flex flex-col gap-1">
                <p className="text-lg font-semibold">{bestStrategy.label}</p>
                <p className="text-sm text-muted-foreground">
                  {formatMoney(bestStrategy.metrics.netPnl)} · {formatPercent(bestStrategy.metrics.winrate)} Winrate ·{" "}
                  {bestStrategy.metrics.tradeCount} Trades
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Keiner Strategie zugeordnete Trades im Zeitraum.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bester Monat</CardTitle>
          </CardHeader>
          <CardContent>
            {bestMonth ? (
              <div className="flex flex-col gap-1">
                <p className="text-lg font-semibold">{bestMonth.month}</p>
                <p className="text-sm text-muted-foreground">
                  {formatMoney(bestMonth.netPnl)} · {formatPercent(bestMonth.winrate)} Winrate · {bestMonth.tradeCount} Trades
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Keine Trades im Zeitraum.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <AnalysisSection
        title="Winning vs. Losing Days"
        chart={
          <CountBarChart
            data={[
              { label: "Gewinntage", count: dayOutcomes.winningDays },
              { label: "Verlusttage", count: dayOutcomes.losingDays },
              { label: "Ausgeglichen", count: dayOutcomes.breakEvenDays },
            ]}
          />
        }
        interpretation={interpretDayOutcomes(dayOutcomes)}
      />

      <AnalysisSection
        title="Drawdown"
        chart={<DrawdownChart data={data.drawdownCurve} />}
        table={
          <div className="grid grid-cols-2 gap-3 max-w-sm">
            <StatCard
              label="Max Drawdown"
              value={data.metrics.maxDrawdown ? `${formatMoney(data.metrics.maxDrawdown.value)} (${data.metrics.maxDrawdown.percent.toFixed(1)}%)` : "–"}
              tone="negative"
            />
            <StatCard label="Recovery Factor" value={formatRatio(data.metrics.recoveryFactor)} />
          </div>
        }
        interpretation={
          data.metrics.maxDrawdown
            ? `Der größte Rückgang vom Höchststand betrug ${formatMoney(data.metrics.maxDrawdown.value)} (${data.metrics.maxDrawdown.percent.toFixed(1)}%).`
            : "Kein Drawdown im Zeitraum."
        }
      />

      <AnalysisSection
        title="Tag &amp; Uhrzeit"
        chart={<WeekdayHourHeatmap data={weekdayHour} />}
        interpretation={interpretWeekdayHour(weekdayHour)}
      />

      <AnalysisSection
        title="Haltedauer-Verteilung"
        chart={<HoldingTimeHistogram data={holdingDist} />}
        interpretation={interpretHoldingTime(holdingDist)}
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Strategien (Top/Flop)</CardTitle>
          <Link href="/strategies" className="text-sm text-primary hover:underline">
            Alle Strategien ansehen
          </Link>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <GroupPerformanceChart data={strategyHighlights.map((s) => ({ label: s.name, netPnl: s.metrics.netPnl }))} />
          <p className="text-sm text-muted-foreground">
            {topStrategies.length > 0
              ? `${topStrategies.length} Strategien insgesamt, sortiert nach Netto-PnL.`
              : "Noch keine Strategien angelegt."}
          </p>
        </CardContent>
      </Card>

      <AnalysisSection
        title="Risiko"
        chart={<WinLossHistogram data={rDist} />}
        interpretation={interpretRisk(rTrades)}
      />

      <AnalysisSection
        title="Tags-Performance"
        chart={<GroupPerformanceChart data={tagPerf.filter((t) => t.metrics.tradeCount > 0).map((t) => ({ label: t.name, netPnl: t.metrics.netPnl }))} />}
        table={
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tag</TableHead>
                <TableHead className="text-right">Trades</TableHead>
                <TableHead className="text-right">Winrate</TableHead>
                <TableHead className="text-right">Netto-PnL</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tagPerf
                .filter((t) => t.metrics.tradeCount > 0)
                .map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell className="text-right">{t.metrics.tradeCount}</TableCell>
                    <TableCell className="text-right">{formatPercent(t.metrics.winrate)}</TableCell>
                    <TableCell className={`text-right font-medium ${t.metrics.netPnl >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                      {formatMoney(t.metrics.netPnl)}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        }
        interpretation={interpretTags(tagPerf)}
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Insights</CardTitle>
          <Link href="/insights" className="text-sm text-primary hover:underline">
            Alle Insights ansehen
          </Link>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {topInsights.length === 0 ? (
            <p className="text-sm text-muted-foreground">Keine Auffälligkeiten gefunden.</p>
          ) : (
            topInsights.map((insight) => <InsightCard key={insight.id} insight={insight} />)
          )}
        </CardContent>
      </Card>
    </div>
  );
}
