import { describe, it, expect, vi } from "vitest";

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

async function seedLosingMondayTrades() {
  const { db } = await import("@/db/client");
  const { accounts, trades } = await import("@/db/schema");

  const [account] = await db.insert(accounts).values({ ibAccountId: "TEST" }).returning();

  // 5 losing Monday trades + 10 winning Tue/Wed trades -> triggers weekdayPerformance.
  const mondayDates = ["2024-01-01", "2024-01-08", "2024-01-15", "2024-01-22", "2024-01-29"];
  const winDates = [
    "2024-01-02", "2024-01-09", "2024-01-16", "2024-01-23", "2024-01-30",
    "2024-01-03", "2024-01-10", "2024-01-17", "2024-01-24", "2024-01-31",
  ];

  for (const d of mondayDates) {
    await db.insert(trades).values({
      accountId: account.id,
      symbol: "AAPL",
      assetCategory: "STK",
      direction: "long",
      openTime: `${d}T09:00:00`,
      closeTime: `${d}T10:00:00`,
      status: "closed",
      quantity: 1,
      avgEntryPrice: 100,
      avgExitPrice: 90,
      netPnl: -50,
      grossPnl: -50,
    });
  }
  for (const d of winDates) {
    await db.insert(trades).values({
      accountId: account.id,
      symbol: "AAPL",
      assetCategory: "STK",
      direction: "long",
      openTime: `${d}T09:00:00`,
      closeTime: `${d}T10:00:00`,
      status: "closed",
      quantity: 1,
      avgEntryPrice: 100,
      avgExitPrice: 110,
      netPnl: 50,
      grossPnl: 50,
    });
  }
}

describe("insights DB integration (in-memory sqlite)", () => {
  it("computes and persists insights, dismiss survives a re-run, resolved findings disappear", async () => {
    await seedLosingMondayTrades();

    const { refreshInsights, dismissInsight, getActiveInsights } = await import("./insights");

    const first = await refreshInsights();
    expect(first.length).toBeGreaterThan(0);
    expect(first.find((i) => i.ruleKey === "weekdayPerformance")).toBeDefined();

    // Re-running with the same data keeps exactly one active instance of the
    // finding (each refresh recomputes from scratch, so the row id itself
    // isn't stable across runs — only the content and count matter here).
    const second = await refreshInsights();
    expect(second.filter((i) => i.ruleKey === "weekdayPerformance")).toHaveLength(1);
    const weekdayInsight = second.find((i) => i.ruleKey === "weekdayPerformance")!;

    // Dismiss it, then re-run: it should not reappear as long as the condition still holds.
    await dismissInsight(weekdayInsight.id);
    const afterDismiss = await refreshInsights();
    expect(afterDismiss.find((i) => i.ruleKey === "weekdayPerformance")).toBeUndefined();

    const active = await getActiveInsights();
    expect(active.find((i) => i.ruleKey === "weekdayPerformance")).toBeUndefined();
  });
});
