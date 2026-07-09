export type EntryCategory =
  | "work"
  | "personal"
  | "health"
  | "social"
  | "sports";
export type RecurrenceType = "none" | "daily" | "weekly" | "monthly" | "yearly";

export interface CalendarEntry {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  description: string;
  categories: EntryCategory[]; // Array of categories for this entry
  people?: string[]; // IDs of people associated with this entry
  photos?: string[]; // Array of local file URIs for attached photos
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
  photo?: string; // Local file URI for profile picture
  createdAt: number;
}

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
