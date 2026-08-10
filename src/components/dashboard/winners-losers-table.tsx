import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ClosedTrade } from "@/lib/metrics/types";
import { formatMoney } from "@/lib/utils/format";

function TradesTable({ trades }: { trades: ClosedTrade[] }) {
  if (trades.length === 0) {
    return <p className="text-sm text-muted-foreground">Keine Daten.</p>;
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Symbol</TableHead>
          <TableHead>Geschlossen</TableHead>
          <TableHead className="text-right">Netto-PnL</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {trades.map((t) => (
          <TableRow key={t.id}>
            <TableCell>
              <Link href={`/trades/${t.id}`} className="font-medium hover:underline">
                {t.symbol}
              </Link>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {new Date(t.closeTime).toLocaleString("de-DE")}
            </TableCell>
            <TableCell
              className={`text-right font-medium ${t.netPnl >= 0 ? "text-emerald-500" : "text-red-500"}`}
            >
              {formatMoney(t.netPnl)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function WinnersLosersTable({
  winners,
  losers,
}: {
  winners: ClosedTrade[];
  losers: ClosedTrade[];
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Größte Gewinner</CardTitle>
        </CardHeader>
        <CardContent>
          <TradesTable trades={winners} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Größte Verlierer</CardTitle>
        </CardHeader>
        <CardContent>
          <TradesTable trades={losers} />
        </CardContent>
      </Card>
    </div>
  );
}
