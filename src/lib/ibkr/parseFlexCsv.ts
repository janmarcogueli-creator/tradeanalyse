import { parse } from "csv-parse/sync";
import type { FlexStatement, FlexTradeXml } from "./types";

// IBKR's Flex Query CSV export uses PascalCase/slash column names instead of
// the XML attribute names — same underlying data, different label. Users
// pick which columns to include in Client Portal, so column order (and even
// presence) varies; we map by header name, not position.
const COLUMN_MAP: Record<string, keyof FlexTradeXml> = {
  ClientAccountID: "accountId",
  CurrencyPrimary: "currency",
  AssetClass: "assetCategory",
  SubCategory: "subCategory",
  Symbol: "symbol",
  ListingExchange: "listingExchange",
  Exchange: "exchange",
  UnderlyingSymbol: "underlyingSymbol",
  Multiplier: "multiplier",
  Strike: "strike",
  Expiry: "expiry",
  "Put/Call": "putCall",
  TradeID: "tradeID",
  OrderID: "ibOrderID",
  BrokerageOrderID: "brokerageOrderID",
  ExecID: "ibExecID",
  "Buy/Sell": "buySell",
  "Date/Time": "dateTime",
  TradeDate: "tradeDate",
  Quantity: "quantity",
  Price: "tradePrice",
  Proceeds: "proceeds",
  Commission: "ibCommission",
  CommissionCurrency: "ibCommissionCurrency",
  NetCash: "netCash",
  LevelOfDetail: "levelOfDetail",
};

function toFlexTradeXml(record: Record<string, string>): FlexTradeXml {
  const trade: Partial<FlexTradeXml> = {};
  for (const [csvColumn, field] of Object.entries(COLUMN_MAP)) {
    const value = record[csvColumn];
    if (value !== undefined && value !== "") {
      (trade as Record<string, string>)[field] = value;
    }
  }
  return trade as FlexTradeXml;
}

/** Parses IBKR's Flex Query CSV export (Trade Confirmation report) into the
 * same FlexStatement[] shape parseFlexXml produces, so the rest of the
 * import pipeline (mapFlexFields, dedupe, grouping) is format-agnostic. */
export function parseFlexCsv(csv: string): FlexStatement[] {
  const records = parse(csv, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
    trim: true,
  }) as Record<string, string>[];

  const byAccount = new Map<string, FlexTradeXml[]>();
  for (const record of records) {
    const accountId = record.ClientAccountID;
    if (!accountId) continue; // skip malformed/summary rows without an account
    const list = byAccount.get(accountId) ?? [];
    list.push(toFlexTradeXml(record));
    byAccount.set(accountId, list);
  }

  return Array.from(byAccount.entries()).map(([accountId, trades]) => {
    const tradeDates = trades.map((t) => t.tradeDate).filter((d): d is string => !!d);
    return {
      accountId,
      fromDate: tradeDates.length ? tradeDates.reduce((a, b) => (a < b ? a : b)) : undefined,
      toDate: tradeDates.length ? tradeDates.reduce((a, b) => (a > b ? a : b)) : undefined,
      trades,
    };
  });
}

/** True if the content looks like the Flex CSV export rather than XML. */
export function looksLikeFlexCsv(content: string): boolean {
  const trimmed = content.trimStart();
  return !trimmed.startsWith("<") && trimmed.includes("ClientAccountID");
}
