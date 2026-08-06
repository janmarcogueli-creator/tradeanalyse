import fs from "node:fs";
import path from "node:path";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { accounts, fills, importBatches, trades } from "@/db/schema";
import { requestFlexStatement } from "@/lib/ibkr/flexClient";
import { parseFlexXml } from "@/lib/ibkr/parseFlexXml";
import { parseFlexCsv, looksLikeFlexCsv } from "@/lib/ibkr/parseFlexCsv";
import { mapFlexTrade, MappingError } from "@/lib/ibkr/mapFlexFields";
import { groupFills, resolvePrimaryTradeIndexForFill, type FillForGrouping } from "./groupTrades";
import { getIbkrCredentials } from "@/db/queries/settings";

export interface ImportSummary {
  batchId: number;
  status: "completed" | "error";
  fillsImported: number;
  fillsDuplicate: number;
  rowErrors: string[];
  errorMessage: string | null;
}

async function getOrCreateAccount(ibAccountId: string): Promise<number> {
  const existing = await db.query.accounts.findFirst({
    where: eq(accounts.ibAccountId, ibAccountId),
  });
  if (existing) return existing.id;

  const [created] = await db.insert(accounts).values({ ibAccountId }).returning();
  return created.id;
}

/** Recomputes trades for one (account, symbol) from all its fills, preserving
 * existing trade row ids (so future notes/tags/strategies stay attached)
 * whenever a new group still contains a fill that previously belonged to it. */
async function regroupSymbol(accountId: number, symbol: string): Promise<void> {
  const symbolFills = await db.query.fills.findMany({
    where: and(eq(fills.accountId, accountId), eq(fills.symbol, symbol)),
  });

  const forGrouping: FillForGrouping[] = symbolFills.map((f) => ({
    id: f.id,
    buySell: f.buySell,
    quantity: f.quantity,
    price: f.price,
    multiplier: f.multiplier,
    commission: f.commission,
    datetime: f.datetime,
    assetCategory: f.assetCategory,
  }));

  const groups = groupFills(forGrouping);
  const primaryGroupByFillId = resolvePrimaryTradeIndexForFill(groups);
  const existingTradeIdByFillId = new Map(
    symbolFills.filter((f) => f.tradeGroupId !== null).map((f) => [f.id, f.tradeGroupId as number]),
  );

  const tradeIdForGroupIndex: number[] = [];

  for (let i = 0; i < groups.length; i++) {
    const g = groups[i];
    const existingTradeId = g.fillIds
      .map((id) => existingTradeIdByFillId.get(id))
      .find((id) => id !== undefined);

    const values = {
      accountId,
      symbol,
      assetCategory: g.assetCategory as (typeof trades.$inferInsert)["assetCategory"],
      direction: g.direction,
      openTime: g.openTime,
      closeTime: g.closeTime,
      status: g.status,
      quantity: g.quantity,
      avgEntryPrice: g.avgEntryPrice,
      avgExitPrice: g.avgExitPrice,
      multiplier: g.multiplier,
      grossPnl: g.grossPnl,
      commissions: g.commissions,
      netPnl: g.netPnl,
      holdingSeconds: g.holdingSeconds,
      updatedAt: sql`(current_timestamp)`,
    };

    if (existingTradeId !== undefined) {
      await db.update(trades).set(values).where(eq(trades.id, existingTradeId));
      tradeIdForGroupIndex.push(existingTradeId);
    } else {
      const [created] = await db.insert(trades).values(values).returning();
      tradeIdForGroupIndex.push(created.id);
    }
  }

  for (const [fillId, groupIndex] of primaryGroupByFillId.entries()) {
    await db
      .update(fills)
      .set({ tradeGroupId: tradeIdForGroupIndex[groupIndex] })
      .where(eq(fills.id, fillId));
  }
}

/** Parses+maps+dedupes+groups an already-fetched Flex Query statement (XML or
 * CSV export — IBKR's Flex Query "Format" setting controls which one a given
 * query returns, and users may need CSV for other tools) into the DB. Shared
 * by the Flex Web Service import and the manual upload fallback. Per-row
 * mapping errors are skipped and collected rather than aborting the whole
 * batch. */
export async function processImportBatch(content: string): Promise<ImportSummary> {
  const [batch] = await db
    .insert(importBatches)
    .values({ status: "pending" })
    .returning();

  const isCsv = looksLikeFlexCsv(content);
  const importsDir = path.join(process.cwd(), "data", "imports");
  fs.mkdirSync(importsDir, { recursive: true });
  const rawXmlPath = path.join(importsDir, `${Date.now()}-batch-${batch.id}.${isCsv ? "csv" : "xml"}`);
  fs.writeFileSync(rawXmlPath, content, "utf-8");

  let statements;
  try {
    statements = isCsv ? parseFlexCsv(content) : parseFlexXml(content);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Failed to parse Flex statement";
    await db
      .update(importBatches)
      .set({ status: "error", errorMessage, rawXmlPath })
      .where(eq(importBatches.id, batch.id));
    return {
      batchId: batch.id,
      status: "error",
      fillsImported: 0,
      fillsDuplicate: 0,
      rowErrors: [],
      errorMessage,
    };
  }

  let fillsImported = 0;
  let fillsDuplicate = 0;
  const rowErrors: string[] = [];
  const touchedSymbols = new Set<string>();
  let fromDate: string | null = null;
  let toDate: string | null = null;

  for (const statement of statements) {
    fromDate = statement.fromDate ?? fromDate;
    toDate = statement.toDate ?? toDate;
    const accountId = await getOrCreateAccount(statement.accountId);

    for (const raw of statement.trades) {
      let normalized;
      try {
        normalized = mapFlexTrade(raw);
      } catch (err) {
        if (err instanceof MappingError) {
          rowErrors.push(err.message);
          continue;
        }
        throw err;
      }

      const result = await db
        .insert(fills)
        .values({ ...normalized, accountId, importBatchId: batch.id })
        .onConflictDoNothing({ target: [fills.accountId, fills.ibExecId] })
        .returning({ id: fills.id });

      if (result.length > 0) {
        fillsImported++;
        touchedSymbols.add(`${accountId}:${normalized.symbol}`);
      } else {
        fillsDuplicate++;
      }
    }
  }

  for (const key of touchedSymbols) {
    const [accountIdStr, symbol] = key.split(":");
    await regroupSymbol(Number(accountIdStr), symbol);
  }

  const status = fillsImported === 0 && rowErrors.length > 0 && fillsDuplicate === 0 ? "error" : "completed";
  const errorMessage = rowErrors.length > 0 ? `${rowErrors.length} row(s) skipped: ${rowErrors.slice(0, 5).join("; ")}` : null;

  await db
    .update(importBatches)
    .set({
      status,
      rawXmlPath,
      fromDate,
      toDate,
      fillsImported,
      fillsDuplicate,
      errorMessage,
    })
    .where(eq(importBatches.id, batch.id));

  return { batchId: batch.id, status, fillsImported, fillsDuplicate, rowErrors, errorMessage };
}

export async function importFlexStatement(): Promise<ImportSummary> {
  const { token, queryId } = await getIbkrCredentials();
  if (!token || !queryId) {
    throw new Error(
      "IBKR Flex Token / Query-ID nicht gesetzt — unter Settings eintragen oder in .env.local (siehe .env.local.example)",
    );
  }

  const xml = await requestFlexStatement(token, queryId);
  return processImportBatch(xml);
}
