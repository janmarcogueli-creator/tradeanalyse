import { NextResponse } from "next/server";
import { importFlexStatement } from "@/lib/import/importFlexStatement";
import { FlexApiError } from "@/lib/ibkr/flexClient";

export async function POST() {
  try {
    const summary = await importFlexStatement();
    return NextResponse.json(summary);
  } catch (err) {
    if (err instanceof FlexApiError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: 502 },
      );
    }
    console.error("[api/import/flex]", err);
    const cause = err instanceof Error && err.cause instanceof Error ? `: ${err.cause.message}` : "";
    const message = err instanceof Error ? `${err.message}${cause}` : "Import failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
