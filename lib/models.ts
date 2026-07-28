export type EntryCategory =
  | "work"
  | "personal"
  | "health"
  | "social"
  | "sports";

export type RecurrenceType = "none" | "daily" | "weekly" | "monthly" | "yearly";

// ─── Application Domain Models ───────────────────────────────

export interface CalendarEntry {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  description: string;
  categories: EntryCategory[]; // Array of categories for this entry
  people?: string[]; // IDs of people associated with this entry
  photos?: string[]; // Array of local file URIs or remote URLs for attached photos
  recurrence?: RecurrenceType; // Recurrence rule
  recurrenceEndDate?: string; // Optional end date (YYYY-MM-DD)
  notifyEnabled?: boolean; // Whether to send push notification
  notifyMinutesBefore?: number; // Minutes before the day starts to notify
  createdAt: number;
}

export interface Person {
  id: string;
  name: string;
  phone: string;
  email: string;
  notes: string;
  avatarColor: string;
  photo?: string; // Local file URI or remote URL for profile picture
  createdAt: number;
}

// ─── Supabase Database Models (SQL Table Schemas) ────────────

export interface DbEntry {
  id: string;
  date: string;
  title: string;
  description: string;
  categories: string[];
  people: string[];
  photos: string[];
  recurrence: string;
  recurrence_end_date: string | null;
  notify_enabled: boolean;
  notify_minutes_before: number;
  created_at: number;
}

export interface DbPerson {
  id: string;
  name: string;
  phone: string;
  email: string;
  notes: string;
  avatar_color: string;
  photo: string | null;
  created_at: number;
}

// ─── Model Mappers (Domain <-> Database) ─────────────────────

export function mapDbToEntry(row: Partial<DbEntry> & { id: string; date: string; title: string }): CalendarEntry {
  return {
    id: row.id,
    date: row.date,
    title: row.title,
    description: row.description || "",
    categories: (row.categories as EntryCategory[]) || [],
    people: row.people || [],
    photos: row.photos || [],
    recurrence: (row.recurrence as RecurrenceType) || "none",
    recurrenceEndDate: row.recurrence_end_date || undefined,
    notifyEnabled: row.notify_enabled ?? false,
    notifyMinutesBefore: row.notify_minutes_before ?? 60,
    createdAt: Number(row.created_at || Date.now()),
  };
}

export function mapEntryToDb(entry: CalendarEntry): DbEntry {
  return {
    id: entry.id,
    date: entry.date,
    title: entry.title,
    description: entry.description || "",
    categories: entry.categories || [],
    people: entry.people || [],
    photos: entry.photos || [],
    recurrence: entry.recurrence || "none",
    recurrence_end_date: entry.recurrenceEndDate || null,
    notify_enabled: entry.notifyEnabled ?? false,
    notify_minutes_before: entry.notifyMinutesBefore ?? 60,
    created_at: entry.createdAt,
  };
}

export function mapDbToPerson(row: Partial<DbPerson> & { id: string; name: string }): Person {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone || "",
    email: row.email || "",
    notes: row.notes || "",
    avatarColor: row.avatar_color || AVATAR_COLORS[0],
    photo: row.photo || undefined,
    createdAt: Number(row.created_at || Date.now()),
  };
}

export function mapPersonToDb(person: Person): DbPerson {
  return {
    id: person.id,
    name: person.name,
    phone: person.phone || "",
    email: person.email || "",
    notes: person.notes || "",
    avatar_color: person.avatarColor,
    photo: person.photo || null,
    created_at: person.createdAt,
  };
}

// ─── UI Constants ────────────────────────────────────────────

export const CATEGORY_COLORS: Record<EntryCategory, string> = {
  work: "#6C63FF",
  personal: "#FF6B6B",
  health: "#4ECDC4",
  social: "#FFE66D",
  sports: "#FF8A5C",
};

export const CATEGORY_LABELS: Record<EntryCategory, string> = {
  work: "Work",
  personal: "Personal",
  health: "Health",
  social: "Social",
  sports: "Sports",
};

export const AVATAR_COLORS = [
  "#FF6B6B",
  "#4ECDC4",
  "#6C63FF",
  "#FFE66D",
  "#FF8A5C",
  "#A8E6CF",
  "#DDA0DD",
  "#87CEEB",
  "#F0E68C",
  "#98D8C8",
  "#FF7675",
  "#74B9FF",
];
