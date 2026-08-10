import { relations, sql } from "drizzle-orm";
import {
  sqliteTable,
  text,
  integer,
  real,
  primaryKey,
  uniqueIndex,
  index,
} from "drizzle-orm/sqlite-core";

const timestamps = {
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(current_timestamp)`),
};

export const accounts = sqliteTable("accounts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ibAccountId: text("ib_account_id").notNull().unique(),
  alias: text("alias"),
});

export const importBatches = sqliteTable("import_batches", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  requestedAt: text("requested_at")
    .notNull()
    .default(sql`(current_timestamp)`),
  referenceCode: text("reference_code"),
  fromDate: text("from_date"),
  toDate: text("to_date"),
  status: text("status", {
    enum: ["pending", "fetched", "parsed", "completed", "error"],
  })
    .notNull()
    .default("pending"),
  rawXmlPath: text("raw_xml_path"),
  errorMessage: text("error_message"),
  fillsImported: integer("fills_imported").notNull().default(0),
  fillsDuplicate: integer("fills_duplicate").notNull().default(0),
});

export const trades = sqliteTable(
  "trades",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    accountId: integer("account_id")
      .notNull()
      .references(() => accounts.id),
    symbol: text("symbol").notNull(),
    assetCategory: text("asset_category", {
      enum: ["STK", "ETF", "OPT", "FUT", "FOP", "CASH", "BAG"],
    }).notNull(),
    direction: text("direction", { enum: ["long", "short"] }).notNull(),
    openTime: text("open_time").notNull(),
    closeTime: text("close_time"),
    status: text("status", { enum: ["open", "closed"] })
      .notNull()
      .default("open"),
    quantity: real("quantity").notNull(),
    avgEntryPrice: real("avg_entry_price").notNull(),
    avgExitPrice: real("avg_exit_price"),
    multiplier: real("multiplier").notNull().default(1),
    grossPnl: real("gross_pnl"),
    commissions: real("commissions").notNull().default(0),
    netPnl: real("net_pnl"),
    initialRisk: real("initial_risk"),
    rMultiple: real("r_multiple"),
    holdingSeconds: integer("holding_seconds"),
    ...timestamps,
  },
  (table) => [
    index("trades_close_time_idx").on(table.closeTime),
    index("trades_symbol_idx").on(table.symbol),
  ],
);

export const fills = sqliteTable(
  "fills",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    accountId: integer("account_id")
      .notNull()
      .references(() => accounts.id),
    importBatchId: integer("import_batch_id")
      .notNull()
      .references(() => importBatches.id),
    ibExecId: text("ib_exec_id").notNull(),
    ibTradeId: text("ib_trade_id"),
    orderId: text("order_id"),
    symbol: text("symbol").notNull(),
    underlyingSymbol: text("underlying_symbol"),
    assetCategory: text("asset_category", {
      enum: ["STK", "ETF", "OPT", "FUT", "FOP", "CASH", "BAG"],
    }).notNull(),
    currency: text("currency").notNull(),
    exchange: text("exchange"),
    multiplier: real("multiplier").notNull().default(1),
    strike: real("strike"),
    expiry: text("expiry"),
    putCall: text("put_call", { enum: ["P", "C"] }),
    buySell: text("buy_sell", { enum: ["BUY", "SELL"] }).notNull(),
    openClose: text("open_close", { enum: ["O", "C"] }),
    quantity: real("quantity").notNull(),
    price: real("price").notNull(),
    proceeds: real("proceeds").notNull(),
    commission: real("commission").notNull().default(0),
    commissionCurrency: text("commission_currency"),
    netCash: real("net_cash").notNull(),
    tradeDate: text("trade_date").notNull(),
    datetime: text("datetime").notNull(),
    tradeGroupId: integer("trade_group_id").references(() => trades.id),
    rawJson: text("raw_json").notNull(),
  },
  (table) => [
    uniqueIndex("fills_account_exec_idx").on(table.accountId, table.ibExecId),
    index("fills_symbol_trade_date_idx").on(table.symbol, table.tradeDate),
  ],
);

export const strategies = sqliteTable("strategies", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  rulesText: text("rules_text"),
  status: text("status", { enum: ["active", "archived"] })
    .notNull()
    .default("active"),
  color: text("color"),
  category: text("category"),
});

export const tradeStrategies = sqliteTable(
  "trade_strategies",
  {
    tradeId: integer("trade_id")
      .notNull()
      .references(() => trades.id),
    strategyId: integer("strategy_id")
      .notNull()
      .references(() => strategies.id),
  },
  (table) => [
    primaryKey({ columns: [table.tradeId, table.strategyId] }),
    index("trade_strategies_strategy_idx").on(table.strategyId),
  ],
);

export const tags = sqliteTable("tags", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  color: text("color"),
  category: text("category"),
});

export const tradeTags = sqliteTable(
  "trade_tags",
  {
    tradeId: integer("trade_id")
      .notNull()
      .references(() => trades.id),
    tagId: integer("tag_id")
      .notNull()
      .references(() => tags.id),
  },
  (table) => [
    primaryKey({ columns: [table.tradeId, table.tagId] }),
    index("trade_tags_tag_idx").on(table.tagId),
  ],
);

export const notes = sqliteTable("notes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tradeId: integer("trade_id")
    .notNull()
    .references(() => trades.id),
  bodyMarkdown: text("body_markdown").notNull(),
  ...timestamps,
});

export const attachments = sqliteTable("attachments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tradeId: integer("trade_id").references(() => trades.id),
  noteId: integer("note_id").references(() => notes.id),
  filePath: text("file_path").notNull(),
  type: text("type").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

export const insights = sqliteTable("insights", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ruleKey: text("rule_key").notNull(),
  severity: text("severity", { enum: ["info", "warning", "critical"] })
    .notNull()
    .default("info"),
  title: text("title").notNull(),
  description: text("description").notNull(),
  scopeJson: text("scope_json"),
  computedAt: text("computed_at")
    .notNull()
    .default(sql`(current_timestamp)`),
  dismissed: integer("dismissed", { mode: "boolean" }).notNull().default(false),
});

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export const tradesRelations = relations(trades, ({ many }) => ({
  fills: many(fills),
  notes: many(notes),
  attachments: many(attachments),
  tradeStrategies: many(tradeStrategies),
  tradeTags: many(tradeTags),
}));

export const fillsRelations = relations(fills, ({ one }) => ({
  account: one(accounts, { fields: [fills.accountId], references: [accounts.id] }),
  trade: one(trades, { fields: [fills.tradeGroupId], references: [trades.id] }),
}));

export const strategiesRelations = relations(strategies, ({ many }) => ({
  tradeStrategies: many(tradeStrategies),
}));

export const tradeStrategiesRelations = relations(tradeStrategies, ({ one }) => ({
  trade: one(trades, { fields: [tradeStrategies.tradeId], references: [trades.id] }),
  strategy: one(strategies, { fields: [tradeStrategies.strategyId], references: [strategies.id] }),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  tradeTags: many(tradeTags),
}));

export const tradeTagsRelations = relations(tradeTags, ({ one }) => ({
  trade: one(trades, { fields: [tradeTags.tradeId], references: [trades.id] }),
  tag: one(tags, { fields: [tradeTags.tagId], references: [tags.id] }),
}));

export const notesRelations = relations(notes, ({ one, many }) => ({
  trade: one(trades, { fields: [notes.tradeId], references: [trades.id] }),
  attachments: many(attachments),
}));

export const attachmentsRelations = relations(attachments, ({ one }) => ({
  trade: one(trades, { fields: [attachments.tradeId], references: [trades.id] }),
  note: one(notes, { fields: [attachments.noteId], references: [notes.id] }),
}));
