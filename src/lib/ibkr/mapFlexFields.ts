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

function ymdToIso(ymd: string): string {
  return `${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6, 8)}`;
}

function mapDatetime(raw: FlexTradeXml): { tradeDate: string; datetime: string } {
  if (!raw.tradeDate) {
    throw new MappingError(`Missing tradeDate for execId ${raw.ibExecID ?? "?"}`);
  }
  const tradeDate = ymdToIso(raw.tradeDate);

  let time = raw.tradeTime;
  if (raw.dateTime) {
    const parts = raw.dateTime.split(";");
    if (parts[1]) time = parts[1].trim().split(" ")[0];
  }

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
    expiry: raw.expiry ? ymdToIso(raw.expiry) : null,
    putCall: mapPutCall(raw),
    buySell: mapBuySell(raw),
    openClose: mapOpenClose(raw),
    quantity: toNumber(raw.quantity, "quantity", raw.ibExecID),
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
