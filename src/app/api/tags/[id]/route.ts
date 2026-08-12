import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { tags } from "@/db/schema";

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const body = await request.json();

  const values: Partial<typeof tags.$inferInsert> = {};
  if (body.name !== undefined) values.name = body.name;
  if (body.color !== undefined) values.color = body.color;
  if (body.category !== undefined) values.category = body.category;

  const [updated] = await db
    .update(tags)
    .set(values)
    .where(eq(tags.id, Number(id)))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}
