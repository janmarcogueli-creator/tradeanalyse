import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { parseFlexXml } from "./parseFlexXml";

const fixture = fs.readFileSync(
  path.join(process.cwd(), "data/fixtures/sample-flex-statement.xml"),
  "utf-8",
);

describe("parseFlexXml", () => {
  it("parses one statement with the expected account and trade count", () => {
    const statements = parseFlexXml(fixture);
    expect(statements).toHaveLength(1);
    expect(statements[0].accountId).toBe("U1234567");
    expect(statements[0].trades).toHaveLength(11);
  });

  it("keeps all Trade attributes as strings on each row", () => {
    const [statement] = parseFlexXml(fixture);
    const first = statement.trades[0];
    expect(first.symbol).toBe("AAPL");
    expect(first.assetCategory).toBe("STK");
    expect(first.ibExecID).toBe("0001f4a7.aapl.001");
    expect(first.buySell).toBe("BUY");
    expect(first.quantity).toBe("100");
  });

  it("throws on a document that isn't a FlexQueryResponse", () => {
    expect(() => parseFlexXml("<Foo></Foo>")).toThrow();
  });
});
