import { env } from "cloudflare:workers";
import log from "loglevel";
import type { HangupControl, PlayControl, Stream } from "./types";

log.setLevel(env.LOG_LEVEL || "DEBUG");

const playControl = (fileName: string) => {
	const play: PlayControl = {
		action: "play",
		url: `${env.HOSTNAME}/static/${fileName}`,
		flowUrl: `${env.HOSTNAME}/ivr/hangup`,
	};
	return play;
};

const hangupControl = () => {
	const hangup: HangupControl = {
		action: "hangup",
	};
	return hangup;
};

const PRAYER_SESSION_START = env.PRAYER_SESSION_START;
const PRAYER_SESSION_END = env.PRAYER_SESSION_END;
const BIBLE_SESSION_START = env.BIBLE_SESSION_START;
const BIBLE_SESSION_END = env.BIBLE_SESSION_END;
const MAINTENANCE_DURATION = env.MAINTENANCE_DURATION;

const checkMaintenancePeriod = () => {
	const now = new Date();
	const timeStr = new Intl.DateTimeFormat("en-IN", {
		timeZone: "Asia/Kolkata",
		hour12: false,
		hour: "numeric",
		minute: "numeric",
	}).format(now);
	const [hour, minute] = timeStr.split(":").map(Number);

	const current = hour * 60 + minute;
	const prayerEnd = PRAYER_SESSION_END * 60;
	const bibleEnd = BIBLE_SESSION_END * 60;

	const afterPrayerEnd =
		current >= prayerEnd && current <= prayerEnd + MAINTENANCE_DURATION;
	const afterBibleEnd =
		current >= bibleEnd && current <= bibleEnd + MAINTENANCE_DURATION;

	return afterPrayerEnd || afterBibleEnd;
};

const checkHolyPeriod = () => {
	const currentHour = Number.parseInt(
		new Intl.DateTimeFormat("en-IN", {
			timeZone: "Asia/Kolkata",
			hour: "numeric",
			hour12: false,
		}).format(new Date()),
		10,
	);

	return (
		(currentHour >= PRAYER_SESSION_START && currentHour < PRAYER_SESSION_END) ||
		(currentHour >= BIBLE_SESSION_START && currentHour < BIBLE_SESSION_END)
	);
};

const isPrayerPeriod = () => {
	const currentHour = Number.parseInt(
		new Intl.DateTimeFormat("en-IN", {
			timeZone: "Asia/Kolkata",
			hour: "numeric",
			hour12: false,
		}).format(new Date()),
		10,
	);
	return (
		currentHour >= PRAYER_SESSION_START && currentHour < PRAYER_SESSION_END
	);
};

const getStreamFromDTMF = (dtmf: number): Stream | null => {
	switch (dtmf) {
		case 1:
			return "MALE";
		case 2:
			return "FEMALE";
		case 3:
			return "FUTURE";
		default:
			return null;
	}
};

const currentISTime = () => {
	const now = new Date();
	const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
	return new Date(utcTime + 5.5 * 60 * 60 * 1000);
};

const isAttendanceFulfilled = (
	sessionStart: Date,
	sessionEnd: Date,
	minTime: number,
	graceAllowance: number,
) => {
	const duration = sessionEnd.getTime() - sessionStart.getTime();
	const minTimeMS = minTime * 60 * 1000;
	const gracePeriodMS = graceAllowance * 60 * 1000;
	if (duration < minTimeMS || duration > minTimeMS + gracePeriodMS) {
		return false;
	}
	return true;
};

const getCurrentDateIST = () => {
	const formatter = new Intl.DateTimeFormat("en-CA", {
		timeZone: "Asia/Kolkata",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	});
	return formatter.format(new Date());
};

const addPhoneCode = (phone: string) => {
	if (phone.startsWith("+91")) return phone;
	return `+91${phone.trim()}`;
};

const removePhoneCode = (phone: string) => {
	if (phone.startsWith("+91")) return phone.slice(3);
	return phone;
};

export {
	log,
	checkHolyPeriod,
	isPrayerPeriod,
	getStreamFromDTMF,
	currentISTime,
	isAttendanceFulfilled,
	checkMaintenancePeriod,
	playControl,
	hangupControl,
	getCurrentDateIST,
	addPhoneCode,
	removePhoneCode,
};
