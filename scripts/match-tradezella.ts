/**
 * Matches a TradeZella trade-history CSV export against already-imported
 * trades in the DB (by symbol + open date + direction), then assigns the
 * matched trade's Playbook -> Strategy and Mistakes -> Tags(category=mistake).
 *
 * Dry run (default): npx tsx scripts/match-tradezella.ts <csv-path>
 *   Prints match statistics only, writes nothing.
 * Apply:              npx tsx scripts/match-tradezella.ts <csv-path> --apply
 *   Creates strategies/tags as needed and links them to matched trades.
 */
import fs from "node:fs";
import { parse } from "csv-parse/sync";

const csvPath = process.argv[2];
const apply = process.argv.includes("--apply");

if (!csvPath) {
  console.error("Usage: npx tsx scripts/match-tradezella.ts <csv-path> [--apply]");
  process.exit(1);
}

interface TradeZellaRow {
  Symbol: string;
  "Open Date": string;
  "Close Date": string;
  Side: string;
  Playbook: string;
  Mistakes: string;
  "Net P&L": string;
  Quantity: string;
}

// TradeZella sometimes appends a broker/venue suffix to the ticker (e.g.
// "CBKD" for IBKR's "CBK") — strip trailing single letters as a heuristic
// and fall back to exact match if that doesn't help.
function symbolCandidates(symbol: string): string[] {
  const candidates = new Set([symbol]);
  if (symbol.length > 2) candidates.add(symbol.slice(0, -1));
  return Array.from(candidates);
}

// For options, IBKR's Symbol is the full OCC-style contract string ("QQQ
// 260831C00714000") while TradeZella only exports the underlying ticker
// ("QQQ") — an exact match never fires, so also accept "<candidate> " as a
// prefix (the space guards against a different ticker that merely starts
// with the same letters, e.g. "TSLA" vs "TSLAX").
function symbolMatches(dbSymbol: string, tzSymbol: string): boolean {
  const dbUpper = dbSymbol.toUpperCase();
  const candidates = symbolCandidates(tzSymbol.toUpperCase());
  return candidates.includes(dbUpper) || candidates.some((c) => dbUpper.startsWith(`${c} `));
}

function parsePnl(raw: string): number {
  return parseFloat((raw || "").replace(/[^0-9.-]/g, ""));
}

