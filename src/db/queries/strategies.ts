import { asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { strategies } from "@/db/schema";

export async function listStrategies() {
  return db.query.strategies.findMany({ orderBy: [asc(strategies.name)] });
}

export async function getStrategyById(id: number) {
  return db.query.strategies.findFirst({
    where: eq(strategies.id, id),
    with: { tradeStrategies: { with: { trade: true } } },
  });
}
