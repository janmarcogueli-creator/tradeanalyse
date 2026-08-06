import { NextResponse } from "next/server";
import { dismissInsight } from "@/db/queries/insights";

export async function PATCH(
  _request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  await dismissInsight(Number(id));
  return NextResponse.json({ ok: true });
}
