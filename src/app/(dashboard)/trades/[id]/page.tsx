import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getTradeById } from "@/db/queries/trades";
import { listStrategies } from "@/db/queries/strategies";
import { listTags } from "@/db/queries/tags";
import { FillsTable } from "@/components/trades/fills-table";
import { TagPicker } from "@/components/trades/tag-picker";
import { StrategyPicker } from "@/components/trades/strategy-picker";
import { NotesPanel } from "@/components/trades/notes-panel";
import { AttachmentUpload } from "@/components/trades/attachment-upload";
import { formatMoney } from "@/lib/utils/format";

export default async function TradeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tradeId = Number(id);

  const [trade, strategies, tags] = await Promise.all([
    getTradeById(tradeId),
    listStrategies(),
    listTags(),
  ]);

  if (!trade) notFound();

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {trade.symbol}
            <Badge variant="outline">{trade.assetCategory}</Badge>
            <Badge variant={trade.status === "open" ? "secondary" : "default"}>
              {trade.status === "open" ? "offen" : "geschlossen"}
            </Badge>
          </CardTitle>
          <span
            className={`text-lg font-semibold ${
              trade.netPnl === null
                ? "text-muted-foreground"
                : trade.netPnl >= 0
                  ? "text-emerald-500"
                  : "text-red-500"
            }`}
          >
            {formatMoney(trade.netPnl)}
          </span>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
          <div>
            <p className="text-muted-foreground">Richtung</p>
            <p>{trade.direction === "long" ? "Long" : "Short"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Menge</p>
            <p>{trade.quantity}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Ø Entry</p>
            <p>{trade.avgEntryPrice.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Ø Exit</p>
            <p>{trade.avgExitPrice?.toFixed(2) ?? "–"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Eröffnet</p>
            <p>{new Date(trade.openTime).toLocaleString("de-DE")}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Geschlossen</p>
            <p>{trade.closeTime ? new Date(trade.closeTime).toLocaleString("de-DE") : "–"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Kommissionen</p>
            <p>{formatMoney(trade.commissions)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Brutto-PnL</p>
            <p>{formatMoney(trade.grossPnl)}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Strategien</CardTitle>
          </CardHeader>
          <CardContent>
            <StrategyPicker
              tradeId={trade.id}
              allStrategies={strategies}
              assignedStrategyIds={trade.tradeStrategies.map((ts) => ts.strategyId)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <TagPicker
              tradeId={trade.id}
              allTags={tags}
              assignedTagIds={trade.tradeTags.map((tt) => tt.tagId)}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Fills</CardTitle>
        </CardHeader>
        <CardContent>
          <FillsTable fills={trade.fills} />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notizen</CardTitle>
          </CardHeader>
          <CardContent>
            <NotesPanel tradeId={trade.id} notes={trade.notes} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Screenshots</CardTitle>
          </CardHeader>
          <CardContent>
            <AttachmentUpload tradeId={trade.id} attachments={trade.attachments} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
