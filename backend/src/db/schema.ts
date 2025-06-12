import {
	integer,
	sqliteTable,
	text,
	unique,
	index,
} from "drizzle-orm/sqlite-core";
import { isNotNull } from "drizzle-orm";
import type { Stream, DailyVerse } from "../types";

export const members = sqliteTable(
	"members",
	{
		id: integer().primaryKey({ autoIncrement: true }),
		name: text().notNull(),
		phone: text().notNull(),
		stream: text().notNull().$type<Stream>(),
		dob: text(),
		dom: text(),
		address: text(),
		min_prayer_time: integer().notNull().default(15), // in minutes
		min_bible_reading_time: integer().notNull().default(20), // in minutes
		is_locked: integer({ mode: "boolean" }).notNull().default(false),
		daily_verse: text().$type<DailyVerse | null>(),
		attendance_start_time: integer({ mode: "timestamp_ms" }),
		attendance_end_time: integer({ mode: "timestamp_ms" }),
	},
	(t) => [
		unique().on(t.phone, t.stream),
		index("idx_members_absentees").on(t.is_locked, t.attendance_end_time),
		index("idx_members_birthday").on(t.dob),
		index("idx_members_anniversary").on(t.dom),
		index("idx_members_with_daily_verse")
			.on(t.id)
			.where(isNotNull(t.daily_verse)),
	],
);

export const dailyVerses = sqliteTable(
	"daily_verses",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		date: text("date").notNull(),
		small: text("small"),
		medium: text("medium"),
		large: text("large"),
	},
	(t) => [unique("uq_daily_verses_date").on(t.date)],
);

export const subAdmins = sqliteTable(
	"sub_admins",
	{
		stream: text("stream").notNull().primaryKey(),
		id: integer("id").references(() => members.id, { onDelete: "cascade" }),
	},
	(t) => [index("idx_sub_admins_id").on(t.id)],
);

export const unlockQueue = sqliteTable("unlock_queue", {
	id: integer()
		.primaryKey()
		.references(() => members.id, { onDelete: "cascade" }),
});
