import type { AssetCategory, FlexTradeXml, NormalizedFill } from "./types";

export class MappingError extends Error {}

const SUPPORTED_CATEGORIES = new Set(["STK", "OPT", "FUT", "FOP", "CASH"]);

function mapAssetCategory(raw: FlexTradeXml): AssetCategory {
  const category = raw.assetCategory;
  if (!category || !SUPPORTED_CATEGORIES.has(category)) {
    throw new MappingError(
      `Unsupported assetCategory "${category}" for symbol ${raw.symbol ?? "?"} (execId ${raw.ibExecID ?? "?"})`,
    );
  }
  if (category === "STK" && raw.subCategory === "ETF") return "ETF";
  return category as AssetCategory;
}

function mapBuySell(raw: FlexTradeXml): "BUY" | "SELL" {
  const value = raw.buySell;
  if (value?.startsWith("BUY")) {
    if (value !== "BUY") {
      console.warn(
        `[ibkr] Trade cancellation buySell="${value}" for execId ${raw.ibExecID} imported as-is; MVP does not reconcile against the original trade.`,
      );
    }
    return "BUY";
  }
  if (value?.startsWith("SELL")) {
    if (value !== "SELL") {
      console.warn(
        `[ibkr] Trade cancellation buySell="${value}" for execId ${raw.ibExecID} imported as-is; MVP does not reconcile against the original trade.`,
      );
    }
    return "SELL";
  }
  throw new MappingError(`Invalid buySell "${value}" for execId ${raw.ibExecID ?? "?"}`);
}

function mapOpenClose(raw: FlexTradeXml): "O" | "C" | null {
  if (raw.openCloseIndicator === "O") return "O";
  if (raw.openCloseIndicator === "C") return "C";
  return null;
}

function mapPutCall(raw: FlexTradeXml): "P" | "C" | null {
  if (raw.putCall === "P" || raw.putCall === "C") return raw.putCall;
  return null;
}

// IBKR's own report types disagree on date format: the Trade Confirmation
// report (XML and CSV) uses compact "YYYYMMDD", while the Activity Statement
// CSV uses dashed "YYYY-MM-DD" — normalize both to ISO.
function normalizeDate(raw: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  if (/^\d{8}$/.test(raw)) return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
  throw new MappingError(`Unrecognized date format "${raw}"`);
}

// Same disagreement for the combined date+time field: Trade Confirmation
// uses "YYYYMMDD;HHMMSS", Activity Statement uses "YYYY-MM-DD HH:MM:SS".
// Returns compact "HHMMSS" (matching the legacy TradeTime column format) so
// callers only ever deal with one shape.
function extractTime(dateTimeRaw: string): string | undefined {
  if (dateTimeRaw.includes(";")) {
    const time = dateTimeRaw.split(";")[1]?.trim().split(" ")[0];
    return time || undefined;
  }
  const match = /\d{4}-\d{2}-\d{2}\s+(\d{2}):(\d{2}):(\d{2})/.exec(dateTimeRaw);
  return match ? `${match[1]}${match[2]}${match[3]}` : undefined;
}

function mapDatetime(raw: FlexTradeXml): { tradeDate: string; datetime: string } {
  if (!raw.tradeDate) {
    throw new MappingError(`Missing tradeDate for execId ${raw.ibExecID ?? "?"}`);
  }
  const tradeDate = normalizeDate(raw.tradeDate);

  const time = raw.dateTime ? extractTime(raw.dateTime) : raw.tradeTime;

  const datetime = time
    ? `${tradeDate}T${time.slice(0, 2)}:${time.slice(2, 4)}:${time.slice(4, 6)}`
    : `${tradeDate}T00:00:00`;

  return { tradeDate, datetime };
}

function toNumber(value: string | undefined, fieldName: string, execId: string | undefined): number {
  if (value === undefined || value === "") {
    throw new MappingError(`Missing ${fieldName} for execId ${execId ?? "?"}`);
  }
  const n = Number(value);
  if (Number.isNaN(n)) {
    throw new MappingError(`Invalid ${fieldName} "${value}" for execId ${execId ?? "?"}`);
  }
  return n;
}

export function mapFlexTrade(raw: FlexTradeXml): NormalizedFill {
  if (!raw.ibExecID) {
    throw new MappingError("Trade row missing ibExecID (unique key) — cannot import");
  }

  const { tradeDate, datetime } = mapDatetime(raw);

  return {
    ibExecId: raw.ibExecID,
    ibTradeId: raw.tradeID ?? null,
    orderId: raw.ibOrderID ?? raw.brokerageOrderID ?? null,
    symbol: raw.symbol ?? "",
    underlyingSymbol: raw.underlyingSymbol || null,
    assetCategory: mapAssetCategory(raw),
    currency: raw.currency ?? "USD",
    exchange: raw.exchange || raw.listingExchange || null,
    multiplier: raw.multiplier ? Number(raw.multiplier) : 1,
    strike: raw.strike ? Number(raw.strike) : null,
    expiry: raw.expiry ? normalizeDate(raw.expiry) : null,
    putCall: mapPutCall(raw),
    buySell: mapBuySell(raw),
    openClose: mapOpenClose(raw),
    // Some report types (Activity Statement) sign quantity by direction
    // (negative for sells) instead of leaving it an unsigned magnitude —
    // buySell is always the authoritative direction, so normalize to abs().
    quantity: Math.abs(toNumber(raw.quantity, "quantity", raw.ibExecID)),
    price: toNumber(raw.tradePrice, "tradePrice", raw.ibExecID),
    proceeds: toNumber(raw.proceeds, "proceeds", raw.ibExecID),
    commission: Math.abs(toNumber(raw.ibCommission, "ibCommission", raw.ibExecID)),
    commissionCurrency: raw.ibCommissionCurrency || null,
    netCash: toNumber(raw.netCash, "netCash", raw.ibExecID),
    tradeDate,
    datetime,
    rawJson: JSON.stringify(raw),
  };
}
