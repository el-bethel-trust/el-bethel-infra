import { drizzle } from "drizzle-orm/d1";
import { ne, sql, eq, gte, lte, and, inArray, not, isNull } from "drizzle-orm";
import { env } from "cloudflare:workers";
import * as schema from "./schema";
import type {
  RegisterPayload,
  Stream,
  Member,
  VerseEntry,
  SubAdmins,
} from "../types";

const db = drizzle(env.DB, { schema });

const registerSubAdmin = async (id: number, stream: Stream) => {
  await db.insert(schema.subAdmins).values({ stream, id }).onConflictDoUpdate({
    target: schema.subAdmins.stream,
    set: { id },
  });
};

const getMembers = async () => {
  const members: Omit<
    Member,
    "attendance_end_time" | "attendance_start_time"
  >[] = await db.query.members.findMany({
    columns: {
      id: true,
      name: true,
      phone: true,
      stream: true,
      dob: true,
      dom: true,
      min_bible_reading_time: true,
      min_prayer_time: true,
      is_locked: true,
      address: true,
      daily_verse: true,
    },
  });
  return members;
};

type UpdatePayload = Omit<Member, "id">;

const updateMember = async (id: number, memberData: UpdatePayload) => {
  const updatedMembers = await db
    .update(schema.members)
    .set({
      ...memberData,
    })
    .where(eq(schema.members.id, id))
    .returning({
      id: schema.members.id,
      name: schema.members.name,
      phone: schema.members.phone,
      stream: schema.members.stream,
      dob: schema.members.dob,
      dom: schema.members.dom,
      min_bible_reading_time: schema.members.min_bible_reading_time,
      min_prayer_time: schema.members.min_prayer_time,
      is_locked: schema.members.is_locked,
      address: schema.members.address,
      daily_verse: schema.members.daily_verse,
    });

  return updatedMembers[0];
};

const getAllSubAdmins = async () => {
  const assignments = await db.query.subAdmins.findMany();
  const subAdminsMap: SubAdmins = {
    MALE: null,
    FEMALE: null,
    FUTURE: null,
  };
  for (const assignment of assignments) {
    if (assignment.stream in subAdminsMap) {
      subAdminsMap[assignment.stream as Stream] = assignment.id;
    }
  }
  return subAdminsMap;
};

const updateSubAdmins = async (newSubAdmins: SubAdmins) => {
  const newAssignments = Object.entries(newSubAdmins)
    .filter(([id]) => id !== null)
    .map(([stream, id]) => ({
      stream: stream as Stream,
      id: id as number,
    }));

  if (newAssignments.length > 0) {
    await db.batch([
      db.delete(schema.subAdmins),
      db.insert(schema.subAdmins).values(newAssignments),
    ]);
  }

  return newSubAdmins;
};

const registerMember = async (memberData: RegisterPayload) => {
  const member = await db.insert(schema.members).values(memberData).returning({
    id: schema.members.id,
    name: schema.members.name,
    phone: schema.members.phone,
    stream: schema.members.stream,
    dob: schema.members.dob,
    dom: schema.members.dom,
    min_bible_reading_time: schema.members.min_bible_reading_time,
    min_prayer_time: schema.members.min_prayer_time,
    is_locked: schema.members.is_locked,
    address: schema.members.address,
    daily_verse: schema.members.daily_verse,
  });
  return member;
};

const findMember = async (phone: string, stream: Stream) => {
  const memberRecord: Member | undefined = await db.query.members.findFirst({
    where: (members, { eq, and }) =>
      and(eq(members.phone, phone), eq(members.stream, stream)),
  });
  return memberRecord;
};

const findMemberByID = async (id: number) => {
  const memberRecord: Member | undefined = await db.query.members.findFirst({
    where: (members, { eq }) => eq(members.id, id),
  });
  return memberRecord;
};

const checkMemberExistence = async (phone: string, stream: Stream) => {
  const doesMemberExists = await db.query.members.findFirst({
    where: (members, { eq, and }) =>
      and(eq(members.phone, phone), eq(members.stream, stream)),
  });
  return doesMemberExists;
};

const checkMemberExistenceWithId = async (id: number) => {
  const doesMemberExists = await db.query.members.findFirst({
    where: (members, { eq }) => eq(members.id, id),
  });
  return doesMemberExists !== undefined;
};

const checkIfMemberLocked = async (phone: string, stream: Stream) => {
  const isMemberLocked = await db.query.members.findFirst({
    where: (members, { eq, and }) =>
      and(
        eq(members.phone, phone),
        eq(members.stream, stream),
        eq(members.is_locked, true),
      ),
  });
  return isMemberLocked !== undefined;
};

const getStreamAdminPhone = async (stream: Stream) => {
  const streamAdminPhone = await db
    .select({
      phone: schema.members.phone,
    })
    .from(schema.subAdmins)
    .innerJoin(schema.members, eq(schema.subAdmins.id, schema.members.id))
    .where(eq(schema.subAdmins.stream, stream))
    .orderBy(schema.subAdmins.id)
    .limit(1);
  if (streamAdminPhone.length === 0) return null;
  return streamAdminPhone[0].phone;
};

const pushToLockQueue = async (id: number) => {
  await db.insert(schema.unlockQueue).values({ id }).onConflictDoNothing();
};

const consumeLockQueue = async () => {
  const lockedMembers = await db
    .select({
      id: schema.members.id,
      name: schema.members.name,
      phone: schema.members.phone,
      stream: schema.members.stream,
    })
    .from(schema.members)
    .innerJoin(
      schema.unlockQueue,
      eq(schema.members.id, schema.unlockQueue.id),
    );

  await db
    .update(schema.members)
    .set({ is_locked: false })
    .where(
      inArray(
        schema.members.id,
        db.select({ id: schema.unlockQueue.id }).from(schema.unlockQueue),
      ),
    );

  await db.delete(schema.unlockQueue);
  return lockedMembers;
};

