import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

export async function GET() {
  const dbPath = path.join(process.cwd(), "data", "tradeanalyse.db");
  if (!fs.existsSync(dbPath)) {
    return NextResponse.json({ error: "Keine Datenbank gefunden" }, { status: 404 });
  }

  const buffer = fs.readFileSync(dbPath);
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="tradeanalyse-backup-${timestamp}.db"`,
    },
  });
}
