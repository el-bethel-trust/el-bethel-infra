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
import { composeSMS, sendBulkSMS, sendSMS } from "./sms";
import type { Stream } from "./types";

const postHolyPeriodTask = async () => {
	const absentees = await findAbsentees();
	if (absentees.length === 0) return;

	const absenteeIds = absentees.map((a) => a.id);
	await bulkLockMembers(absenteeIds);
	await wipeAttendanceTimes();

	const individualLimit = 35;
	const promises: Promise<any>[] = [];

	const individualAbsentees = absentees.slice(0, individualLimit);
	const bulkAbsentees = absentees.slice(individualLimit);

	for (const person of individualAbsentees) {
		const message = composeSMS.lock(person.stream, person.name);
		promises.push(sendSMS(message, person.phone));
	}

	const streamGroups: Partial<Record<Stream, string[]>> = {};

	for (const person of bulkAbsentees) {
		if (!streamGroups[person.stream]) {
			streamGroups[person.stream] = [];
		}
		streamGroups[person.stream]!.push(person.phone);
	}

	for (const stream of Object.keys(streamGroups) as Stream[]) {
		const phones = streamGroups[stream]!;
		const message = composeSMS.lock(stream, "");
		promises.push(sendBulkSMS(message, phones));
	}

	// TODO: handle failures here?
	const _responses = await Promise.allSettled(promises);
};

const batchUnlockMembersTask = async () => {
	const unlockedMembers = await consumeLockQueue();

	const individualLimit = 35; // maybe adjust this???
	const promises: Promise<any>[] = [];

	const individualMembers = unlockedMembers.slice(0, individualLimit);
	const bulkMembers = unlockedMembers.slice(individualLimit);

	for (const member of individualMembers) {
		const message = composeSMS.unlock(member.stream, member.phone);
		promises.push(sendSMS(message, member.phone));
	}
	const streamGroups: Partial<Record<Stream, string[]>> = {};

	for (const member of bulkMembers) {
		if (!streamGroups[member.stream]) {
			streamGroups[member.stream] = [];
		}
		streamGroups[member.stream]!.push(member.phone);
	}

	for (const stream of Object.keys(streamGroups) as Stream[]) {
		const phones = streamGroups[stream]!;
		const message = composeSMS.unlock(stream, "phone number");
		promises.push(sendBulkSMS(message, phones));
	}

	// TODO: handle these failures maybe?
	const _responses = await Promise.allSettled(promises);
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

const sendWishes = async () => {
	const currentISTDate = getCurrentDateIST().slice(5);
	const membersWithBirthday = await findMembersWithBirthday(currentISTDate);

	// const membersWithAnniversary =
	//   await findMembersWithAnniversary(currentISTDate);

	// NOTE: only 50 subrequests can be sent from a worker

	if (membersWithBirthday.length > 0) {
		const individualLimit = 30;
		const promises = [];

		const individualMembers = membersWithBirthday.slice(0, individualLimit);
		for (const member of individualMembers) {
			const wish = composeSMS.birthday(member.name);
			promises.push(sendSMS(wish, member.phone));
		}

		if (membersWithBirthday.length > individualLimit) {
			const bulkMembers = membersWithBirthday.slice(individualLimit);
			const phoneNumbers = bulkMembers.map((m) => m.phone);
			const wish = composeSMS.birthday("member");
			promises.push(sendBulkSMS(wish, phoneNumbers));
		}

		await Promise.allSettled(promises);
	}

	// TODO: send wishes for marriage anniversary
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
