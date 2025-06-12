import type { Config } from "drizzle-kit";

const config: Config = {
	out: "./migrations",
	schema: "./src/db/schema.ts",
	dialect: "sqlite",
	dbCredentials: {
		url: "file:.wrangler/state/v3/d1/miniflare-D1DatabaseObject/3289958cb5c37b602e144a85f57a3988d9a70a536b34a6caf19142bf056f4002.sqlite",
	},
};

export default config;
