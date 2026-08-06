import { describe, it, expect, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";

vi.mock("@/db/client", async () => {
  const { default: Database } = await import("better-sqlite3");
  const { drizzle } = await import("drizzle-orm/better-sqlite3");
  const { migrate } = await import("drizzle-orm/better-sqlite3/migrator");
  const schema = await import("@/db/schema");

  const sqlite = new Database(":memory:");
  sqlite.pragma("foreign_keys = ON");
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: "./drizzle" });

  return { db };
});

const fixture = fs.readFileSync(
  path.join(process.cwd(), "data/fixtures/sample-flex-statement.xml"),
  "utf-8",
);

describe("processImportBatch (integration, in-memory sqlite)", () => {
  it("imports all fixture fills and groups them into the expected trades", async () => {
    const { processImportBatch } = await import("./importFlexStatement");
    const { db } = await import("@/db/client");
    const { fills, trades } = await import("@/db/schema");

    const summary = await processImportBatch(fixture);

    expect(summary.status).toBe("completed");
    expect(summary.fillsImported).toBe(11);
    expect(summary.fillsDuplicate).toBe(0);

    const allFills = await db.select().from(fills);
    expect(allFills).toHaveLength(11);
    expect(allFills.every((f) => f.tradeGroupId !== null)).toBe(true);

    const allTrades = await db.select().from(trades);
    // AAPL round trip x2, ESH4 x1, AAPL option x1, SPY x1
    expect(allTrades).toHaveLength(5);

    const spyTrade = allTrades.find((t) => t.symbol === "SPY");
    expect(spyTrade?.assetCategory).toBe("ETF");
    expect(spyTrade?.status).toBe("closed");

    const esTrade = allTrades.find((t) => t.symbol === "ESH4");
    expect(esTrade?.multiplier).toBe(50);
    expect(esTrade?.grossPnl).toBeCloseTo(500);
    expect(esTrade?.commissions).toBeCloseTo(4.5);
    expect(esTrade?.netPnl).toBeCloseTo(495.5);
  });

  it("is idempotent: re-importing the same statement deduplicates fills and keeps trade ids stable", async () => {
    const { processImportBatch } = await import("./importFlexStatement");
    const { db } = await import("@/db/client");
    const { trades } = await import("@/db/schema");

    const before = await db.select().from(trades);
    const beforeIds = before.map((t) => t.id).sort();

    const summary = await processImportBatch(fixture);

    expect(summary.fillsImported).toBe(0);
    expect(summary.fillsDuplicate).toBe(11);

    const after = await db.select().from(trades);
    const afterIds = after.map((t) => t.id).sort();

    expect(afterIds).toEqual(beforeIds); // no new/duplicate trade rows created
  });
});
