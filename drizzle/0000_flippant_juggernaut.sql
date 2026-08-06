CREATE TABLE `accounts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ib_account_id` text NOT NULL,
	`alias` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `accounts_ib_account_id_unique` ON `accounts` (`ib_account_id`);--> statement-breakpoint
CREATE TABLE `attachments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`trade_id` integer,
	`note_id` integer,
	`file_path` text NOT NULL,
	`type` text NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`trade_id`) REFERENCES `trades`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`note_id`) REFERENCES `notes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `fills` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`account_id` integer NOT NULL,
	`import_batch_id` integer NOT NULL,
	`ib_exec_id` text NOT NULL,
	`ib_trade_id` text,
	`order_id` text,
	`symbol` text NOT NULL,
	`underlying_symbol` text,
	`asset_category` text NOT NULL,
	`currency` text NOT NULL,
	`exchange` text,
	`multiplier` real DEFAULT 1 NOT NULL,
	`strike` real,
	`expiry` text,
	`put_call` text,
	`buy_sell` text NOT NULL,
	`open_close` text,
	`quantity` real NOT NULL,
	`price` real NOT NULL,
	`proceeds` real NOT NULL,
	`commission` real DEFAULT 0 NOT NULL,
	`commission_currency` text,
	`net_cash` real NOT NULL,
	`trade_date` text NOT NULL,
	`datetime` text NOT NULL,
	`trade_group_id` integer,
	`raw_json` text NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`import_batch_id`) REFERENCES `import_batches`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`trade_group_id`) REFERENCES `trades`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `fills_account_exec_idx` ON `fills` (`account_id`,`ib_exec_id`);--> statement-breakpoint
CREATE INDEX `fills_symbol_trade_date_idx` ON `fills` (`symbol`,`trade_date`);--> statement-breakpoint
CREATE TABLE `import_batches` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`requested_at` text DEFAULT (current_timestamp) NOT NULL,
	`reference_code` text,
	`from_date` text,
	`to_date` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`raw_xml_path` text,
	`error_message` text,
	`fills_imported` integer DEFAULT 0 NOT NULL,
	`fills_duplicate` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `insights` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`rule_key` text NOT NULL,
	`severity` text DEFAULT 'info' NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`scope_json` text,
	`computed_at` text DEFAULT (current_timestamp) NOT NULL,
	`dismissed` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `notes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`trade_id` integer NOT NULL,
	`body_markdown` text NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`trade_id`) REFERENCES `trades`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `strategies` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`rules_text` text,
	`status` text DEFAULT 'active' NOT NULL,
	`color` text
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`color` text,
	`category` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tags_name_unique` ON `tags` (`name`);--> statement-breakpoint
CREATE TABLE `trade_strategies` (
	`trade_id` integer NOT NULL,
	`strategy_id` integer NOT NULL,
	PRIMARY KEY(`trade_id`, `strategy_id`),
	FOREIGN KEY (`trade_id`) REFERENCES `trades`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`strategy_id`) REFERENCES `strategies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `trade_strategies_strategy_idx` ON `trade_strategies` (`strategy_id`);--> statement-breakpoint
CREATE TABLE `trade_tags` (
	`trade_id` integer NOT NULL,
	`tag_id` integer NOT NULL,
	PRIMARY KEY(`trade_id`, `tag_id`),
	FOREIGN KEY (`trade_id`) REFERENCES `trades`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `trade_tags_tag_idx` ON `trade_tags` (`tag_id`);--> statement-breakpoint
CREATE TABLE `trades` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`account_id` integer NOT NULL,
	`symbol` text NOT NULL,
	`asset_category` text NOT NULL,
	`direction` text NOT NULL,
	`open_time` text NOT NULL,
	`close_time` text,
	`status` text DEFAULT 'open' NOT NULL,
	`quantity` real NOT NULL,
	`avg_entry_price` real NOT NULL,
	`avg_exit_price` real,
	`multiplier` real DEFAULT 1 NOT NULL,
	`gross_pnl` real,
	`commissions` real DEFAULT 0 NOT NULL,
	`net_pnl` real,
	`initial_risk` real,
	`r_multiple` real,
	`holding_seconds` integer,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `trades_close_time_idx` ON `trades` (`close_time`);--> statement-breakpoint
CREATE INDEX `trades_symbol_idx` ON `trades` (`symbol`);