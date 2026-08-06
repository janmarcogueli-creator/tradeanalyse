import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { parseFlexCsv, looksLikeFlexCsv } from "./parseFlexCsv";

const fixture = fs.readFileSync(
  path.join(process.cwd(), "data/fixtures/sample-flex-statement.csv"),
  "utf-8",
);

describe("looksLikeFlexCsv", () => {
  it("detects the Flex CSV export", () => {
    expect(looksLikeFlexCsv(fixture)).toBe(true);
  });

  it("does not misdetect XML as CSV", () => {
    expect(looksLikeFlexCsv("<FlexQueryResponse></FlexQueryResponse>")).toBe(false);
  });
});

describe("parseFlexCsv", () => {
  it("parses one statement with the expected account and trade count", () => {
    const statements = parseFlexCsv(fixture);
    expect(statements).toHaveLength(1);
    expect(statements[0].accountId).toBe("U1234567");
    expect(statements[0].trades).toHaveLength(11);
  });

  it("maps CSV column names to the FlexTradeXml field names", () => {
    const [statement] = parseFlexCsv(fixture);
    const first = statement.trades[0];
    expect(first.symbol).toBe("AAPL");
    expect(first.assetCategory).toBe("STK");
    expect(first.ibExecID).toBe("0001f4a7.aapl.001");
    expect(first.buySell).toBe("BUY");
    expect(first.quantity).toBe("100");
    expect(first.dateTime).toBe("20240102;093500");
  });

  it("maps ETF via AssetClass=STK + SubCategory=ETF, same as the XML format", () => {
    const [statement] = parseFlexCsv(fixture);
    const spy = statement.trades.find((t) => t.symbol === "SPY")!;
    expect(spy.assetCategory).toBe("STK");
    expect(spy.subCategory).toBe("ETF");
  });

  it("leaves optional empty columns undefined rather than empty strings", () => {
    const [statement] = parseFlexCsv(fixture);
    const first = statement.trades[0];
    expect(first.strike).toBeUndefined();
    expect(first.expiry).toBeUndefined();
  });

  it("skips rows without an account id", () => {
    const csv = `"ClientAccountID","Symbol"\n"","AAPL"\n`;
    expect(parseFlexCsv(csv)).toEqual([]);
  });
});
