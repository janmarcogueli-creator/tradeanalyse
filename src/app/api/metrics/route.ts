import { NextResponse } from "next/server";
import { getFilteredClosedTrades } from "@/db/queries/trades";
import { buildDashboardPayload } from "@/lib/metrics/buildDashboardPayload";
import { parseFilterParams } from "@/lib/filters/parseFilterParams";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filter = parseFilterParams(searchParams);

  const trades = await getFilteredClosedTrades(filter);
  return NextResponse.json(buildDashboardPayload(trades));
}
