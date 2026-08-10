import { parse } from "csv-parse/sync";
import type { FlexStatement, FlexTradeXml } from "./types";

// IBKR's Flex Query CSV export uses PascalCase/slash column names instead of
// the XML attribute names — same underlying data, different label. Worse,
// different report types (Trade Confirmation vs Activity Statement) use
// *different* header names for the same field (e.g. "ExecID" vs "IBExecID",
// "Date/Time" vs "DateTime", "Price" vs "TradePrice", "Commission" vs
// "IBCommission") — observed directly from both report types on a real
// account. Users also pick which columns to include, so presence varies
// too. We map by header name with a list of accepted aliases per field,
// first match wins; column order doesn't matter.
const COLUMN_ALIASES: [keyof FlexTradeXml, string[]][] = [
  ["currency", ["CurrencyPrimary"]],
  ["assetCategory", ["AssetClass"]],
  ["subCategory", ["SubCategory"]],
  ["symbol", ["Symbol"]],
  ["listingExchange", ["ListingExchange"]],
  ["exchange", ["Exchange"]],
  ["underlyingSymbol", ["UnderlyingSymbol"]],
  ["multiplier", ["Multiplier"]],
  ["strike", ["Strike"]],
  ["expiry", ["Expiry"]],
  ["putCall", ["Put/Call"]],
  ["tradeID", ["TradeID"]],
  ["ibOrderID", ["IBOrderID", "OrderID"]],
  ["brokerageOrderID", ["BrokerageOrderID"]],
  ["ibExecID", ["IBExecID", "ExecID"]],
  ["buySell", ["Buy/Sell"]],
  ["openCloseIndicator", ["Open/CloseIndicator"]],
  ["dateTime", ["DateTime", "Date/Time"]],
  ["tradeDate", ["TradeDate"]],
  ["quantity", ["Quantity"]],
  ["tradePrice", ["TradePrice", "Price"]],
  ["proceeds", ["Proceeds"]],
  ["ibCommission", ["IBCommission", "Commission"]],
  ["ibCommissionCurrency", ["IBCommissionCurrency", "CommissionCurrency"]],
  ["netCash", ["NetCash"]],
  ["levelOfDetail", ["LevelOfDetail"]],
];

function toFlexTradeXml(record: Record<string, string>): FlexTradeXml {
  const trade: Partial<FlexTradeXml> = {};
  for (const [field, aliases] of COLUMN_ALIASES) {
    for (const header of aliases) {
      const value = record[header];
      if (value !== undefined && value !== "") {
        (trade as Record<string, string>)[field] = value;
        break;
      }
    }
  }
  return trade as FlexTradeXml;
}

/** Parses an IBKR Flex Query CSV export (Trade Confirmation or Activity
 * Statement report) into the same FlexStatement[] shape parseFlexXml
 * produces, so the rest of the import pipeline (mapFlexFields, dedupe,
 * grouping) is format-agnostic. */
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
