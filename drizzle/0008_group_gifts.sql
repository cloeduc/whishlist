CREATE TABLE `group_gift_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`group_gift_id` text NOT NULL,
	`user_id` text,
	`author_name` text,
	`body` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`group_gift_id`) REFERENCES `group_gifts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `group_gift_messages_group_gift_id` ON `group_gift_messages` (`group_gift_id`);--> statement-breakpoint
CREATE TABLE `group_gifts` (
	`id` text PRIMARY KEY NOT NULL,
	`wishlist_id` text NOT NULL,
	`item_id` text NOT NULL,
	`token` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`created_at` text NOT NULL,
	`completed_at` text,
	FOREIGN KEY (`wishlist_id`) REFERENCES `wishlists`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`item_id`) REFERENCES `items`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "group_gifts_status" CHECK("group_gifts"."status" in ('open', 'complete'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `group_gifts_item_id_unique` ON `group_gifts` (`item_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `group_gifts_token_unique` ON `group_gifts` (`token`);--> statement-breakpoint
CREATE INDEX `group_gifts_wishlist_id` ON `group_gifts` (`wishlist_id`);--> statement-breakpoint
DROP INDEX `reservations_item_id_unique`;--> statement-breakpoint
ALTER TABLE `reservations` ADD `group_gift_id` text REFERENCES group_gifts(id);--> statement-breakpoint
ALTER TABLE `reservations` ADD `amount_cents` integer;--> statement-breakpoint
CREATE INDEX `reservations_group_gift_id` ON `reservations` (`group_gift_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `reservations_item_single` ON `reservations` (`item_id`) WHERE group_gift_id IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `reservations_gift_user` ON `reservations` (`group_gift_id`,`user_id`);