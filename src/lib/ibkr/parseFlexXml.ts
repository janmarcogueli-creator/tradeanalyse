import { XMLParser } from "fast-xml-parser";
import type { FlexStatement, FlexTradeXml } from "./types";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  parseAttributeValue: false,
  textNodeName: "#text",
});

function asArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

/**
 * Parses a raw IBKR Flex Query statement (FlexQueryResponse XML) into one
 * FlexStatement per account (a query can cover multiple accounts).
 */
export function parseFlexXml(xml: string): FlexStatement[] {
  const doc = parser.parse(xml);
  const response = doc.FlexQueryResponse;
  if (!response) {
    throw new Error("Not a valid FlexQueryResponse document");
  }

  const statements = asArray(response.FlexStatements?.FlexStatement);

  return statements.map((stmt) => ({
    accountId: stmt.accountId,
    fromDate: stmt.fromDate,
    toDate: stmt.toDate,
    trades: asArray<FlexTradeXml>(stmt.Trades?.Trade),
  }));
}
