import { NextResponse } from "next/server";
import { SETTINGS_KEYS, getSetting, setSetting } from "@/db/queries/settings";

function mask(value: string | null): string | null {
  if (!value) return null;
  return value.length <= 4 ? "••••" : `••••${value.slice(-4)}`;
}

export async function GET() {
  const [token, queryId] = await Promise.all([
    getSetting(SETTINGS_KEYS.ibkrFlexToken),
    getSetting(SETTINGS_KEYS.ibkrFlexQueryId),
  ]);

  return NextResponse.json({
    tokenSet: !!token || !!process.env.IBKR_FLEX_TOKEN,
    tokenSource: token ? "settings" : process.env.IBKR_FLEX_TOKEN ? "env" : null,
    tokenMasked: mask(token),
    queryIdSet: !!queryId || !!process.env.IBKR_FLEX_QUERY_ID,
    queryIdSource: queryId ? "settings" : process.env.IBKR_FLEX_QUERY_ID ? "env" : null,
    queryIdMasked: mask(queryId ?? process.env.IBKR_FLEX_QUERY_ID ?? null),
  });
}

export async function PATCH(request: Request) {
  const body = await request.json();

  if (typeof body.token === "string" && body.token.trim()) {
    await setSetting(SETTINGS_KEYS.ibkrFlexToken, body.token.trim());
  }
  if (typeof body.queryId === "string" && body.queryId.trim()) {
    await setSetting(SETTINGS_KEYS.ibkrFlexQueryId, body.queryId.trim());
  }

  return NextResponse.json({ ok: true });
}
