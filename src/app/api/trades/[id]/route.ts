import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { notes, tags, tradeStrategies, tradeTags } from "@/db/schema";

type Body =
  | { action: "addNote"; body: string }
  | { action: "toggleTag"; tagId?: number; tagName?: string }
  | { action: "toggleStrategy"; strategyId: number };

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const tradeId = Number(id);
  const body = (await request.json()) as Body;

  if (body.action === "addNote") {
    if (!body.body?.trim()) {
      return NextResponse.json({ error: "Notiz darf nicht leer sein" }, { status: 400 });
    }
    const [note] = await db.insert(notes).values({ tradeId, bodyMarkdown: body.body }).returning();
    return NextResponse.json(note);
  }

  if (body.action === "toggleTag") {
    let tagId = body.tagId;
    if (!tagId && body.tagName?.trim()) {
      const existing = await db.query.tags.findFirst({ where: eq(tags.name, body.tagName.trim()) });
      if (existing) {
        tagId = existing.id;
      } else {
        const [created] = await db.insert(tags).values({ name: body.tagName.trim() }).returning();
        tagId = created.id;
      }
    }
    if (!tagId) return NextResponse.json({ error: "tagId oder tagName erforderlich" }, { status: 400 });

    const existingLink = await db.query.tradeTags.findFirst({
      where: and(eq(tradeTags.tradeId, tradeId), eq(tradeTags.tagId, tagId)),
    });
    if (existingLink) {
      await db.delete(tradeTags).where(and(eq(tradeTags.tradeId, tradeId), eq(tradeTags.tagId, tagId)));
      return NextResponse.json({ tagId, linked: false });
    }
    await db.insert(tradeTags).values({ tradeId, tagId });
    return NextResponse.json({ tagId, linked: true });
  }

  if (body.action === "toggleStrategy") {
    const { strategyId } = body;
    const existingLink = await db.query.tradeStrategies.findFirst({
      where: and(eq(tradeStrategies.tradeId, tradeId), eq(tradeStrategies.strategyId, strategyId)),
    });
    if (existingLink) {
      await db
        .delete(tradeStrategies)
        .where(and(eq(tradeStrategies.tradeId, tradeId), eq(tradeStrategies.strategyId, strategyId)));
      return NextResponse.json({ strategyId, linked: false });
    }
    await db.insert(tradeStrategies).values({ tradeId, strategyId });
    return NextResponse.json({ strategyId, linked: true });
  }

  return NextResponse.json({ error: "Unbekannte action" }, { status: 400 });
}
