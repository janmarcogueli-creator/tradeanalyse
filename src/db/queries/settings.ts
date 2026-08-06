import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { settings } from "@/db/schema";

export const SETTINGS_KEYS = {
  ibkrFlexToken: "ibkr_flex_token",
  ibkrFlexQueryId: "ibkr_flex_query_id",
} as const;

export async function getSetting(key: string): Promise<string | null> {
  const row = await db.query.settings.findFirst({ where: eq(settings.key, key) });
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await db
    .insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({ target: settings.key, set: { value } });
}

export async function deleteSetting(key: string): Promise<void> {
  await db.delete(settings).where(eq(settings.key, key));
}

/** DB-stored override takes precedence over the .env.local default, so the
 * Settings page can update credentials without a server restart. */
export async function getIbkrCredentials(): Promise<{ token: string | null; queryId: string | null }> {
  const [token, queryId] = await Promise.all([
    getSetting(SETTINGS_KEYS.ibkrFlexToken),
    getSetting(SETTINGS_KEYS.ibkrFlexQueryId),
  ]);
  return {
    token: token ?? process.env.IBKR_FLEX_TOKEN ?? null,
    queryId: queryId ?? process.env.IBKR_FLEX_QUERY_ID ?? null,
  };
}
