/**
 * Raw <Trade> attributes as they appear in the IBKR Flex Query XML.
 * Field names/enum values per IBKR Flex Web Service v3 (Trade element under
 * FlexQueryResponse.FlexStatements.FlexStatement.Trades).
 */
export interface FlexTradeXml {
  accountId?: string;
  currency?: string;
  assetCategory?: string; // CASH|BILL|BOND|STK|OPT|WAR|FUT|FOP|CFD|FXCFD|CRYPTO|IOPT|CMDTY|FSFOP|FSOPT
  subCategory?: string; // e.g. "ETF" when assetCategory=STK
  symbol?: string;
  underlyingSymbol?: string;
  listingExchange?: string;
  exchange?: string;
  multiplier?: string;
  strike?: string;
  expiry?: string;
  putCall?: string; // P|C
  tradeID?: string;
  transactionID?: string;
  ibExecID?: string;
  ibOrderID?: string;
  brokerageOrderID?: string;
  buySell?: string; // BUY|BUY (Ca.)|SELL|SELL (Ca.)
  openCloseIndicator?: string; // O|C|C;O|-
  quantity?: string;
  tradePrice?: string;
  proceeds?: string;
  ibCommission?: string;
  ibCommissionCurrency?: string;
  netCash?: string;
  tradeDate?: string; // YYYYMMDD
  tradeTime?: string; // HHMMSS
  dateTime?: string; // combined date;time, format depends on Flex Query config
  levelOfDetail?: string;
}

export interface FlexStatement {
  accountId: string;
  fromDate?: string;
  toDate?: string;
  trades: FlexTradeXml[];
}

export type AssetCategory = "STK" | "ETF" | "OPT" | "FUT" | "FOP" | "CASH" | "BAG";

export interface NormalizedFill {
  ibExecId: string;
  ibTradeId: string | null;
  orderId: string | null;
  symbol: string;
  underlyingSymbol: string | null;
  assetCategory: AssetCategory;
  currency: string;
  exchange: string | null;
  multiplier: number;
  strike: number | null;
  expiry: string | null;
  putCall: "P" | "C" | null;
  buySell: "BUY" | "SELL";
  openClose: "O" | "C" | null;
  quantity: number;
  price: number;
  proceeds: number;
  commission: number;
  commissionCurrency: string | null;
  netCash: number;
  tradeDate: string; // ISO YYYY-MM-DD
  datetime: string; // ISO datetime
  rawJson: string;
}
