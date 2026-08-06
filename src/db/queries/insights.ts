import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { insights as insightsTable } from "@/db/schema";
import { getFilteredClosedTrades } from "./trades";
import { toClosedTrade, type JoinedTrade } from "@/lib/metrics/buildDashboardPayload";
import { runInsightRules } from "@/lib/insights/runner";
import type { InsightContext, StrategyTrades } from "@/lib/insights/types";

function buildContext(joinedTrades: JoinedTrade[]): InsightContext {
  const trades = joinedTrades.map(toClosedTrade);

  const byStrategyMap = new Map<number, StrategyTrades>();
  for (const jt of joinedTrades) {
    for (const ts of jt.tradeStrategies) {
      const entry =
        byStrategyMap.get(ts.strategyId) ??
        ({ strategyId: ts.strategyId, strategyName: ts.strategy.name, trades: [] } satisfies StrategyTrades);
      entry.trades.push(toClosedTrade(jt));
      byStrategyMap.set(ts.strategyId, entry);
    }
  }

  return { trades, byStrategy: Array.from(byStrategyMap.values()) };
}

function scopeKey(ruleKey: string, scope: Record<string, string | number>): string {
  return `${ruleKey}:${JSON.stringify(scope)}`;
}

/** Recomputes insights against all-time closed trades and persists them,
 * preserving dismissed state for insights whose (ruleKey, scope) still
 * matches — a re-run neither loses a dismissal nor hides a genuinely new
 * finding. Returns the resulting active (non-dismissed) insights. */
export async function refreshInsights() {
  const joinedTrades = await getFilteredClosedTrades({});
  const ctx = buildContext(joinedTrades);
  const freshInsights = runInsightRules(ctx);

  const dismissedRows = await db.query.insights.findMany({ where: eq(insightsTable.dismissed, true) });
  const dismissedKeys = new Set(dismissedRows.map((r) => `${r.ruleKey}:${r.scopeJson}`));

  await db.delete(insightsTable).where(eq(insightsTable.dismissed, false));

  const toInsert = freshInsights.filter((i) => !dismissedKeys.has(scopeKey(i.ruleKey, i.scope)));
  if (toInsert.length > 0) {
    await db.insert(insightsTable).values(
      toInsert.map((i) => ({
        ruleKey: i.ruleKey,
        severity: i.severity,
        title: i.title,
        description: i.description,
        scopeJson: JSON.stringify(i.scope),
      })),
    );
  }

  return getActiveInsights();
}

export async function getActiveInsights() {
  return db.query.insights.findMany({
    where: eq(insightsTable.dismissed, false),
    orderBy: [desc(insightsTable.computedAt)],
  });
}

export async function dismissInsight(id: number) {
  await db.update(insightsTable).set({ dismissed: true }).where(eq(insightsTable.id, id));
}
