import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { GroupMetrics } from "@/lib/metrics/buildDashboardPayload";
import { formatMoney, formatPercent, formatRatio } from "@/lib/utils/format";

export function GroupTable({
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
