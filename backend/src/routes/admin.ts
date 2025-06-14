import { Hono } from "hono";
import { log, addPhoneCode } from "../utils";
import {
	checkMemberExistence,
	checkMemberExistenceWithId,
	getMembers,
	registerMember,
	removeMember,
	updateMember,
	checkConflictingMember,
	getAllSubAdmins,
	updateSubAdmins,
	findMemberByID,
} from "../db/queries";
import type { RegisterPayload, Member, SubAdmins } from "../types";
import { composeSMS, sendSMS } from "../sms";

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.get("/sub-admins", async (c) => {
	const subAdmins = await getAllSubAdmins();
	return c.json(subAdmins, 200);
});

app.put("/sub-admins", async (c) => {
	const newSubAdmins: SubAdmins = await c.req.json();

	const updatedSubAdmins = await updateSubAdmins(newSubAdmins);
	return c.json(updatedSubAdmins, 200);
});

app.delete("/members/:id", async (c) => {
	const id = Number(c.req.param("id") as string);
	const existingUser = await checkMemberExistenceWithId(id);
	if (!existingUser) {
		return c.json(
			{
				message: "member with given phone and stream doesn't exists",
			},
			409,
		);
	}
	await removeMember(id);
	return c.json({}, 201);
});

app.post("/members", async (c) => {
	const body: RegisterPayload = await c.req.json();
	const { phone, stream } = body;

	const normalizedPhone = addPhoneCode(phone);

	const existingUser = await checkMemberExistence(normalizedPhone, stream);
	if (existingUser) {
		return c.json(
			{
				message: "member with given phone and stream already exists",
			},
			409,
		);
	}
	const registeredMember = await registerMember(body);
	if (registerMember.length === 0) {
		log.error("newly inserted member is not returned");
		throw new Error("newly inserted member is not returned");
	}
	return c.json(registeredMember[0], 201);
});

app.get("/members", async (c) => {
	const members = await getMembers();
	return c.json(members, 200);
});

app.put("/members/:id", async (c) => {
	const id = Number(c.req.param("id"));
	const body: Member = await c.req.json();
	const member = await findMemberByID(id);
	if (!member) {
		return c.json({ message: `Member with ID ${id} not found.` }, 404);
	}
	const hasConflict = await checkConflictingMember(id, body.phone, body.stream);
	if (hasConflict) {
		return c.json(
			{
				message:
					"Another member with this phone and stream combination already exists.",
			},
			409,
		);
	}

	const updatedMember = await updateMember(id, body);
	if (!updatedMember) {
		return c.json({ message: "Failed to update member." }, 500);
	}

	// checking if the lock status of a member is updated via app, if so send sms
	const isPreviouslyLocked = member.is_locked;
	const isNewlyLocked = body.is_locked;

	if (!isPreviouslyLocked && isNewlyLocked) {
		const lockMessage = composeSMS.lock(
			updatedMember.stream,
			updatedMember.name,
		);
		// TODO: handle failure here maybe?
		const sendLockMessage = await sendSMS(lockMessage, updatedMember.phone);
		const sendLockReportToAdmin = await sendSMS(
			lockMessage,
			c.env.ADMIN_CONTACT,
		);
	} else if (isPreviouslyLocked && !isNewlyLocked) {
		const unlockMessage = composeSMS.unlock(
			updatedMember.stream,
			updatedMember.phone,
		);
		// TODO: handle failure here maybe?
		const sendUnlockMessage = await sendSMS(unlockMessage, updatedMember.phone);
		const sendUnlockReportToAdmin = await sendSMS(
			unlockMessage,
			c.env.ADMIN_CONTACT,
		);
	}

	return c.json(updatedMember, 200);
});

app.post("/check-pin", async (c) => {
	const body: { pin: string } = await c.req.json();
	const pin = body.pin;
	const response = { success: pin === c.env.DAILY_VERSE_SCHEDULER_ADMIN_PIN };
	return c.json(response);
});

export default app;
