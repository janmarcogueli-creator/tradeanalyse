import { asc, isNotNull } from "drizzle-orm";
import { db } from "@/db/client";
import { tags } from "@/db/schema";
import { getFilteredClosedTrades } from "./trades";
import { toClosedTrade } from "@/lib/metrics/buildDashboardPayload";
import { calculateMetrics } from "@/lib/metrics/calculate";
import type { MetricsResult } from "@/lib/metrics/types";

export const UNCATEGORIZED_LABEL = "Ohne Kategorie";

export async function listTags() {
  return db.query.tags.findMany({ orderBy: [asc(tags.name)] });
}

/** Distinct categories already in use, for the "choose or create" input on
 * the tag form — categories are freeform text, same pattern as strategies. */
export async function listTagCategories(): Promise<string[]> {
  const rows = await db.selectDistinct({ category: tags.category }).from(tags).where(isNotNull(tags.category));
  return rows.map((r) => r.category!).sort((a, b) => a.localeCompare(b));
}

export interface TagPerformance {
  id: number;
  name: string;
  category: string | null;
  color: string | null;
  metrics: MetricsResult;
}

/** All-time closed-trade performance per tag, including tags with zero
 * closed trades. Used for the Tags overview page and the Analyse page's
 * tag-performance section. */
export async function getTagsPerformance(): Promise<TagPerformance[]> {
  const [allTags, joinedTrades] = await Promise.all([listTags(), getFilteredClosedTrades({})]);

  const tradesByTagId = new Map<number, ReturnType<typeof toClosedTrade>[]>();
  for (const jt of joinedTrades) {
    for (const tt of jt.tradeTags) {
      const list = tradesByTagId.get(tt.tagId) ?? [];
      list.push(toClosedTrade(jt));
      tradesByTagId.set(tt.tagId, list);
    }
  }

  return allTags.map((t) => ({
    id: t.id,
    name: t.name,
    category: t.category,
    color: t.color,
    metrics: calculateMetrics(tradesByTagId.get(t.id) ?? []),
  }));
}

