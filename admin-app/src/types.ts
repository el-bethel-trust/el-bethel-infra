export type Stream = 'MALE' | 'FEMALE' | 'FUTURE';
export type DailyVerse = 'SMALL' | 'MEDIUM' | 'LARGE';
export type SubAdmins = Record<Stream, number | null>;

export interface Member {
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
}

export type StreamFilter = 'ALL' | 'MALE' | 'FEMALE' | 'FUTURE' | 'LOCKED';
