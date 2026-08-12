import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getTagsPerformance, listTagCategories, UNCATEGORIZED_LABEL, type TagPerformance } from "@/db/queries/tags";
import { TagForm } from "@/components/tags/tag-form";
import { formatMoney, formatPercent, formatRatio } from "@/lib/utils/format";

function groupByCategory(tags: TagPerformance[]) {
  const groups = new Map<string, TagPerformance[]>();
  for (const t of tags) {
    const key = t.category ?? UNCATEGORIZED_LABEL;
    const list = groups.get(key) ?? [];
    list.push(t);
    groups.set(key, list);
  }
  for (const list of groups.values()) {
    list.sort((a, b) => b.metrics.netPnl - a.metrics.netPnl);
  }
  return Array.from(groups.entries())
    .map(([category, items]) => ({
      category,
      items,
      totalNetPnl: items.reduce((sum, t) => sum + t.metrics.netPnl, 0),
    }))
    .sort((a, b) => b.totalNetPnl - a.totalNetPnl);
}

export default async function TagsPage() {
  const [tags, existingCategories] = await Promise.all([getTagsPerformance(), listTagCategories()]);
  const categories = groupByCategory(tags);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">
          {tags.length} Tag{tags.length === 1 ? "" : "s"}
        </h2>
        <TagForm trigger={<Button>Neuer Tag</Button>} existingCategories={existingCategories} />
      </div>

      {tags.length === 0 ? (
        <p className="text-sm text-muted-foreground">Noch keine Tags angelegt.</p>
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
                    <TableHead>Tag</TableHead>
                    <TableHead className="text-right">Trades</TableHead>
                    <TableHead className="text-right">Winrate</TableHead>
                    <TableHead className="text-right">Profit Factor</TableHead>
                    <TableHead className="text-right">Netto-PnL</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>
                        <TagForm
                          trigger={
                            <button className="font-medium hover:underline cursor-pointer">{t.name}</button>
                          }
                          initial={{ id: t.id, name: t.name, category: t.category ?? "", color: t.color ?? "" }}
                          existingCategories={existingCategories}
                        />
                      </TableCell>
                      <TableCell className="text-right">{t.metrics.tradeCount}</TableCell>
                      <TableCell className="text-right">{formatPercent(t.metrics.winrate)}</TableCell>
                      <TableCell className="text-right">{formatRatio(t.metrics.profitFactor)}</TableCell>
                      <TableCell
                        className={`text-right font-medium ${
                          t.metrics.netPnl >= 0 ? "text-emerald-500" : "text-red-500"
                        }`}
                      >
                        {formatMoney(t.metrics.netPnl)}
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
