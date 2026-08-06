import { and, eq, gte, inArray, lte } from "drizzle-orm";
import { trades } from "@/db/schema";
import type { FilterState } from "./types";

/** Scalar filter conditions (date range, asset class, symbol) for querying
 * the `trades` table directly. Strategy/tag filters go through the n:m join
 * tables and are applied afterwards in JS — see db/queries/trades.ts. */
export function buildTradeWhereClause(filter: FilterState) {
  const conditions = [eq(trades.status, "closed")];

  if (filter.dateFrom) conditions.push(gte(trades.closeTime, filter.dateFrom));
  if (filter.dateTo) conditions.push(lte(trades.closeTime, `${filter.dateTo}T23:59:59`));
  if (filter.assetClasses?.length) {
    conditions.push(
      inArray(trades.assetCategory, filter.assetClasses as (typeof trades.$inferSelect)["assetCategory"][]),
    );
  }
  if (filter.symbols?.length) conditions.push(inArray(trades.symbol, filter.symbols));

  return and(...conditions);
}
