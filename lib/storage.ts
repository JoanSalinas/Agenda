import AsyncStorage from "@react-native-async-storage/async-storage";
import { shouldUseCloud, getCurrentUserId } from "./AuthContext";
import {
  AVATAR_COLORS,
  CalendarEntry,
  DbEntry,
  DbPerson,
  Person,
  mapDbToEntry,
  mapDbToPerson,
  mapEntryToDb,
  mapPersonToDb,
} from "./models";
import { savePhoto } from "./photos";
import { supabase } from "./supabase";

const ENTRIES_KEY = "agenda_entries";
const PEOPLE_KEY = "agenda_people";

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

// ─── Helpers: Local Storage Direct ───────────────────────────

async function getAllEntriesLocal(): Promise<CalendarEntry[]> {
  const raw = await AsyncStorage.getItem(ENTRIES_KEY);
  return raw ? JSON.parse(raw) : [];
}

async function getAllPeopleLocal(): Promise<Person[]> {
  const raw = await AsyncStorage.getItem(PEOPLE_KEY);
  return raw ? JSON.parse(raw) : [];
}

// ─── Calendar Entries ────────────────────────────────────────

export async function getAllEntries(): Promise<CalendarEntry[]> {
  if (shouldUseCloud()) {
    try {
      const { data, error } = await supabase
        .from("entries")
        .select("*")
        .order("created_at", { ascending: true });

      if (!error && data) {
        const entries = data.map(mapDbToEntry);
        await AsyncStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
        return entries;
      } else if (error) {
        console.warn("Supabase fetch entries error, falling back to local cache:", error.message);
      }
    } catch (err) {
      console.warn("Error connecting to Supabase entries table:", err);
    }
  }

  return getAllEntriesLocal();
}

export async function getEntriesForMonth(
  year: number,
  month: number
): Promise<CalendarEntry[]> {
  const all = await getAllEntries();
  const prefix = `${year}-${String(month).padStart(2, "0")}`;
  const directMatches = all.filter((e) => e.date.startsWith(prefix));

  // Add recurring entries that match this month
  const recurringMatches = all.filter(
    (e) => e.recurrence && e.recurrence !== "none"
  );
  const matchedRecurring = recurringMatches.flatMap((entry) =>
    generateRecurringDatesForMonth(entry, year, month).map((date) => ({
      ...entry,
      date,
    }))
  );

  return [...directMatches, ...matchedRecurring];
}

