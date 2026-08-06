import { and, asc, desc, eq, gte, like, lte } from "drizzle-orm";
import { db } from "@/db/client";
import { fills, notes, trades } from "@/db/schema";

export interface TradeFilter {
  symbol?: string;
  assetCategory?: string;
  strategyId?: number;
  tagId?: number;
  dateFrom?: string;
  dateTo?: string;
}

export async function listTrades(filter: TradeFilter = {}) {
  const conditions = [];
  if (filter.symbol) conditions.push(like(trades.symbol, `%${filter.symbol.toUpperCase()}%`));
  if (filter.assetCategory) {
    conditions.push(eq(trades.assetCategory, filter.assetCategory as (typeof trades.$inferSelect)["assetCategory"]));
  }
  if (filter.dateFrom) conditions.push(gte(trades.openTime, filter.dateFrom));
  if (filter.dateTo) conditions.push(lte(trades.openTime, `${filter.dateTo}T23:59:59`));

  const rows = await db.query.trades.findMany({
    where: conditions.length ? and(...conditions) : undefined,
    orderBy: [desc(trades.openTime)],
    with: {
      tradeStrategies: { with: { strategy: true } },
      tradeTags: { with: { tag: true } },
    },
  });

  // Strategy/tag filters go through an n:m join table, so applying them here
  // in JS (rather than a SQL join) keeps the query simple — fine at the
  // "several thousand trades" scale this app targets.
  return rows.filter((t) => {
    if (filter.strategyId && !t.tradeStrategies.some((ts) => ts.strategyId === filter.strategyId)) return false;
    if (filter.tagId && !t.tradeTags.some((tt) => tt.tagId === filter.tagId)) return false;
    return true;
  });
}

export async function getTradeById(id: number) {
  return db.query.trades.findFirst({
    where: eq(trades.id, id),
    with: {
      fills: { orderBy: [asc(fills.datetime)] },
      notes: { orderBy: [desc(notes.createdAt)] },
      attachments: true,
      tradeStrategies: { with: { strategy: true } },
      tradeTags: { with: { tag: true } },
    },
  });
}
