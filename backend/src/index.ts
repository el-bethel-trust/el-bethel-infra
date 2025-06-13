import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { sentry } from "@hono/sentry";
import { trimTrailingSlash } from "hono/trailing-slash";
import { ivr, unlock, admin, dailyVerses } from "./routes";
import { log } from "./utils";
import scheduled, { postHolyPeriodTask } from "./cron";

const app = new Hono<{ Bindings: CloudflareBindings }>();
app.use("*", sentry());
app.use("*", cors()); // TODO: need to do cors properly during staging
app.use(logger());
app.use(trimTrailingSlash());
app.onError((err, c) => {
  log.error("Uncaught Error:", err);
  c.get("sentry").setTag("domain", "backend");
  c.get("sentry").captureException(err);
  return c.json({ error: "Internal Server Error", message: err.message }, 500);
});

app.route("/ivr", ivr);
app.route("/unlock", unlock);
app.route("/admin", admin);
app.route("/daily-verses", dailyVerses);

app.get("/", async (c) => {
  return c.text("Hello El-Bethel!");
});
app.get("/lock", async (c) => {
  await postHolyPeriodTask();
  return c.text("ran well!!");
});

export default {
  fetch: app.fetch,
  scheduled,
};
