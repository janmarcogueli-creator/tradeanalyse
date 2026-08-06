import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { attachments } from "@/db/schema";

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const attachment = await db.query.attachments.findFirst({
    where: eq(attachments.id, Number(id)),
  });
  if (!attachment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const absolutePath = path.join(process.cwd(), attachment.filePath);
  const buffer = fs.readFileSync(absolutePath);
  return new NextResponse(new Uint8Array(buffer), {
    headers: { "Content-Type": attachment.type },
  });
}
