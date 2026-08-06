import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getStrategyById } from "@/db/queries/strategies";
import { StrategyForm } from "@/components/strategies/strategy-form";
import { ArchiveToggleButton } from "@/components/strategies/archive-toggle-button";
import { formatMoney } from "@/lib/utils/format";

export default async function StrategyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const strategy = await getStrategyById(Number(id));

  if (!strategy) notFound();

  const trades = strategy.tradeStrategies.map((ts) => ts.trade);

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {strategy.name}
            <Badge variant={strategy.status === "active" ? "default" : "secondary"}>
              {strategy.status === "active" ? "aktiv" : "archiviert"}
            </Badge>
          </CardTitle>
          <div className="flex gap-2">
            <StrategyForm
              trigger={<Button variant="outline">Bearbeiten</Button>}
              initial={{
                id: strategy.id,
                name: strategy.name,
                description: strategy.description ?? "",
                rulesText: strategy.rulesText ?? "",
              }}
            />
            <ArchiveToggleButton strategyId={strategy.id} status={strategy.status} />
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          {strategy.description && (
            <div>
              <p className="text-muted-foreground">Beschreibung</p>
              <p className="whitespace-pre-wrap">{strategy.description}</p>
            </div>
          )}
          {strategy.rulesText && (
            <div>
              <p className="text-muted-foreground">Regeln</p>
              <p className="whitespace-pre-wrap">{strategy.rulesText}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Zugeordnete Trades ({trades.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {trades.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Noch keine Trades dieser Strategie zugeordnet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Eröffnet</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Netto-PnL</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trades.map((trade) => (
                  <TableRow key={trade.id}>
                    <TableCell>
                      <Link href={`/trades/${trade.id}`} className="font-medium hover:underline">
                        {trade.symbol}
                      </Link>
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
