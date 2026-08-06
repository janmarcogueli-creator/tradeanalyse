import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { strategies } from "@/db/schema";
import { listStrategies } from "@/db/queries/strategies";

export async function GET() {
  return NextResponse.json(await listStrategies());
}

export async function POST(request: Request) {
  const body = await request.json();
  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Name erforderlich" }, { status: 400 });
  }
  const [created] = await db
    .insert(strategies)
    .values({
      name: body.name.trim(),
      description: body.description || null,
      rulesText: body.rulesText || null,
      color: body.color || null,
    })
    .returning();
  return NextResponse.json(created);
}
