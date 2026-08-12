import { and, asc, desc, eq, gte, like, lte, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { fills, notes, trades } from "@/db/schema";
import { buildTradeWhereClause } from "@/lib/filters/buildWhereClause";
import type { FilterState } from "@/lib/filters/types";

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
    // Open positions first (case expression sorts them into bucket 0), then
    // newest-opened first within each bucket.
    orderBy: [sql`CASE WHEN ${trades.status} = 'open' THEN 0 ELSE 1 END`, desc(trades.openTime)],
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

/** Closed trades matching a dashboard FilterState, with strategy/tag joins
 * for breakdown grouping. Used by the metrics engine (M3) and, later, charts. */
export async function getFilteredClosedTrades(filter: FilterState = {}) {
  const rows = await db.query.trades.findMany({
    where: buildTradeWhereClause(filter),
    orderBy: [asc(trades.closeTime)],
    with: {
      tradeStrategies: { with: { strategy: true } },
      tradeTags: { with: { tag: true } },
    },
  });

  return rows.filter((t) => {
    if (filter.strategyIds?.length && !t.tradeStrategies.some((ts) => filter.strategyIds!.includes(ts.strategyId))) {
      return false;
    }
    if (filter.tagIds?.length && !t.tradeTags.some((tt) => filter.tagIds!.includes(tt.tagId))) {
      return false;
    }
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
