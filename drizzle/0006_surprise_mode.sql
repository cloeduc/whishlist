ALTER TABLE `memberships` ADD `surprise_mode` integer DEFAULT false NOT NULL;--> statement-breakpoint
-- A reservation no longer archives its idea (feature 020): before it, a reserved idea was archived only by its reservation.
UPDATE `items` SET `archived` = 0 WHERE `id` IN (SELECT `item_id` FROM `reservations`);
