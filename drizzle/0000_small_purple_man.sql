CREATE TABLE `store_records` (
	`owner` text NOT NULL,
	`kind` text NOT NULL,
	`id` text NOT NULL,
	`body` text NOT NULL,
	`updated` integer NOT NULL,
	PRIMARY KEY(`owner`, `kind`, `id`)
);
--> statement-breakpoint
CREATE INDEX `records_owner_kind` ON `store_records` (`owner`,`kind`);