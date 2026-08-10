import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StatusToggleBadge } from "@/components/strategies/status-toggle-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getStrategiesPerformance,
  listStrategyCategories,
  type StrategyPerformance,
} from "@/db/queries/strategies";
import { StrategyForm } from "@/components/strategies/strategy-form";
import { formatMoney, formatPercent, formatRatio } from "@/lib/utils/format";

function groupByCategory(strategies: StrategyPerformance[]) {
  const groups = new Map<string, StrategyPerformance[]>();
  for (const s of strategies) {
    const list = groups.get(s.category) ?? [];
    list.push(s);
    groups.set(s.category, list);
  }
  for (const list of groups.values()) {
    list.sort((a, b) => b.metrics.netPnl - a.metrics.netPnl);
  }
  return Array.from(groups.entries())
    .map(([category, items]) => ({
      category,
      items,
      totalNetPnl: items.reduce((sum, s) => sum + s.metrics.netPnl, 0),
    }))
    .sort((a, b) => b.totalNetPnl - a.totalNetPnl);
}

export default async function StrategiesPage() {
  const [strategies, existingCategories] = await Promise.all([
    getStrategiesPerformance(),
    listStrategyCategories(),
  ]);
  const categories = groupByCategory(strategies);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">
          {strategies.length} Strategie{strategies.length === 1 ? "" : "n"}
        </h2>
        <StrategyForm
          trigger={<Button>Neue Strategie</Button>}
          existingCategories={existingCategories}
        />
      </div>

      {strategies.length === 0 ? (
        <p className="text-sm text-muted-foreground">Noch keine Strategien angelegt.</p>
      ) : (
        categories.map(({ category, items, totalNetPnl }) => (
          <Card key={category}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">{category}</CardTitle>
              <span
                className={`text-sm font-medium ${totalNetPnl >= 0 ? "text-emerald-500" : "text-red-500"}`}
              >
                {formatMoney(totalNetPnl)}
              </span>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Strategie</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Trades</TableHead>
                    <TableHead className="text-right">Winrate</TableHead>
                    <TableHead className="text-right">Profit Factor</TableHead>
                    <TableHead className="text-right">Netto-PnL</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <Link href={`/strategies/${s.id}`} className="font-medium hover:underline">
                          {s.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <StatusToggleBadge strategyId={s.id} status={s.status} />
                      </TableCell>
                      <TableCell className="text-right">{s.metrics.tradeCount}</TableCell>
                      <TableCell className="text-right">{formatPercent(s.metrics.winrate)}</TableCell>
                      <TableCell className="text-right">{formatRatio(s.metrics.profitFactor)}</TableCell>
                      <TableCell
                        className={`text-right font-medium ${
                          s.metrics.netPnl >= 0 ? "text-emerald-500" : "text-red-500"
                        }`}
                      >
                        {formatMoney(s.metrics.netPnl)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
