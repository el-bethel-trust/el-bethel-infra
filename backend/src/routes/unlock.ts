import { Hono } from "hono";
import { log, hangupControl, playControl } from "../utils";
import {
	checkIfMemberLocked,
	findMember,
	getStreamAdminPhone,
	pushToLockQueue,
	checkSubAdminExistenceWithId,
} from "../db/queries";
import type {
	Stream,
	DialControl,
	UnlockPayload,
	UnlockCallStatus,
	Member,
} from "../types";

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.post("/status", async (c) => {
	const body: UnlockCallStatus = await c.req.json();
	if (body.status === "busy" || body.status === "noAnswer") {
		// TODO: might want to send sms to super-admin reporting sub-admin didn't picked up call for this person
	}
	if (body.status === "answered") {
		const memberId = Number(c.req.query("id") as string);
		await pushToLockQueue(memberId);
	}
	return c.text("status acknowledged!");
});

app.post("/", async (c) => {
	const body: UnlockPayload = await c.req.json();
	const dtmf = Number(body.dtmf);
	const memberPhone = body.callerId;
	const stream = c.req.query("stream") as Stream;

	if (dtmf !== 1) {
		return c.json(hangupControl(), 200);
	}

	const isMemberLocked = await checkIfMemberLocked(memberPhone, stream);
	if (!isMemberLocked) {
		return c.json(playControl("inform-not-locked.mp3"), 200);
	}

	// member would be present, because non-existence check is done in previous flow
	const member = (await findMember(memberPhone, stream)) as Member;
	const isSubAdmin = await checkSubAdminExistenceWithId(member.id);
	if (isSubAdmin) {
		log.info("sub-admin's can't unlock via phone call");
		return c.json(hangupControl(), 200);
	}

	const streamAdminPhone = await getStreamAdminPhone(stream);
	if (!streamAdminPhone) {
		c.get("sentry").captureException(
			new Error(`admin for stream: ${stream} not found in db!`),
		);
		log.error(`admin for stream: ${stream} not found in db!`);
		return c.json(hangupControl(), 200);
	}
	const dial: DialControl = {
		action: "Dial",
		callerId: c.env.CALLER_ID,
		numbers: [streamAdminPhone],
		timeout: 30,
		callStatusUrl: `${c.env.HOSTNAME}/unlock/status?id=${member.id}`,
		flowUrl: `${c.env.HOSTNAME}/ivr/hangup`,
	};
	return c.json(dial, 200);
});

export default app;
