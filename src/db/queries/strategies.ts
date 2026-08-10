import { asc, eq, isNotNull } from "drizzle-orm";
import { db } from "@/db/client";
import { strategies } from "@/db/schema";
import { getFilteredClosedTrades } from "./trades";
import { toClosedTrade } from "@/lib/metrics/buildDashboardPayload";
import { calculateMetrics } from "@/lib/metrics/calculate";
import type { MetricsResult } from "@/lib/metrics/types";

export const UNCATEGORIZED_LABEL = "Ohne Kategorie";

export async function listStrategies() {
  return db.query.strategies.findMany({ orderBy: [asc(strategies.name)] });
}

/** Distinct categories already in use, for the "choose or create" input on
 * the strategy form — categories are freeform text the user assigns, not a
 * separate table, so this is how they get reused instead of retyped. */
export async function listStrategyCategories(): Promise<string[]> {
  const rows = await db
    .selectDistinct({ category: strategies.category })
    .from(strategies)
    .where(isNotNull(strategies.category));
  return rows.map((r) => r.category!).sort((a, b) => a.localeCompare(b));
}

export interface StrategyPerformance {
  id: number;
  name: string;
  status: "active" | "archived";
  category: string;
  metrics: MetricsResult;
}

/** All-time closed-trade performance per strategy, including strategies with
 * zero closed trades (they still show up, just at 0/–). Used for the
 * table + category grouping on the Strategies overview page. */
export async function getStrategiesPerformance(): Promise<StrategyPerformance[]> {
  const [allStrategies, joinedTrades] = await Promise.all([listStrategies(), getFilteredClosedTrades({})]);

  const tradesByStrategyId = new Map<number, ReturnType<typeof toClosedTrade>[]>();
  for (const jt of joinedTrades) {
    for (const ts of jt.tradeStrategies) {
      const list = tradesByStrategyId.get(ts.strategyId) ?? [];
      list.push(toClosedTrade(jt));
      tradesByStrategyId.set(ts.strategyId, list);
    }
  }

  return allStrategies.map((s) => ({
    id: s.id,
    name: s.name,
    status: s.status,
    category: s.category ?? UNCATEGORIZED_LABEL,
    metrics: calculateMetrics(tradesByStrategyId.get(s.id) ?? []),
  }));
}

export async function getStrategyById(id: number) {
  return db.query.strategies.findFirst({
    where: eq(strategies.id, id),
    with: { tradeStrategies: { with: { trade: true } } },
  });
}
