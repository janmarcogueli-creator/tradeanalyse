import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { tags } from "@/db/schema";
import { listTags } from "@/db/queries/tags";

export async function GET() {
  return NextResponse.json(await listTags());
}

export async function POST(request: Request) {
  const body = await request.json();
  const name = body.name?.trim();
  if (!name) {
    return NextResponse.json({ error: "Name erforderlich" }, { status: 400 });
  }

  const existing = await db.query.tags.findFirst({ where: eq(tags.name, name) });
  if (existing) return NextResponse.json(existing);

  const [created] = await db
    .insert(tags)
    .values({ name, color: body.color || null, category: body.category || null })
    .returning();
  return NextResponse.json(created);
}
