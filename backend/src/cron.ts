import { log } from "./utils";
import {
	consumeLockQueue,
	findAbsentees,
	bulkLockMembers,
	wipeAttendanceTimes,
	getTodayVerse,
	findDailVerseMembers,
	findMembersWithBirthday,
	// findMembersWithAnniversary,
} from "./db/queries";
import { getCurrentDateIST } from "./utils";
import { composeSMS, sendBulkSMS } from "./sms";
import { env } from "cloudflare:workers";

const BULKSMS_PROXY_URL = env.BULKSMS_PROXY_URL;

export const postHolyPeriodTask = async () => {
	const absentees = await findAbsentees();
	if (absentees.length === 0) return;

	const absenteeIds = absentees.map((a) => a.id);
	await bulkLockMembers(absenteeIds);
	await wipeAttendanceTimes();

	const sendLockSMS = await fetch(`${BULKSMS_PROXY_URL}/bulk-lock`, {
		method: "POST",
		body: JSON.stringify({
			members: absenteeIds,
		}),
	});
	const lockSMSResponse = await sendLockSMS.text();

	// send the copy of those sms to admin
	const sendLockSMSReport = await fetch(
		`${BULKSMS_PROXY_URL}/bulk-lock-report`,
		{
			method: "POST",
			body: JSON.stringify({
				members: absenteeIds,
			}),
		},
	);
	const lockSMSReportResponse = await sendLockSMSReport.text();
};

const batchUnlockMembersTask = async () => {
	const unlockedMembers = await consumeLockQueue();
	if (unlockedMembers.length === 0) return;

	const sendUnlockSMS = await fetch(`${BULKSMS_PROXY_URL}/bulk-unlock`, {
		method: "POST",
		body: JSON.stringify({
			members: unlockedMembers,
		}),
	});
	const unlockSMSResponse = await sendUnlockSMS.text();

	// send a copy of those sms to admin
	const sendUnlockSMSReport = await fetch(
		`${BULKSMS_PROXY_URL}/bulk-unlock-report`,
		{
			method: "POST",
			body: JSON.stringify({
				members: unlockedMembers,
			}),
		},
	);
	const unlockSMSReportResponse = await sendUnlockSMSReport.text();
};

const sendWishes = async () => {
	const currentISTDate = getCurrentDateIST().slice(5);
	const membersWithBirthday = await findMembersWithBirthday(currentISTDate);
	if (membersWithBirthday.length === 0) return;

	const sendUnlockSMS = await fetch(`${BULKSMS_PROXY_URL}/bulk-birthday`, {
		method: "POST",
		body: JSON.stringify({
			members: membersWithBirthday,
		}),
	});
	const response = await sendUnlockSMS.text();
	log.debug(response);

	// const membersWithAnniversary =
	//   await findMembersWithAnniversary(currentISTDate);
	// TODO: send wishes for marriage anniversary
};

const sendDailyVerses = async () => {
	const currentISTDate = getCurrentDateIST();
	const todaysVerse = await getTodayVerse(currentISTDate);
	if (!todaysVerse) {
		log.warn("no verses scheduled for today");
		return;
	}
	const dailyVerseMembers = await findDailVerseMembers();
	if (dailyVerseMembers.length === 0) return;

	const smallVerseMembers = dailyVerseMembers.filter(
		(member) => member.daily_verse === "SMALL",
	);
	const mediumVerseMembers = dailyVerseMembers.filter(
		(member) => member.daily_verse === "MEDIUM",
	);
	const largeVerseMembers = dailyVerseMembers.filter(
		(member) => member.daily_verse === "LARGE",
	);

	const promises: Promise<any>[] = [];

	if (smallVerseMembers.length > 0 && todaysVerse.small) {
		const smsData = composeSMS.smallVerse(todaysVerse.small, currentISTDate);
		promises.push(
			sendBulkSMS(
				smsData,
				smallVerseMembers.map((member) => member.phone),
			),
		);
	}

	if (mediumVerseMembers.length > 0 && todaysVerse.medium) {
		const smsData = composeSMS.mediumVerse(todaysVerse.medium, currentISTDate);
		promises.push(
			sendBulkSMS(
				smsData,
				mediumVerseMembers.map((member) => member.phone),
			),
		);
	}

	if (mediumVerseMembers.length > 0 && todaysVerse.large) {
		const smsData = composeSMS.largeVerse(todaysVerse.large, currentISTDate);
		promises.push(
			sendBulkSMS(
				smsData,
				largeVerseMembers.map((member) => member.phone),
			),
		);
	}

	// TODO: maybe handle the failures?
	const _responses = await Promise.allSettled(promises);
};

async function scheduled(
	controller: ScheduledController,
	_env: Cloudflare.Env,
	_ctx: ExecutionContext,
) {
	switch (controller.cron) {
		case "*/15 * * * *":
			log.info("consuming lock queue now!", new Date().toUTCString());
			await batchUnlockMembersTask();
			break;
		case "31 18 * * *":
			await sendDailyVerses();
			break;
		case "35 18 * * *":
			await sendWishes();
			break;
		case "57 1 * * *":
		case "32 14 * * *":
			log.info(
				"post holy period automation takes place now",
				new Date().toUTCString(),
			);
			await postHolyPeriodTask();
			break;
		default:
			log.error("Unknown cron pattern:", controller.cron);
	}
}

export default scheduled;