const checkSubAdminExistenceWithId = async (id: number) => {
  const isSubAdmin = await db.query.subAdmins.findFirst({
    where: (subAdmins, { eq }) => eq(subAdmins.id, id),
  });
  return isSubAdmin !== undefined;
};

const markMemberAttendanceStart = async (id: number, time: Date) => {
  await db
    .update(schema.members)
    .set({ attendance_start_time: time })
    .where(eq(schema.members.id, id));
};

const markMemberAttendanceEnd = async (id: number, time: Date) => {
  await db
    .update(schema.members)
    .set({ attendance_end_time: time })
    .where(eq(schema.members.id, id));
};

const lockMember = async (id: number) => {
  await db
    .update(schema.members)
    .set({ is_locked: true })
    .where(eq(schema.members.id, id));
};

const findAbsentees = async () => {
  const absentees = await db.query.members.findMany({
    columns: {
      id: true,
      name: true,
      phone: true,
      stream: true,
    },
    where: (m, { and, isNull, eq }) =>
      and(isNull(m.attendance_end_time), eq(m.is_locked, false)),
  });
  return absentees;
};

const bulkLockMembers = async (absenteesId: number[]) => {
  const BATCH_SIZE = 95;

  if (absenteesId.length === 0) {
    console.log("No absentee members to lock.");
    return;
  }

  console.log(
    `Locking ${absenteesId.length} members in batches of ${BATCH_SIZE}...`,
  );

  for (let i = 0; i < absenteesId.length; i += BATCH_SIZE) {
    const chunk = absenteesId.slice(i, i + BATCH_SIZE);

    if (chunk.length > 0) {
      try {
        await db
          .update(schema.members)
          .set({ is_locked: true })
          .where(inArray(schema.members.id, chunk));

        console.log(`Successfully locked a batch of ${chunk.length} members.`);
      } catch (error) {
        console.error("Failed to lock a batch of members:", error);
      }
    }
  }

  console.log("Finished locking all absentee members.");
};

const wipeAttendanceTimes = async () => {
  await db
    .update(schema.members)
    .set({ attendance_start_time: null })
    .where(not(isNull(schema.members.attendance_start_time)));
  await db
    .update(schema.members)
    .set({ attendance_end_time: null })
    .where(not(isNull(schema.members.attendance_end_time)));
};

const getDailyVerses = async (start: string, end: string) => {
  const verses = await db
    .select()
    .from(schema.dailyVerses)
    .where(
      and(
        gte(schema.dailyVerses.date, start),
        lte(schema.dailyVerses.date, end),
      ),
    );
  return verses;
};

const upsertDailyVerses = async (verses: VerseEntry[]) => {
  await db
    .insert(schema.dailyVerses)
    .values(verses)
    .onConflictDoUpdate({
      target: schema.dailyVerses.date,
      set: {
        small: sql`excluded.small`,
        medium: sql`excluded.medium`,
        large: sql`excluded.large`,
      },
    });
};

const getTodayVerse = async (date: string) => {
  const todayVerse = await db.query.dailyVerses.findFirst({
    where: (dailyVerses, { eq }) => eq(dailyVerses.date, date),
  });
  return todayVerse;
};

const findDailVerseMembers = async () => {
  const dailyVerseMembers = await db.query.members.findMany({
    columns: {
      id: true,
      name: true,
      phone: true,
      stream: true,
      daily_verse: true,
    },
    where: (members, { isNotNull }) => isNotNull(members.daily_verse),
  });
  return dailyVerseMembers;
};

const findMembersWithBirthday = async (date: string) => {
  const birthdayMembers = await db
    .select({
      id: schema.members.id,
      name: schema.members.name,
      phone: schema.members.phone,
      stream: schema.members.stream,
    })
    .from(schema.members)
    .where(sql`substr(${schema.members.dob}, 6, 5) = ${date}`);
  return birthdayMembers;
};

const findMembersWithAnniversary = async (date: string) => {
  const anniversaryMembers = await db
    .select({
      id: schema.members.id,
      name: schema.members.name,
      phone: schema.members.phone,
      stream: schema.members.stream,
    })
    .from(schema.members)
    .where(sql`substr(${schema.members.dom}, 6, 5) = ${date}`);
  return anniversaryMembers;
};

const removeMember = async (id: number) => {
  await db.delete(schema.members).where(eq(schema.members.id, id));
};

const checkConflictingMember = async (
  idToExclude: number,
  phone: string,
  stream: Stream,
) => {
  const result = await db
    .select({ id: schema.members.id })
    .from(schema.members)
    .where(
      and(
        eq(schema.members.phone, phone),
        eq(schema.members.stream, stream),
        ne(schema.members.id, idToExclude),
      ),
    )
    .limit(1);

  return result.length > 0;
};

export {
  registerMember,
  registerSubAdmin,
  checkMemberExistence,
  checkMemberExistenceWithId,
  checkIfMemberLocked,
  getStreamAdminPhone,
  pushToLockQueue,
  consumeLockQueue,
  findMember,
  checkSubAdminExistenceWithId,
  markMemberAttendanceStart,
  markMemberAttendanceEnd,
  lockMember,
  findAbsentees,
  bulkLockMembers,
  wipeAttendanceTimes,
  getDailyVerses,
  upsertDailyVerses,
  getTodayVerse,
  findDailVerseMembers,
  findMembersWithBirthday,
  findMembersWithAnniversary,
  getMembers,
  removeMember,
  updateMember,
  checkConflictingMember,
  getAllSubAdmins,
  updateSubAdmins,
  findMemberByID,
};
