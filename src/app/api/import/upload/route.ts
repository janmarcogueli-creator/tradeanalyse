import { NextResponse } from "next/server";
import { importManualFile } from "@/lib/import/importManualFile";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  const xml = await file.text();

  try {
    const summary = await importManualFile(xml);
    return NextResponse.json(summary);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Import failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
