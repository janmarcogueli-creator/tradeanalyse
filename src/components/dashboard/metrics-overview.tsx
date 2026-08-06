import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatCard } from "./stat-card";
import type { DashboardPayload, GroupMetrics } from "@/lib/metrics/buildDashboardPayload";
import { formatDuration, formatMoney, formatPercent, formatRatio, weekdayLabel } from "@/lib/utils/format";
import { EquityCurveChart } from "@/components/charts/EquityCurveChart";
import { DrawdownChart } from "@/components/charts/DrawdownChart";
import { PnlCalendarHeatmap } from "@/components/charts/PnlCalendarHeatmap";
import { WinLossHistogram } from "@/components/charts/WinLossHistogram";
import { StrategyPerformanceChart } from "@/components/charts/StrategyPerformanceChart";
import { AssetClassPerformanceChart } from "@/components/charts/AssetClassPerformanceChart";
import { SymbolPerformanceChart } from "@/components/charts/SymbolPerformanceChart";
import { DurationVsPnlScatter } from "@/components/charts/DurationVsPnlScatter";

function GroupTable({
  title,
  groups,
  emptyLabel,
  chart,
}: {
  title: string;
  groups: GroupMetrics[];
  emptyLabel: string;
  chart?: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {groups.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyLabel}</p>
        ) : (
          <>
            {chart}
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{title}</TableHead>
                <TableHead className="text-right">Trades</TableHead>
                <TableHead className="text-right">Winrate</TableHead>
                <TableHead className="text-right">Profit Factor</TableHead>
                <TableHead className="text-right">Netto-PnL</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.map((g) => (
                <TableRow key={g.key}>
                  <TableCell className="font-medium">{g.label}</TableCell>
                  <TableCell className="text-right">{g.metrics.tradeCount}</TableCell>
                  <TableCell className="text-right">{formatPercent(g.metrics.winrate)}</TableCell>
                  <TableCell className="text-right">{formatRatio(g.metrics.profitFactor)}</TableCell>
                  <TableCell
                    className={`text-right font-medium ${g.metrics.netPnl >= 0 ? "text-emerald-500" : "text-red-500"}`}
                  >
                    {formatMoney(g.metrics.netPnl)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function MetricsOverview({ data }: { data: DashboardPayload }) {
  const { metrics } = data;

  if (metrics.tradeCount === 0) {
    return <p className="text-sm text-muted-foreground">Keine geschlossenen Trades im gewählten Zeitraum.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        <StatCard label="Netto-PnL" value={formatMoney(metrics.netPnl)} tone={metrics.netPnl >= 0 ? "positive" : "negative"} />
        <StatCard label="Brutto-PnL" value={formatMoney(metrics.grossPnl)} />
        <StatCard label="Winrate" value={formatPercent(metrics.winrate)} />
        <StatCard label="Profit Factor" value={formatRatio(metrics.profitFactor)} />
        <StatCard label="Expectancy" value={formatMoney(metrics.expectancy)} />
        <StatCard label="R:R (Ø)" value={formatRatio(metrics.rrRatio)} />
        <StatCard label="Ø Gewinn" value={formatMoney(metrics.avgWin)} tone="positive" />
        <StatCard label="Ø Verlust" value={formatMoney(metrics.avgLoss)} tone="negative" />
        <StatCard label="Größter Gewinn" value={formatMoney(metrics.largestWin)} tone="positive" />
        <StatCard label="Größter Verlust" value={formatMoney(metrics.largestLoss)} tone="negative" />
        <StatCard label="Anzahl Trades" value={String(metrics.tradeCount)} />
        <StatCard label="Kommissionen" value={formatMoney(metrics.commissions)} />
        <StatCard
          label="Max Drawdown"
          value={metrics.maxDrawdown ? `${formatMoney(metrics.maxDrawdown.value)} (${metrics.maxDrawdown.percent.toFixed(1)}%)` : "–"}
          tone="negative"
        />
        <StatCard label="Recovery Factor" value={formatRatio(metrics.recoveryFactor)} />
        <StatCard label="Sharpe Ratio" value={formatRatio(metrics.sharpeRatio)} />
        <StatCard label="Ø Haltedauer" value={formatDuration(metrics.avgHoldingSeconds)} />
        <StatCard label="Max Win-Streak" value={String(metrics.maxConsecutiveWins)} />
        <StatCard label="Max Loss-Streak" value={String(metrics.maxConsecutiveLosses)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Equity Curve</CardTitle>
        </CardHeader>
        <CardContent>
          <EquityCurveChart data={data.equityCurve} />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Drawdown</CardTitle>
          </CardHeader>
          <CardContent>
            <DrawdownChart data={data.drawdownCurve} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Win/Loss-Verteilung</CardTitle>
          </CardHeader>
          <CardContent>
            <WinLossHistogram data={data.histogram} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">PnL-Kalender</CardTitle>
        </CardHeader>
        <CardContent>
          <PnlCalendarHeatmap data={data.dailyPnl} />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <GroupTable
          title="Nach Strategie"
          groups={data.byStrategy}
          emptyLabel="Keinem Trade eine Strategie zugeordnet."
          chart={<StrategyPerformanceChart groups={data.byStrategy} />}
        />
        <GroupTable
          title="Nach Asset-Klasse"
          groups={data.byAssetClass}
          emptyLabel="Keine Daten."
          chart={<AssetClassPerformanceChart groups={data.byAssetClass} />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Symbole (Top/Flop)</CardTitle>
          </CardHeader>
          <CardContent>
            <SymbolPerformanceChart groups={data.bySymbol} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Haltedauer vs. PnL</CardTitle>
          </CardHeader>
          <CardContent>
            <DurationVsPnlScatter data={data.durationVsPnl} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Performance nach Wochentag</CardTitle>
        </CardHeader>
        <CardContent>
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
              {data.weekdayBreakdown
                .filter((d) => d.tradeCount > 0)
                .map((d) => (
                  <TableRow key={d.weekday}>
                    <TableCell className="font-medium">{weekdayLabel(d.weekday)}</TableCell>
                    <TableCell className="text-right">{d.tradeCount}</TableCell>
                    <TableCell className="text-right">{formatPercent(d.winrate)}</TableCell>
                    <TableCell className={`text-right font-medium ${d.netPnl >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                      {formatMoney(d.netPnl)}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
