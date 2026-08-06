import Link from "next/link";
import type { listTrades } from "@/db/queries/trades";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Trade = Awaited<ReturnType<typeof listTrades>>[number];

function formatMoney(value: number | null) {
  if (value === null) return "–";
  return value.toLocaleString("de-DE", { style: "currency", currency: "USD" });
}

export function TradeTable({ trades }: { trades: Trade[] }) {
  if (trades.length === 0) {
    return <p className="text-sm text-muted-foreground">Keine Trades gefunden.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Symbol</TableHead>
          <TableHead>Klasse</TableHead>
          <TableHead>Richtung</TableHead>
          <TableHead>Eröffnet</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Netto-PnL</TableHead>
          <TableHead>Strategien</TableHead>
          <TableHead>Tags</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {trades.map((trade) => (
          <TableRow key={trade.id} className="cursor-pointer">
            <TableCell>
              <Link href={`/trades/${trade.id}`} className="font-medium hover:underline">
                {trade.symbol}
              </Link>
            </TableCell>
            <TableCell className="text-muted-foreground">{trade.assetCategory}</TableCell>
            <TableCell className="text-muted-foreground">
              {trade.direction === "long" ? "Long" : "Short"}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {new Date(trade.openTime).toLocaleString("de-DE")}
            </TableCell>
            <TableCell>
              <Badge variant={trade.status === "open" ? "secondary" : "default"}>
                {trade.status === "open" ? "offen" : "geschlossen"}
              </Badge>
            </TableCell>
            <TableCell
              className={`text-right font-medium ${
                trade.netPnl === null
                  ? "text-muted-foreground"
                  : trade.netPnl >= 0
                    ? "text-emerald-500"
                    : "text-red-500"
              }`}
            >
              {formatMoney(trade.netPnl)}
            </TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-1">
                {trade.tradeStrategies.map((ts) => (
                  <Badge key={ts.strategyId} variant="outline">
                    {ts.strategy.name}
                  </Badge>
                ))}
              </div>
            </TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-1">
                {trade.tradeTags.map((tt) => (
                  <Badge key={tt.tagId} variant="secondary">
                    {tt.tag.name}
                  </Badge>
                ))}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
