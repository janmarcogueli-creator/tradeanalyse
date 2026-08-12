import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { accounts } from "@/db/schema";

const MANUAL_ACCOUNT_IB_ID = "MANUAL";

/** Manually entered trades need an account FK but have no real IBKR account
 * behind them — this lazily creates a single shared placeholder account
 * ("Manuell") the first time it's needed. */
export async function getOrCreateManualAccount() {
  const existing = await db.query.accounts.findFirst({ where: eq(accounts.ibAccountId, MANUAL_ACCOUNT_IB_ID) });
  if (existing) return existing;
  const [created] = await db
    .insert(accounts)
    .values({ ibAccountId: MANUAL_ACCOUNT_IB_ID, alias: "Manuell" })
    .returning();
  return created;
}
