import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { trades } from "@/db/schema";
import { getOrCreateManualAccount } from "@/db/queries/accounts";

interface ManualTradeBody {
  symbol: string;
  assetCategory: string;
  direction: "long" | "short";
  quantity: number;
  entryPrice: number;
  entryTime: string;
  exitPrice?: number | null;
  exitTime?: string | null;
  commissions?: number;
  multiplier?: number;
  stopLoss?: number | null;
}

export async function POST(request: Request) {
  const body = (await request.json()) as ManualTradeBody;

  if (!body.symbol?.trim() || !body.assetCategory || !body.direction || !body.entryTime) {
    return NextResponse.json({ error: "Symbol, Asset-Klasse, Richtung und Entry-Zeit sind erforderlich" }, { status: 400 });
  }
  if (!Number.isFinite(body.quantity) || body.quantity <= 0) {
    return NextResponse.json({ error: "Menge muss größer als 0 sein" }, { status: 400 });
  }
  if (!Number.isFinite(body.entryPrice)) {
    return NextResponse.json({ error: "Entry-Preis erforderlich" }, { status: 400 });
  }

  const hasExit = body.exitPrice != null && body.exitTime != null;
  const quantity = body.quantity;
  const multiplier = body.multiplier && body.multiplier > 0 ? body.multiplier : 1;
  const commissions = body.commissions ?? 0;
  const directionSign = body.direction === "long" ? 1 : -1;

  // Same formula groupTrades.ts uses for imported fills, so manual and
  // imported trades stay comparable in the metrics engine.
  const grossPnl = hasExit ? (body.exitPrice! - body.entryPrice) * directionSign * quantity * multiplier : null;
  const netPnl = grossPnl !== null ? grossPnl - commissions : null;
  const holdingSeconds = hasExit
    ? Math.round((Date.parse(body.exitTime!) - Date.parse(body.entryTime)) / 1000)
    : null;

  const initialRisk =
    body.stopLoss != null ? Math.abs(body.entryPrice - body.stopLoss) * quantity * multiplier : null;
  const rMultiple = hasExit && initialRisk && initialRisk > 0 ? netPnl! / initialRisk : null;

  const account = await getOrCreateManualAccount();

  const [created] = await db
    .insert(trades)
    .values({
      accountId: account.id,
      symbol: body.symbol.trim().toUpperCase(),
      assetCategory: body.assetCategory as (typeof trades.$inferInsert)["assetCategory"],
      direction: body.direction,
      openTime: body.entryTime,
      closeTime: hasExit ? body.exitTime : null,
      status: hasExit ? "closed" : "open",
      quantity,
      avgEntryPrice: body.entryPrice,
      avgExitPrice: hasExit ? body.exitPrice : null,
      multiplier,
      grossPnl,
      commissions,
      netPnl,
      initialRisk,
      rMultiple,
      holdingSeconds,
    })
    .returning();

  return NextResponse.json(created);
}
