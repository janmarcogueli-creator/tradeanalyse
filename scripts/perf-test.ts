/**
 * Seeds several thousand synthetic closed trades into a throwaway SQLite db
 * and times the key read paths (trade list, dashboard metrics, insights) —
 * verifies the "flüssig auch bei mehreren tausend Trades" nonfunctional
 * requirement instead of just assuming it holds.
 *
 * Run: npx tsx scripts/perf-test.ts [tradeCount]
 * Never touches the real dev db — uses DATABASE_PATH to point at a temp file
 * that's deleted when the script exits.
 */
import fs from "node:fs";
import path from "node:path";

const TRADE_COUNT = Number(process.argv[2]) || 5000;
const TMP_DB_PATH = path.join(process.cwd(), "data", `perf-test-${Date.now()}.db`);

process.env.DATABASE_PATH = TMP_DB_PATH;

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function seed() {
  const { migrate } = await import("drizzle-orm/better-sqlite3/migrator");
  const { db } = await import("../src/db/client");
  const schema = await import("../src/db/schema");

  migrate(db, { migrationsFolder: "./drizzle" });

  const [account] = await db.insert(schema.accounts).values({ ibAccountId: "PERF-TEST" }).returning();

  const strategyRows = await db
    .insert(schema.strategies)
    .values(
      ["Breakout", "Mean Reversion", "Trend Following", "Scalping", "Swing"].map((name) => ({ name })),
    )
    .returning();
  const tagRows = await db
    .insert(schema.tags)
    .values(["FOMO", "Disziplin", "News", "Overtrading", "Plan befolgt"].map((name) => ({ name })))
    .returning();

  const symbols: { symbol: string; assetCategory: (typeof schema.trades.$inferInsert)["assetCategory"]; multiplier: number }[] = [
    { symbol: "AAPL", assetCategory: "STK", multiplier: 1 },
    { symbol: "MSFT", assetCategory: "STK", multiplier: 1 },
    { symbol: "TSLA", assetCategory: "STK", multiplier: 1 },
    { symbol: "NVDA", assetCategory: "STK", multiplier: 1 },
    { symbol: "SPY", assetCategory: "ETF", multiplier: 1 },
    { symbol: "QQQ", assetCategory: "ETF", multiplier: 1 },
    { symbol: "ES", assetCategory: "FUT", multiplier: 50 },
    { symbol: "NQ", assetCategory: "FUT", multiplier: 20 },
    { symbol: "GC", assetCategory: "FUT", multiplier: 100 },
    { symbol: "AAPL240119C00150000", assetCategory: "OPT", multiplier: 100 },
  ];

  const now = Date.now();
  const twoYearsMs = 2 * 365 * 24 * 60 * 60 * 1000;

  const tradeRows: (typeof schema.trades.$inferInsert)[] = [];
  for (let i = 0; i < TRADE_COUNT; i++) {
    const sym = pick(symbols);
    const openTimestamp = now - randomBetween(0, twoYearsMs);
    const holdingSeconds = Math.round(randomBetween(60, 8 * 3600));
    const closeTimestamp = openTimestamp + holdingSeconds * 1000;
    const direction = Math.random() > 0.5 ? "long" : "short";
    const entryPrice = randomBetween(10, 500);
    const priceMove = randomBetween(-0.05, 0.055) * entryPrice; // slight positive bias
    const exitPrice = entryPrice + (direction === "long" ? priceMove : -priceMove);
    const quantity = Math.round(randomBetween(1, 100));
    const commissions = randomBetween(0.5, 5);
    const grossPnl = (exitPrice - entryPrice) * quantity * sym.multiplier * (direction === "long" ? 1 : -1);
    const netPnl = grossPnl - commissions;

    tradeRows.push({
      accountId: account.id,
      symbol: sym.symbol,
      assetCategory: sym.assetCategory,
      direction,
      openTime: new Date(openTimestamp).toISOString(),
      closeTime: new Date(closeTimestamp).toISOString(),
      status: "closed",
      quantity,
      avgEntryPrice: entryPrice,
      avgExitPrice: exitPrice,
      multiplier: sym.multiplier,
      grossPnl,
      commissions,
      netPnl,
      holdingSeconds,
    });
  }

  console.log(`Inserting ${TRADE_COUNT} trades...`);
  let insertMs = performance.now();
  const CHUNK = 500;
  const insertedTrades: (typeof schema.trades.$inferSelect)[] = [];
  for (let i = 0; i < tradeRows.length; i += CHUNK) {
    const chunk = await db.insert(schema.trades).values(tradeRows.slice(i, i + CHUNK)).returning();
    insertedTrades.push(...chunk);
  }
  insertMs = performance.now() - insertMs;
  console.log(`  done in ${insertMs.toFixed(0)}ms`);

  // Assign ~40% of trades a strategy and ~30% a tag, for realistic join-heavy queries.
  const tradeStrategyRows: (typeof schema.tradeStrategies.$inferInsert)[] = [];
  const tradeTagRows: (typeof schema.tradeTags.$inferInsert)[] = [];
  for (const t of insertedTrades) {
    if (Math.random() < 0.4) tradeStrategyRows.push({ tradeId: t.id, strategyId: pick(strategyRows).id });
    if (Math.random() < 0.3) tradeTagRows.push({ tradeId: t.id, tagId: pick(tagRows).id });
  }
  for (let i = 0; i < tradeStrategyRows.length; i += CHUNK) {
    await db.insert(schema.tradeStrategies).values(tradeStrategyRows.slice(i, i + CHUNK));
  }
  for (let i = 0; i < tradeTagRows.length; i += CHUNK) {
    await db.insert(schema.tradeTags).values(tradeTagRows.slice(i, i + CHUNK));
  }

  return { db, insertMs };
}

async function timeIt<T>(label: string, fn: () => Promise<T>): Promise<T> {
  const start = performance.now();
  const result = await fn();
  const ms = performance.now() - start;
  console.log(`${label.padEnd(40)} ${ms.toFixed(1)}ms`);
  return result;
}

async function main() {
  console.log(`\nPerf test: ${TRADE_COUNT} trades, db=${TMP_DB_PATH}\n`);

  await seed();

  const { listTrades, getFilteredClosedTrades } = await import("../src/db/queries/trades");
  const { buildDashboardPayload } = await import("../src/lib/metrics/buildDashboardPayload");
  const { refreshInsights } = await import("../src/db/queries/insights");

  console.log("\nQuery timings:\n");

  await timeIt("listTrades() — unfiltered", () => listTrades());
  await timeIt("listTrades() — symbol filter", () => listTrades({ symbol: "AAPL" }));
  await timeIt("getFilteredClosedTrades() — all-time", () => getFilteredClosedTrades({}));

  const closedTrades = await getFilteredClosedTrades({});
  await timeIt("buildDashboardPayload() — full metrics + charts", async () =>
    buildDashboardPayload(closedTrades),
  );

  await timeIt("refreshInsights() — rule engine + persist", () => refreshInsights());

  console.log(`\nDone. Cleaning up ${TMP_DB_PATH}...`);

  const { db } = await import("../src/db/client");
  db.$client.close();
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => {
    for (const suffix of ["", "-wal", "-shm"]) {
      const p = TMP_DB_PATH + suffix;
      try {
        if (fs.existsSync(p)) fs.unlinkSync(p);
      } catch (err) {
        console.warn(`Could not remove ${p}:`, err);
      }
    }
  });
