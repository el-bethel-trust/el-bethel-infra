import { env } from "cloudflare:workers";
import type { Stream, SMSData, SMSResponse } from "./types";
import { removePhoneCode } from "./utils";

const bulkSMSUrl = env.BULKSMS_URL;

const smsParams = new URLSearchParams({
	api_id: env.BULKSMS_API_ID,
	api_password: env.BULKSMS_API_PASSWORD,
	sms_type: "Transactional",
	sms_encoding: "text",
});

const sendSMS = async (smsData: SMSData, phone: string) => {
	const params = smsParams;
	const { senderID, templateID, message } = smsData;
	params.append("number", removePhoneCode(phone));
	params.append("sender", senderID);
	params.append("template_id", templateID);
	params.append("message", message);

	const response = await fetch(`${bulkSMSUrl}/send_sms?${params.toString()}`);
	const result: SMSResponse = await response.json();

	return { success: result.code === 200 };
};

const sendBulkSMS = async (smsData: SMSData, phones: string[]) => {
	const params = smsParams;
	const { senderID, templateID, message } = smsData;
	params.append(
		"number",
		phones.map((phone) => removePhoneCode(phone)).join(","),
	);
	params.append("sender", senderID);
	params.append("template_id", templateID);
	params.append("message", message);

	const response = await fetch(
		`${bulkSMSUrl}/send_sms_multi?${params.toString()}`,
	);
	const result: SMSResponse = await response.json();

	return { success: result.code === 200 };
};

const sendOTP = async () => {};

const addContact = async (phone: string, name: string) => {
	const OTPParams = new URLSearchParams({
		api_id: env.BULKSMS_API_ID,
		api_password: env.BULKSMS_API_PASSWORD,
		contact_list_id: "41890", // TODO: need to know what this contact_list_id means
		contact_name: name,
		contact_number: phone,
	});
	const response = await fetch(
		`${bulkSMSUrl}/add_number_contact?${OTPParams.toString()}`,
	);
	const result: SMSResponse = await response.json();
	return { success: result.code === 200 };
};

const streamMap: Record<Stream, string> = {
	MALE: "Boys",
	FEMALE: "Girls",
	FUTURE: "Future",
	SUNDAY_CLASS_TEACHER: "Sunday Class Teachers",
};

const attendanceAcknowledgement = (
	name: string,
	stream: Stream,
	session: string,
): SMSData => {
	const senderID = "EBLTOL";
	const templateID = "134653";
	const message = `Dear El Bethel Member ${name}, Your attendance had been received at ${streamMap[stream]} prayer cell on ${session} session. Thank you for contact. -EL BETHEL Trust`;
	return { senderID, templateID, message };
};

const attendanceConfirmation = (
	name: string,
	stream: Stream,
	session: string,
): SMSData => {
	const senderID = "EBLTOL";
	const templateID = "135091";
	const message = `Dear El Bethel Member ${name}. Your attendance has been confirmed at ${streamMap[stream]} prayer cell on ${session} session. Thank you.`;
	return { senderID, templateID, message };
};

const lock = (stream: Stream, name: string): SMSData => {
	const senderID = "EBLTOL";
	const templateID = "136121";
	const message = `Dear El Bethel ${streamMap[stream]} prayer cell member ${name}, your number has locked. To unlock your number kindly contact choir immediately ${env.CALLER_ID} as soon as possible.`;
	return { senderID, templateID, message };
};

const unlock = (stream: Stream, phone: string): SMSData => {
	const senderID = "EBLTOL";
	const templateID = "135492";
	const message = `Dear El Bethel ${streamMap[stream]} prayer cell Member,Your ${phone} has been unlocked, Rejoice with our Lord Jesus Christ.`;
	return { senderID, templateID, message };
};

const birthday = (name: string): SMSData => {
	const senderID = "EBLWSH";
	const templateID = "134570";
	const message = `Dear  ${name}  ,May god Make each day of your life as Beautiful ,May the Almighty go on to add more Years of happiness and good health to your Life!
      Have a Fantastic Born Day! El Bethel Church.`;
	return {
		senderID,
		templateID,
		message,
	};
};

const smallVerse = (verse: string, date: string): SMSData => {
	const senderID = "EBLKDS";
	const templateID = "137905";
	let message = "";
	if (verse.length + "verse ".length <= 30) {
		message = `Dear El Bethel Member, Today's ${date} kids ${"verse " + verse} Memorize this ${"verse"} in the coming day.`;
	} else {
		message = `Dear El Bethel Member, Today's ${date} kids ${"verse."} Memorize this ${verse} in the coming day.`;
	}
	return {
		senderID,
		templateID,
		message,
	};
};

const mediumVerse = (verse: string, date: string): SMSData => {
	const senderID = "EBLSML";
	const templateID = "137904";
	let message = "";
	if (verse.length + "verse ".length <= 30) {
		message = `Dear El Bethel Member, Today's ${date} small ${"verse " + verse} Memorize this ${"verse"} in the coming day.`;
	} else {
		message = `Dear El Bethel Member, Today's ${date} small ${"verse."} Memorize this ${verse} in the coming day.`;
	}
	return {
		senderID,
		templateID,
		message,
	};
};

const largeVerse = (verse: string, date: string): SMSData => {
	const senderID = "EBLCHR";
	const templateID = "137907";
	let message = "";
	if (verse.length + "verse ".length <= 30) {
		message = `Dear El Bethel Member, Today's ${date} promise ${"verse " + verse} Memorize this ${"verse"} in the coming day.`;
	} else {
		message = `Dear El Bethel Member, Today's ${date} promise ${"verse."} Memorize this ${verse} in the coming day.`;
	}
	return {
		senderID,
		templateID,
		message,
	};
};

const composeSMS = {
	birthday,
	attendanceAcknowledgement,
	attendanceConfirmation,
	lock,
	unlock,
	smallVerse,
	mediumVerse,
	largeVerse,
};

export { sendSMS, sendBulkSMS, composeSMS };
