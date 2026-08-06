import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { attachments } from "@/db/schema";

export async function POST(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const tradeId = Number(id);

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Keine Datei hochgeladen" }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Nur Bilddateien erlaubt" }, { status: 400 });
  }

  const attachmentsDir = path.join(process.cwd(), "data", "attachments", String(tradeId));
  fs.mkdirSync(attachmentsDir, { recursive: true });

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filename = `${Date.now()}-${safeName}`;
  const filePath = path.join(attachmentsDir, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(filePath, buffer);

  const [created] = await db
    .insert(attachments)
    .values({
      tradeId,
      filePath: path.relative(process.cwd(), filePath),
      type: file.type,
    })
    .returning();

  return NextResponse.json(created);
}
