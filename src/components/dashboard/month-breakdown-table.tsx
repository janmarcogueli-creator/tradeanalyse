import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { MonthBreakdown } from "@/lib/metrics/calculate";
import { formatMoney, formatPercent } from "@/lib/utils/format";

const MONTH_LABELS_DE = [
  "Jan", "Feb", "Mär", "Apr", "Mai", "Jun",
  "Jul", "Aug", "Sep", "Okt", "Nov", "Dez",
];

function formatMonth(month: string): string {
  const [year, monthNum] = month.split("-");
  return `${MONTH_LABELS_DE[Number(monthNum) - 1]} ${year}`;
}

export function MonthBreakdownTable({ data }: { data: MonthBreakdown[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Performance nach Monat</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground">Keine Daten.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Monat</TableHead>
                <TableHead className="text-right">Trades</TableHead>
                <TableHead className="text-right">Winrate</TableHead>
                <TableHead className="text-right">Netto-PnL</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...data].reverse().map((m) => (
                <TableRow key={m.month}>
                  <TableCell className="font-medium">{formatMonth(m.month)}</TableCell>
                  <TableCell className="text-right">{m.tradeCount}</TableCell>
                  <TableCell className="text-right">{formatPercent(m.winrate)}</TableCell>
                  <TableCell
                    className={`text-right font-medium ${m.netPnl >= 0 ? "text-emerald-500" : "text-red-500"}`}
                  >
                    {formatMoney(m.netPnl)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
