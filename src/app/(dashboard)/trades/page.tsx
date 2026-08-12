import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { listTrades, type TradeFilter } from "@/db/queries/trades";
import { listStrategies } from "@/db/queries/strategies";
import { listTags } from "@/db/queries/tags";
import { TradeFilterBar } from "@/components/trades/trade-filter-bar";
import { TradeTable } from "@/components/trades/trade-table";

export default async function TradesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const get = (key: string) => (typeof params[key] === "string" ? params[key] : undefined);

  const filter: TradeFilter = {
    symbol: get("symbol"),
    assetCategory: get("assetCategory"),
    strategyId: get("strategyId") ? Number(get("strategyId")) : undefined,
    tagId: get("tagId") ? Number(get("tagId")) : undefined,
    dateFrom: get("dateFrom"),
    dateTo: get("dateTo"),
  };

  const [trades, strategies, tags] = await Promise.all([
    listTrades(filter),
    listStrategies(),
    listTags(),
  ]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Trades</CardTitle>
        <Button render={<Link href="/trades/new" />} nativeButton={false}>
          Trade anlegen
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <TradeFilterBar strategies={strategies} tags={tags} />
        <TradeTable trades={trades} allStrategies={strategies} allTags={tags} />
      </CardContent>
    </Card>
  );
}
