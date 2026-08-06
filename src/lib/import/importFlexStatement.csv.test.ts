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
  path.join(process.cwd(), "data/fixtures/sample-flex-statement.csv"),
  "utf-8",
);

describe("processImportBatch with a CSV Flex statement (in-memory sqlite)", () => {
  it("produces the same trades/PnL as the equivalent XML fixture", async () => {
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
    expect(allTrades).toHaveLength(5); // AAPL x2, ESH4, OPT, SPY — same as the XML fixture

    const spyTrade = allTrades.find((t) => t.symbol === "SPY");
    expect(spyTrade?.assetCategory).toBe("ETF");

    const esTrade = allTrades.find((t) => t.symbol === "ESH4");
    expect(esTrade?.multiplier).toBe(50);
    expect(esTrade?.grossPnl).toBeCloseTo(500);
    expect(esTrade?.netPnl).toBeCloseTo(495.5);
  });

  it("re-importing the same CSV deduplicates on ExecID", async () => {
    const { processImportBatch } = await import("./importFlexStatement");
    const summary = await processImportBatch(fixture);
    expect(summary.fillsImported).toBe(0);
    expect(summary.fillsDuplicate).toBe(11);
  });
});
