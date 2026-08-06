import type { FilterState } from "./types";

/** Converts a Next.js server-component `searchParams` object into the
 * URLSearchParams shape parseFilterParams expects. */
export function filterStateFromSearchParams(
  params: { [key: string]: string | string[] | undefined },
): FilterState {
  const usp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") usp.set(key, value);
  }
  return parseFilterParams(usp);
}

/** Parses the shared dashboard/metrics query-string shape (used by both the
 * server-rendered dashboard pages and the /api/metrics route) into a FilterState. */
export function parseFilterParams(params: URLSearchParams): FilterState {
  const strategyIds = params.get("strategyIds");
  const assetClasses = params.get("assetClasses");
  const symbols = params.get("symbols");
  const tagIds = params.get("tagIds");

  return {
    dateFrom: params.get("dateFrom") ?? undefined,
    dateTo: params.get("dateTo") ?? undefined,
    strategyIds: strategyIds ? strategyIds.split(",").map(Number) : undefined,
    assetClasses: assetClasses ? assetClasses.split(",") : undefined,
    symbols: symbols ? symbols.split(",") : undefined,
    tagIds: tagIds ? tagIds.split(",").map(Number) : undefined,
  };
}
