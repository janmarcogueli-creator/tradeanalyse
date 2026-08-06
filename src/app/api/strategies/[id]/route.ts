import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { strategies } from "@/db/schema";

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const body = await request.json();

  const values: Partial<typeof strategies.$inferInsert> = {};
  if (body.name !== undefined) values.name = body.name;
  if (body.description !== undefined) values.description = body.description;
  if (body.rulesText !== undefined) values.rulesText = body.rulesText;
  if (body.color !== undefined) values.color = body.color;
  if (body.status !== undefined) values.status = body.status;

  const [updated] = await db
    .update(strategies)
    .set(values)
    .where(eq(strategies.id, Number(id)))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}
