import { env } from "cloudflare:workers";
import log from "loglevel";
import type { HangupControl, PlayControl, Stream } from "./types";

log.setLevel(env.LOG_LEVEL || log.levels.DEBUG);

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

const parseTimeToMinutes = (timeStr: string | undefined): number => {
	if (!timeStr) return 0;
	try {
		const [hour, minute] = timeStr.split(":").map(Number);
		return hour * 60 + minute;
	} catch (e) {
		log.error(`Invalid time format in .env: ${timeStr}. Defaulting to 0.`);
		return 0;
	}
};

const PRAYER_START_MINUTES = parseTimeToMinutes(env.PRAYER_SESSION_START);
const PRAYER_END_MINUTES = parseTimeToMinutes(env.PRAYER_SESSION_END);
const BIBLE_START_MINUTES = parseTimeToMinutes(env.BIBLE_SESSION_START);
const BIBLE_END_MINUTES = parseTimeToMinutes(env.BIBLE_SESSION_END);
const MAINTENANCE_DURATION = Number(env.MAINTENANCE_DURATION);

const checkMaintenancePeriod = (): boolean => {
	const currentMinutes = getCurrentMinutesIST();

	const afterPrayerEnd =
		currentMinutes >= PRAYER_END_MINUTES &&
		currentMinutes < PRAYER_END_MINUTES + MAINTENANCE_DURATION;
	const afterBibleEnd =
		currentMinutes >= BIBLE_END_MINUTES &&
		currentMinutes < BIBLE_END_MINUTES + MAINTENANCE_DURATION;

	return afterPrayerEnd || afterBibleEnd;
};

const isTimeInPeriod = (
	currentMinutes: number,
	startMinutes: number,
	endMinutes: number,
): boolean => {
	if (startMinutes > endMinutes) {
		return currentMinutes >= startMinutes || currentMinutes < endMinutes;
	} else {
		return currentMinutes >= startMinutes && currentMinutes < endMinutes;
	}
};

const isPrayerPeriod = (): boolean => {
	const currentMinutes = getCurrentMinutesIST();
	return isTimeInPeriod(
		currentMinutes,
		PRAYER_START_MINUTES,
		PRAYER_END_MINUTES,
	);
};

const isBiblePeriod = (): boolean => {
	const currentMinutes = getCurrentMinutesIST();
	return isTimeInPeriod(currentMinutes, BIBLE_START_MINUTES, BIBLE_END_MINUTES);
};

const checkHolyPeriod = (): boolean => {
	return isPrayerPeriod() || isBiblePeriod();
};

const getStreamFromDTMF = (dtmf: number): Stream | null => {
	switch (dtmf) {
		case 1:
			return "MALE";
		case 2:
			return "FEMALE";
		case 3:
			return "FUTURE";
		case 4:
			return "SUNDAY_CLASS_TEACHER";
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

const getCurrentMinutesIST = (): number => {
	const now = new Date();
	const timeStr = new Intl.DateTimeFormat("en-IN", {
		timeZone: "Asia/Kolkata",
		hour12: false,
		hour: "numeric",
		minute: "numeric",
	}).format(now);
	const [hour, minute] = timeStr.split(":").map(Number);
	return hour * 60 + minute;
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
