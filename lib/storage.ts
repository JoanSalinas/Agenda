import AsyncStorage from "@react-native-async-storage/async-storage";
import { AVATAR_COLORS, CalendarEntry, Person } from "./models";

const ENTRIES_KEY = "agenda_entries";
const PEOPLE_KEY = "agenda_people";

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

// ─── Calendar Entries ────────────────────────────────────────

export async function getAllEntries(): Promise<CalendarEntry[]> {
  const raw = await AsyncStorage.getItem(ENTRIES_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function getEntriesForMonth(
  year: number,
  month: number,
): Promise<CalendarEntry[]> {
  const all = await getAllEntries();
  const prefix = `${year}-${String(month).padStart(2, "0")}`;
  const directMatches = all.filter((e) => e.date.startsWith(prefix));

  // Add recurring entries that match this month
  const recurringMatches = all.filter(
    (e) => e.recurrence && e.recurrence !== "none",
  );
  const matchedRecurring = recurringMatches.flatMap((entry) =>
    generateRecurringDatesForMonth(entry, year, month).map((date) => ({
      ...entry,
      date,
    })),
  );

  return [...directMatches, ...matchedRecurring];
}

export async function getEntriesForDate(
  date: string,
): Promise<CalendarEntry[]> {
  const all = await getAllEntries();
  const directMatches = all.filter((e) => e.date === date);

  // Add recurring entries that match this date
  const [year, month, day] = date.split("-").map(Number);
  const recurringMatches = all.filter(
    (e) => e.recurrence && e.recurrence !== "none" && e.date <= date,
  );
  const matchedRecurring = recurringMatches.filter((entry) => {
    const matches = generateRecurringDatesForMonth(entry, year, month);
    return matches.includes(date);
  });

  return [...directMatches, ...matchedRecurring];
}

/**
 * Helper to generate recurring dates for a given month
 */
function generateRecurringDatesForMonth(
  entry: CalendarEntry,
  year: number,
  month: number,
): string[] {
  if (!entry.recurrence || entry.recurrence === "none") return [];

  const [entryYear, entryMonth, entryDay] = entry.date.split("-").map(Number);
  const endDate = entry.recurrenceEndDate
    ? new Date(entry.recurrenceEndDate)
    : new Date(year + 10, month - 1, 1); // Default 10 years out

  const dates: string[] = [];
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0);

  let current = new Date(entryYear, entryMonth - 1, entryDay);

  while (current <= monthEnd && current <= endDate) {
    if (current >= monthStart) {
      const dateStr = `${current.getFullYear()}-${String(
        current.getMonth() + 1,
      ).padStart(2, "0")}-${String(current.getDate()).padStart(2, "0")}`;
      dates.push(dateStr);
    }

    // Advance to next occurrence
    switch (entry.recurrence) {
      case "daily":
        current.setDate(current.getDate() + 1);
        break;
      case "weekly":
        current.setDate(current.getDate() + 7);
        break;
      case "monthly":
        current.setMonth(current.getMonth() + 1);
        break;
      case "yearly":
        current.setFullYear(current.getFullYear() + 1);
        break;
    }
  }

  return dates;
}

export async function saveEntry(
  entry: Omit<CalendarEntry, "id" | "createdAt">,
): Promise<CalendarEntry> {
  const all = await getAllEntries();
  const newEntry: CalendarEntry = {
    ...entry,
    id: generateId(),
    createdAt: Date.now(),
  };
  all.push(newEntry);
  await AsyncStorage.setItem(ENTRIES_KEY, JSON.stringify(all));
  return newEntry;
}

export async function updateEntry(
  id: string,
  updates: Partial<Omit<CalendarEntry, "id" | "createdAt">>,
): Promise<void> {
  const all = await getAllEntries();
  const idx = all.findIndex((e) => e.id === id);
  if (idx !== -1) {
    all[idx] = { ...all[idx], ...updates };
    await AsyncStorage.setItem(ENTRIES_KEY, JSON.stringify(all));
  }
}

export async function deleteEntry(id: string): Promise<void> {
  const all = await getAllEntries();
  const filtered = all.filter((e) => e.id !== id);
  await AsyncStorage.setItem(ENTRIES_KEY, JSON.stringify(filtered));
}

export async function getEntryById(id: string): Promise<CalendarEntry | null> {
  const all = await getAllEntries();
  return all.find((e) => e.id === id) || null;
}

// ─── People ──────────────────────────────────────────────────

export async function getAllPeople(): Promise<Person[]> {
  const raw = await AsyncStorage.getItem(PEOPLE_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function savePerson(
  person: Omit<Person, "id" | "createdAt" | "avatarColor">,
): Promise<Person> {
  const all = await getAllPeople();
  const newPerson: Person = {
    ...person,
    id: generateId(),
    avatarColor: AVATAR_COLORS[all.length % AVATAR_COLORS.length],
    createdAt: Date.now(),
  };
  all.push(newPerson);
  await AsyncStorage.setItem(PEOPLE_KEY, JSON.stringify(all));
  return newPerson;
}

export async function updatePerson(
  id: string,
  updates: Partial<Omit<Person, "id" | "createdAt">>,
): Promise<void> {
  const all = await getAllPeople();
  const idx = all.findIndex((p) => p.id === id);
  if (idx !== -1) {
    all[idx] = { ...all[idx], ...updates };
    await AsyncStorage.setItem(PEOPLE_KEY, JSON.stringify(all));
  }
}

export async function deletePerson(id: string): Promise<void> {
  const all = await getAllPeople();
  const filtered = all.filter((p) => p.id !== id);
  await AsyncStorage.setItem(PEOPLE_KEY, JSON.stringify(filtered));
}

export async function getPersonById(id: string): Promise<Person | null> {
  const all = await getAllPeople();
  return all.find((p) => p.id === id) || null;
}

// ─── Data Management ─────────────────────────────────────────

export async function clearAllData(): Promise<void> {
  await AsyncStorage.multiRemove([ENTRIES_KEY, PEOPLE_KEY]);
}

export async function getStats(): Promise<{ entries: number; people: number }> {
  const [entries, people] = await Promise.all([
    getAllEntries(),
    getAllPeople(),
  ]);
  return { entries: entries.length, people: people.length };
}