async function main() {
  const csv = fs.readFileSync(csvPath, "utf-8");
  const rows = parse(csv, { columns: true, skip_empty_lines: true, trim: true }) as TradeZellaRow[];
  console.log(`Parsed ${rows.length} TradeZella rows.`);

  const { db } = await import("../src/db/client");
  const { trades, strategies, tags, tradeStrategies, tradeTags } = await import("../src/db/schema");
  const { eq, and } = await import("drizzle-orm");

  const allTrades = await db.select().from(trades);
  console.log(`Matching against ${allTrades.length} trades in the DB.\n`);

  let matched = 0;
  let ambiguous = 0;
  let unmatched = 0;
  const unmatchedSamples: string[] = [];
  const ambiguousSamples: string[] = [];

  const matches: { tradeId: number; playbooks: string[]; mistakes: string[] }[] = [];

  for (const row of rows) {
    if (!row.Symbol || !row["Open Date"]) continue;
    const side = row.Side?.toLowerCase() === "short" ? "short" : "long";

    let dbCandidates = allTrades.filter(
      (t) =>
        symbolMatches(t.symbol, row.Symbol) &&
        t.direction === side &&
        t.openTime.startsWith(row["Open Date"]),
    );

    // Same symbol/direction/day can hold several round-trips (e.g. two TSLA
    // options opened the same morning) — Net P&L is unique enough per trade
    // to break the tie in practice, so narrow to it before giving up.
    if (dbCandidates.length > 1) {
      const tzPnl = parsePnl(row["Net P&L"]);
      const byPnl = dbCandidates.filter((t) => t.netPnl !== null && Math.abs(t.netPnl - tzPnl) < 0.5);
      if (byPnl.length === 1) dbCandidates = byPnl;
    }

    if (dbCandidates.length === 1) {
      matched++;
      const mistakes = row.Mistakes
        ? row.Mistakes.split(",").map((m) => m.trim()).filter(Boolean)
        : [];
      // A trade can carry more than one Playbook — TradeZella exports them
      // comma-joined in one cell, same as Mistakes.
      const playbooks = row.Playbook
        ? row.Playbook.split(",").map((p) => p.trim()).filter((p) => p && p !== "No strategy")
        : [];
      if (playbooks.length > 0) {
        matches.push({ tradeId: dbCandidates[0].id, playbooks, mistakes });
      }
    } else if (dbCandidates.length > 1) {
      ambiguous++;
      if (ambiguousSamples.length < 5) {
        ambiguousSamples.push(`${row.Symbol} ${row["Open Date"]} (${dbCandidates.length} candidates)`);
      }
    } else {
      unmatched++;
      if (unmatchedSamples.length < 5) {
        unmatchedSamples.push(`${row.Symbol} ${row["Open Date"]} ${side}`);
      }
    }
  }

  console.log(`Matched:   ${matched}`);
  console.log(`Ambiguous: ${ambiguous}  ${ambiguousSamples.length ? "e.g. " + ambiguousSamples.join(", ") : ""}`);
  console.log(`Unmatched: ${unmatched}  ${unmatchedSamples.length ? "e.g. " + unmatchedSamples.join(", ") : ""}`);
  console.log(`\nOf matched, ${matches.length} carry a usable Playbook -> Strategy assignment.`);

  const playbookCounts = new Map<string, number>();
  for (const m of matches) {
    for (const p of m.playbooks) playbookCounts.set(p, (playbookCounts.get(p) ?? 0) + 1);
  }
  console.log("\nStrategies that would be created/used:");
  for (const [name, count] of [...playbookCounts.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${count.toString().padStart(4)}  ${name}`);
  }

  if (!apply) {
    console.log("\nDry run only — pass --apply to write strategies/tags and assignments.");
    return;
  }

  console.log("\nApplying...");
  const strategyIdByName = new Map<string, number>();
  const tagIdByName = new Map<string, number>();

  for (const { tradeId, playbooks, mistakes } of matches) {
    for (const playbook of playbooks) {
      let strategyId = strategyIdByName.get(playbook);
      if (!strategyId) {
        const existing = await db.query.strategies.findFirst({ where: eq(strategies.name, playbook) });
        strategyId = existing?.id ?? (await db.insert(strategies).values({ name: playbook }).returning())[0].id;
        strategyIdByName.set(playbook, strategyId);
      }
      const existingLink = await db.query.tradeStrategies.findFirst({
        where: and(eq(tradeStrategies.tradeId, tradeId), eq(tradeStrategies.strategyId, strategyId)),
      });
      if (!existingLink) {
        await db.insert(tradeStrategies).values({ tradeId, strategyId });
      }
    }

    for (const mistake of mistakes) {
      let tagId = tagIdByName.get(mistake);
      if (!tagId) {
        const existing = await db.query.tags.findFirst({ where: eq(tags.name, mistake) });
        tagId =
          existing?.id ??
          (await db.insert(tags).values({ name: mistake, category: "mistake" }).returning())[0].id;
        tagIdByName.set(mistake, tagId);
      }
      const existingTagLink = await db.query.tradeTags.findFirst({
        where: and(eq(tradeTags.tradeId, tradeId), eq(tradeTags.tagId, tagId)),
      });
      if (!existingTagLink) {
        await db.insert(tradeTags).values({ tradeId, tagId });
      }
    }
  }

  console.log(`Done. ${strategyIdByName.size} strategies, ${tagIdByName.size} mistake-tags used.`);
}

main().then(() => process.exit(0));
