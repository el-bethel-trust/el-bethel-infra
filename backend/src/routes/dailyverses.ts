import { log } from "../utils";
import { getDailyVerses, upsertDailyVerses } from "../db/queries";
import { Hono } from "hono";
import type { VerseEntry, Verses } from "../types";

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.get("/", async (c) => {
	const start = c.req.query("start");
	const end = c.req.query("end");

	if (!start || !end) {
		c.get("sentry").captureException(new Error("Missing start or end date"));
		log.error("Missing start or end date");
		return c.json({ error: "Missing start or end date" }, 400);
	}
	const verses = await getDailyVerses(start, end);
	const formattedVersesByDate: Verses = {};
	for (const verse of verses) {
		formattedVersesByDate[verse.date] = {
			small: verse.small,
			medium: verse.medium,
			large: verse.large,
		};
	}
	return c.json(formattedVersesByDate);
});

app.post("/bulk-update", async (c) => {
	const verses: Verses = await c.req.json();
	const rows: VerseEntry[] = Object.entries(verses).map(([date, values]) => ({
		date,
		small: values.small === "" ? null : values.small,
		medium: values.medium === "" ? null : values.medium,
		large: values.large === "" ? null : values.large,
	}));

	if (rows.length === 0) {
		return;
	}

	await upsertDailyVerses(rows);
	return c.json({ success: true });
});

export default app;
