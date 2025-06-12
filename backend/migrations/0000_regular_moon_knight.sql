CREATE TABLE `daily_verses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`small` text,
	`medium` text,
	`large` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_daily_verses_date` ON `daily_verses` (`date`);--> statement-breakpoint
CREATE TABLE `members` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`phone` text NOT NULL,
	`stream` text NOT NULL,
	`dob` text,
	`dom` text,
	`address` text,
	`min_prayer_time` integer DEFAULT 15 NOT NULL,
	`min_bible_reading_time` integer DEFAULT 20 NOT NULL,
	`is_locked` integer DEFAULT false NOT NULL,
	`daily_verse` text,
	`attendance_start_time` integer,
	`attendance_end_time` integer
);
--> statement-breakpoint
CREATE INDEX `idx_members_absentees` ON `members` (`is_locked`,`attendance_end_time`);--> statement-breakpoint
CREATE INDEX `idx_members_birthday` ON `members` (`dob`);--> statement-breakpoint
CREATE INDEX `idx_members_anniversary` ON `members` (`dom`);--> statement-breakpoint
CREATE INDEX `idx_members_with_daily_verse` ON `members` (`id`) WHERE "members"."daily_verse" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX `members_phone_stream_unique` ON `members` (`phone`,`stream`);--> statement-breakpoint
CREATE TABLE `sub_admins` (
	`stream` text PRIMARY KEY NOT NULL,
	`id` integer,
	FOREIGN KEY (`id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_sub_admins_id` ON `sub_admins` (`id`);--> statement-breakpoint
CREATE TABLE `unlock_queue` (
	`id` integer PRIMARY KEY NOT NULL,
	FOREIGN KEY (`id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE cascade
);