export async function getEntriesForDate(
  date: string
): Promise<CalendarEntry[]> {
  const all = await getAllEntries();
  const directMatches = all.filter((e) => e.date === date);

  // Add recurring entries that match this date
  const [year, month] = date.split("-").map(Number);
  const recurringMatches = all.filter(
    (e) => e.recurrence && e.recurrence !== "none" && e.date <= date
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
  month: number
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
        current.getMonth() + 1
      ).padStart(2, "0")}-${String(current.getDate()).padStart(2, "0")}`;
      dates.push(dateStr);
    }

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
  entry: Omit<CalendarEntry, "id" | "createdAt">
): Promise<CalendarEntry> {
  // Upload any attached photos to Supabase Storage / local
  let uploadedPhotos: string[] = [];
  if (entry.photos && entry.photos.length > 0) {
    uploadedPhotos = await Promise.all(entry.photos.map((p) => savePhoto(p)));
  }

  const newEntry: CalendarEntry = {
    ...entry,
    photos: uploadedPhotos,
    id: generateId(),
    createdAt: Date.now(),
  };

  if (shouldUseCloud()) {
    try {
      const dbRow = mapEntryToDb(newEntry, getCurrentUserId());
      const { error } = await supabase.from("entries").insert([dbRow]);
      if (error) {
        console.warn("Supabase save entry error:", error.message);
      }
    } catch (err) {
      console.warn("Error saving entry to Supabase:", err);
    }
  }

  const localAll = await getAllEntriesLocal();
  localAll.push(newEntry);
  await AsyncStorage.setItem(ENTRIES_KEY, JSON.stringify(localAll));

  return newEntry;
}

export async function updateEntry(
  id: string,
  updates: Partial<Omit<CalendarEntry, "id" | "createdAt">>
): Promise<void> {
  let updatedUpdates = { ...updates };
  if (updates.photos && updates.photos.length > 0) {
    updatedUpdates.photos = await Promise.all(updates.photos.map((p) => savePhoto(p)));
  }

  if (shouldUseCloud()) {
    try {
      const dbUpdates: any = {};
      if (updatedUpdates.date !== undefined) dbUpdates.date = updatedUpdates.date;
      if (updatedUpdates.title !== undefined) dbUpdates.title = updatedUpdates.title;
      if (updatedUpdates.description !== undefined)
        dbUpdates.description = updatedUpdates.description;
      if (updatedUpdates.categories !== undefined)
        dbUpdates.categories = updatedUpdates.categories;
      if (updatedUpdates.people !== undefined) dbUpdates.people = updatedUpdates.people;
      if (updatedUpdates.photos !== undefined) dbUpdates.photos = updatedUpdates.photos;
      if (updatedUpdates.recurrence !== undefined)
        dbUpdates.recurrence = updatedUpdates.recurrence;
      if (updatedUpdates.recurrenceEndDate !== undefined)
        dbUpdates.recurrence_end_date = updatedUpdates.recurrenceEndDate;
      if (updatedUpdates.notifyEnabled !== undefined)
        dbUpdates.notify_enabled = updatedUpdates.notifyEnabled;
      if (updatedUpdates.notifyMinutesBefore !== undefined)
        dbUpdates.notify_minutes_before = updatedUpdates.notifyMinutesBefore;

      const { error } = await supabase
        .from("entries")
        .update(dbUpdates)
        .eq("id", id);
      if (error) {
        console.warn("Supabase update entry error:", error.message);
      }
    } catch (err) {
      console.warn("Error updating entry in Supabase:", err);
    }
  }

  const localAll = await getAllEntriesLocal();
  const idx = localAll.findIndex((e) => e.id === id);
  if (idx !== -1) {
    localAll[idx] = { ...localAll[idx], ...updatedUpdates };
    await AsyncStorage.setItem(ENTRIES_KEY, JSON.stringify(localAll));
  }
}

export async function deleteEntry(id: string): Promise<void> {
  if (shouldUseCloud()) {
    try {
      const { error } = await supabase.from("entries").delete().eq("id", id);
      if (error) {
        console.warn("Supabase delete entry error:", error.message);
      }
    } catch (err) {
      console.warn("Error deleting entry from Supabase:", err);
    }
  }

  const localAll = await getAllEntriesLocal();
  const filtered = localAll.filter((e) => e.id !== id);
  await AsyncStorage.setItem(ENTRIES_KEY, JSON.stringify(filtered));
}

export async function getEntryById(id: string): Promise<CalendarEntry | null> {
  const all = await getAllEntries();
  return all.find((e) => e.id === id) || null;
}

// ─── People ──────────────────────────────────────────────────

export async function getAllPeople(): Promise<Person[]> {
  if (shouldUseCloud()) {
    try {
      const { data, error } = await supabase
        .from("people")
        .select("*")
        .order("created_at", { ascending: true });

      if (!error && data) {
        const people = data.map(mapDbToPerson);
        await AsyncStorage.setItem(PEOPLE_KEY, JSON.stringify(people));
        return people;
      } else if (error) {
        console.warn("Supabase fetch people error, falling back to local cache:", error.message);
      }
    } catch (err) {
      console.warn("Error connecting to Supabase people table:", err);
    }
  }

  return getAllPeopleLocal();
}

export async function savePerson(
  person: Omit<Person, "id" | "createdAt" | "avatarColor">
): Promise<Person> {
  const allPeople = await getAllPeople();

  let uploadedPhoto = person.photo;
  if (person.photo) {
    uploadedPhoto = await savePhoto(person.photo);
  }

  const newPerson: Person = {
    ...person,
    photo: uploadedPhoto,
    id: generateId(),
    avatarColor: AVATAR_COLORS[allPeople.length % AVATAR_COLORS.length],
    createdAt: Date.now(),
  };

  if (shouldUseCloud()) {
    try {
      const dbRow = mapPersonToDb(newPerson, getCurrentUserId());
      const { error } = await supabase.from("people").insert([dbRow]);
      if (error) {
        console.warn("Supabase save person error:", error.message);
      }
    } catch (err) {
      console.warn("Error saving person to Supabase:", err);
    }
  }

  const localAll = await getAllPeopleLocal();
  localAll.push(newPerson);
  await AsyncStorage.setItem(PEOPLE_KEY, JSON.stringify(localAll));

  return newPerson;
}

export async function updatePerson(
  id: string,
  updates: Partial<Omit<Person, "id" | "createdAt">>
): Promise<void> {
  let updatedUpdates = { ...updates };
  if (updates.photo) {
    updatedUpdates.photo = await savePhoto(updates.photo);
  }

  if (shouldUseCloud()) {
    try {
      const dbUpdates: any = {};
      if (updatedUpdates.name !== undefined) dbUpdates.name = updatedUpdates.name;
      if (updatedUpdates.phone !== undefined) dbUpdates.phone = updatedUpdates.phone;
      if (updatedUpdates.email !== undefined) dbUpdates.email = updatedUpdates.email;
      if (updatedUpdates.notes !== undefined) dbUpdates.notes = updatedUpdates.notes;
      if (updatedUpdates.avatarColor !== undefined)
        dbUpdates.avatar_color = updatedUpdates.avatarColor;
      if (updatedUpdates.photo !== undefined) dbUpdates.photo = updatedUpdates.photo;

      const { error } = await supabase
        .from("people")
        .update(dbUpdates)
        .eq("id", id);
      if (error) {
        console.warn("Supabase update person error:", error.message);
      }
    } catch (err) {
      console.warn("Error updating person in Supabase:", err);
    }
  }

  const localAll = await getAllPeopleLocal();
  const idx = localAll.findIndex((p) => p.id === id);
  if (idx !== -1) {
    localAll[idx] = { ...localAll[idx], ...updatedUpdates };
    await AsyncStorage.setItem(PEOPLE_KEY, JSON.stringify(localAll));
  }
}

export async function deletePerson(id: string): Promise<void> {
  if (shouldUseCloud()) {
    try {
      const { error } = await supabase.from("people").delete().eq("id", id);
      if (error) {
        console.warn("Supabase delete person error:", error.message);
      }
    } catch (err) {
      console.warn("Error deleting person from Supabase:", err);
    }
  }

  const localAll = await getAllPeopleLocal();
  const filtered = localAll.filter((p) => p.id !== id);
  await AsyncStorage.setItem(PEOPLE_KEY, JSON.stringify(filtered));
}

export async function getPersonById(id: string): Promise<Person | null> {
  const all = await getAllPeople();
  return all.find((p) => p.id === id) || null;
}

// ─── Data Management ─────────────────────────────────────────

export async function clearAllData(): Promise<void> {
  if (shouldUseCloud()) {
    try {
      await Promise.all([
        supabase.from("entries").delete().neq("id", ""),
        supabase.from("people").delete().neq("id", ""),
      ]);
    } catch (err) {
      console.warn("Error clearing Supabase data:", err);
    }
  }
  await AsyncStorage.multiRemove([ENTRIES_KEY, PEOPLE_KEY]);
}

export async function getStats(): Promise<{ entries: number; people: number }> {
  const [entries, people] = await Promise.all([
    getAllEntries(),
    getAllPeople(),
  ]);
  return { entries: entries.length, people: people.length };
}

// ─── Sync: Local → Cloud ────────────────────────────────────

export async function syncLocalToCloud(): Promise<void> {
  const userId = getCurrentUserId();
  if (!userId) return;

  const localEntries = await getAllEntriesLocal();
  const localPeople = await getAllPeopleLocal();

  if (localEntries.length > 0) {
    try {
      const dbRows = localEntries.map((e) => mapEntryToDb(e, userId));
      const { error } = await supabase.from("entries").upsert(dbRows, { onConflict: "id" });
      if (error) console.warn("Sync entries error:", error.message);
    } catch (err) {
      console.warn("Error syncing entries to cloud:", err);
    }
  }

  if (localPeople.length > 0) {
    try {
      const dbRows = localPeople.map((p) => mapPersonToDb(p, userId));
      const { error } = await supabase.from("people").upsert(dbRows, { onConflict: "id" });
      if (error) console.warn("Sync people error:", error.message);
    } catch (err) {
      console.warn("Error syncing people to cloud:", err);
    }
  }
}
