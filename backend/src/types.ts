type Stream = "MALE" | "FEMALE" | "FUTURE" | "SUNDAY_CLASS_TEACHER";
type DailyVerse = "SMALL" | "MEDIUM" | "LARGE";

interface HangupControl {
	action: "hangup";
}

interface DialControl {
	action: "Dial";
	callerId: string;
	numbers: string[];
	timeout: 30;
	callStatusUrl?: string;
	record?: boolean;
	recordStatusUrl?: string;
	flowUrl: string;
}

interface PlayControl {
	action: "play";
	url: string;
	flowUrl: string;
}

interface GatherControl {
	action: "gather";
	minDigits: number;
	maxDigits: number;
	timeout: number;
	prompt: Omit<PlayControl, "flowUrl">;
	flow_url: string;
}
interface CheckpointPayload {
	phoneNumber: string;
	dtmf: string;
	uuid: string;
	callerId: string;
}

interface UnlockPayload {
	phoneNumber: string;
	callerId: string;
	dtmf: string;
	stream: Stream;
}

interface RegisterPayload {
	name: string;
	phone: string;
	stream: Stream;
	dob: string | null;
	dom: string | null;
	address: string | null;
	min_prayer_time: number;
	min_bible_reading_time: number;
	daily_verse: DailyVerse;
}

interface SubAdminRegistrationPayload {
	id: number;
	stream: Stream;
}

interface UnlockCallStatus {
	uuid: string;
	phoneNumber: string;
	accountId: string;
	callerId: string;
	dateTime: string;
	startTime: string;
	ivrTag: string | null;
	host: string;
	answerTime: string | null;
	endTime: string;
	duration: string | null;
	direction: "inbound" | "outbound";
	statusCode: string;
	hangupCause: string;
	parentUuid: string;
	status:
		| "busy"
		| "ringing"
		| "initiated"
		| "answered"
		| "completed"
		| "noAnswer";
	contacts: unknown | null;
	agent_id: string | null;
}

interface Member {
	id: number;
	name: string;
	phone: string;
	stream: Stream;
	dob: string | null;
	dom: string | null;
	address: string | null;
	min_prayer_time: number;
	min_bible_reading_time: number;
	is_locked: boolean;
	daily_verse: DailyVerse | null;
	attendance_start_time: Date | null;
	attendance_end_time: Date | null;
}

type VerseEntry = {
	date: string;
	small: string | null;
	medium: string | null;
	large: string | null;
};

type Verses = Record<string, Omit<VerseEntry, "date">>;
type SubAdmins = Record<Stream, number | null>;

interface SMSData {
	senderID: string;
	templateID: string;
	message: string;
}

interface SMSResponse {
	code: number;
	message: string;
	data: { message_id: number; number: string }[];
}

export type {
	Stream,
	DailyVerse,
	HangupControl,
	DialControl,
	PlayControl,
	GatherControl,
	CheckpointPayload,
	UnlockPayload,
	RegisterPayload,
	SubAdminRegistrationPayload,
	UnlockCallStatus,
	Member,
	Verses,
	VerseEntry,
	SubAdmins,
	SMSData,
	SMSResponse,
};
