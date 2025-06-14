import { Hono } from "hono";
import {
	findMember,
	lockMember,
	markMemberAttendanceEnd,
	markMemberAttendanceStart,
} from "../db/queries";
import {
	checkHolyPeriod,
	getStreamFromDTMF,
	currentISTime,
	isPrayerPeriod,
	isAttendanceFulfilled,
	checkMaintenancePeriod,
	hangupControl,
	playControl,
} from "../utils";
import type { GatherControl, CheckpointPayload } from "../types";
import { composeSMS, sendSMS } from "../sms";

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.post("/hangup", (c) => {
	return c.json(hangupControl(), 200);
});

app.post("/init", async (c) => {
	const isMaintenanceMode = checkMaintenancePeriod();

	if (isMaintenanceMode) {
		return c.json(hangupControl(), 200);
	}
	const askStream: GatherControl = {
		action: "gather",
		minDigits: 1,
		maxDigits: 1,
		timeout: 5000,
		prompt: {
			action: "play",
			url: `${c.env.HOSTNAME}/static/ask-stream.mp3`,
		},
		flow_url: `${c.env.HOSTNAME}/ivr/checkpoint`,
	};
	return c.json(askStream, 200);
});

app.post("/checkpoint", async (c) => {
	const body: CheckpointPayload = await c.req.json();
	const dtmf = Number(body.dtmf);
	const phone = body.callerId;
	const stream = getStreamFromDTMF(dtmf);
	if (!stream) {
		return c.json(hangupControl(), 200);
	}

	const member = await findMember(phone, stream);
	if (!member) {
		return c.json(playControl("unregistered-phone-number.mp3"), 200);
	}
	const isHolyPeriod = checkHolyPeriod();
	if (isHolyPeriod) {
		if (member.is_locked) {
			return c.json(playControl("please-unlock.mp3"), 200);
		}

		// if the member already did their attendance well and good, and if they try again, we play the audio again
		if (member.attendance_start_time && member.attendance_end_time) {
			return c.json(playControl("attendance-confirmation.mp3"), 200);
		}

		const isPrayerTime = isPrayerPeriod();

		// if the member calls for first time, during the period
		if (!member.attendance_start_time) {
			await markMemberAttendanceStart(member.id, currentISTime());
			const acknowledgement = composeSMS.attendanceAcknowledgement(
				member.name,
				stream,
				isPrayerTime ? "Prayer" : "Bible Reading",
			);

			// TODO: handle failure here maybe?
			const sendAcknowledgement = await sendSMS(acknowledgement, phone);
			const sendAcknowledgementToAdmin = await sendSMS(
				acknowledgement,
				c.env.ADMIN_CONTACT,
			);

			return c.json(playControl("attendance-acknowledgement.mp3"), 200);
		}

		const now = currentISTime();

		const timeSinceFirstCallMs =
			now.getTime() - member.attendance_start_time.getTime();
		const timeSinceFirstCallMinutes = timeSinceFirstCallMs / (1000 * 60);

		const redialGracePeriodMinutes = Number(c.env.REDIAL_GRACE_ALLOWANCE || 2);

		if (timeSinceFirstCallMinutes < redialGracePeriodMinutes) {
			// User redialed quickly. Play acknowledgement again and do not lock.
			return c.json(playControl("attendance-acknowledgement.mp3"), 200);
		}

		const minTime = isPrayerTime
			? member.min_prayer_time
			: member.min_bible_reading_time;

		const graceAllowance = isPrayerTime
			? Number(c.env.PRAYER_GRACE_ALLOWANCE)
			: Number(c.env.BIBLE_READING_GRACE_ALLOWANCE);

		const memberAttendanceStartTime = member.attendance_start_time;
		const memberAttendanceEndTime = now;

		if (
			isAttendanceFulfilled(
				memberAttendanceStartTime,
				memberAttendanceEndTime,
				minTime,
				graceAllowance,
			)
		) {
			await markMemberAttendanceEnd(member.id, memberAttendanceEndTime);
			const confirmation = composeSMS.attendanceConfirmation(
				member.name,
				stream,
				isPrayerTime ? "Prayer" : "Bible Reading",
			);

			// TODO: handle failure here maybe?
			const sendConfirmation = await sendSMS(confirmation, phone);
			const sendConfirmationReportToAdmin = await sendSMS(
				confirmation,
				c.env.ADMIN_CONTACT,
			);
			return c.json(playControl("attendance-confirmation.mp3"), 200);
		}

		await lockMember(member.id);
		const lockMessage = composeSMS.lock(stream, member.name);

		// TODO: handle failure here maybe?
		const sendLockMessage = await sendSMS(lockMessage, phone);
		const sendLockReportToAdmin = await sendSMS(
			lockMessage,
			c.env.ADMIN_CONTACT,
		);
		return c.json(playControl("please-unlock.mp3"), 200);
	}
	const askForUnlocking: GatherControl = {
		action: "gather",
		minDigits: 1,
		maxDigits: 1,
		timeout: 5000,
		prompt: {
			action: "play",
			url: `${c.env.HOSTNAME}/static/ask-unlocking.mp3`,
		},
		flow_url: `${c.env.HOSTNAME}/unlock?stream=${stream}`,
	};
	return c.json(askForUnlocking, 200);
});

export default app;
