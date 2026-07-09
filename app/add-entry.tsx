import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  CalendarEntry,
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  EntryCategory,
  Person,
  RecurrenceType,
} from "@/lib/models";
import { detectCategories, extractPotentialPeople } from "@/lib/nlp";
import {
  cancelEntryNotification,
  scheduleEntryNotification,
} from "@/lib/notifications";
import {
  deletePhoto,
  pickPhoto,
  savePhotoLocally,
  takePhoto,
} from "@/lib/photos";
import {
  getAllPeople,
  getEntryById,
  saveEntry,
  savePerson,
  updateEntry,
} from "@/lib/storage";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const CATEGORIES: EntryCategory[] = [
  "work",
  "personal",
  "health",
  "social",
  "sports",
];
const RECURRENCE_OPTIONS: RecurrenceType[] = [
  "none",
  "daily",
  "weekly",
  "monthly",
  "yearly",
];

export default function AddEntryScreen() {
  const colorScheme = useColorScheme() ?? "dark";
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { date, entryId } = useLocalSearchParams<{
    date: string;
    entryId: string;
  }>();

  // Basic fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categories, setCategories] = useState<EntryCategory[]>(["personal"]);
  const [saving, setSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentEntry, setCurrentEntry] = useState<CalendarEntry | null>(null);

  // Photos
  const [photos, setPhotos] = useState<string[]>([]);
  const [showPhotoMenu, setShowPhotoMenu] = useState(false);

  // Recurrence and notifications
  const [recurrence, setRecurrence] = useState<RecurrenceType>("none");
  const [recurrenceEndDate, setRecurrenceEndDate] = useState("");
  const [notifyEnabled, setNotifyEnabled] = useState(false);
  const [notifyMinutesBefore, setNotifyMinutesBefore] = useState(0);

  // Auto-detection states
  const [allPeople, setAllPeople] = useState<Person[]>([]);
  const [selectedPeopleIds, setSelectedPeopleIds] = useState<string[]>([]);
  const [ignoredPeopleNames, setIgnoredPeopleNames] = useState<string[]>([]);
  const [removedPeopleIds, setRemovedPeopleIds] = useState<string[]>([]);
  const [detectedNewPeople, setDetectedNewPeople] = useState<string[]>([]);
  const [categoryManuallySelected, setCategoryManuallySelected] =
    useState(false);

  // Load entry if editing
  useEffect(() => {
    const loadEntry = async () => {
      if (entryId) {
        const entry = await getEntryById(entryId);
        if (entry) {
          setIsEditMode(true);
          setCurrentEntry(entry);
          setTitle(entry.title);
          setDescription(entry.description);
          setCategories(entry.categories);
          setSelectedPeopleIds(entry.people || []);
          setPhotos(entry.photos || []);
          setRecurrence(entry.recurrence || "none");
          setRecurrenceEndDate(entry.recurrenceEndDate || "");
          setNotifyEnabled(entry.notifyEnabled || false);
          setNotifyMinutesBefore(entry.notifyMinutesBefore || 0);
          setCategoryManuallySelected(true);
        }
      }
    };
    loadEntry();
  }, [entryId]);

  // Load existing contacts
  useEffect(() => {
    const loadPeople = async () => {
      const list = await getAllPeople();
      setAllPeople(list);
    };
    loadPeople();
  }, []);

  // Text change listener for NLP
  useEffect(() => {
    // 1. Category Detection
    if (!categoryManuallySelected) {
      const detectedCats = detectCategories(title, description);
      if (detectedCats.length > 0) {
        const equal =
          detectedCats.length === categories.length &&
          detectedCats.every((c) => categories.includes(c));
        if (!equal) {
          setCategories(detectedCats);
        }
      }
    }

    // 2. People Extraction
    const textToParse = title + " " + description;
    const extractedNames = extractPotentialPeople(textToParse);

    const matchingIds: string[] = [];
    const newNames: string[] = [];

    extractedNames.forEach((name) => {
      const existing = allPeople.find(
        (p) => p.name.toLowerCase() === name.toLowerCase(),
      );
      if (existing) {
        matchingIds.push(existing.id);
      } else {
        if (!ignoredPeopleNames.includes(name)) {
          newNames.push(name);
        }
      }
    });

    // Auto-select matching contacts, skipping any the user has manually unlinked (removedPeopleIds)
    setSelectedPeopleIds((prev) => {
      const autoAdded = matchingIds.filter(
        (id) => !removedPeopleIds.includes(id),
      );
      const combined = Array.from(new Set([...prev, ...autoAdded]));
      return combined;
    });

    setDetectedNewPeople(newNames);
  }, [
    title,
    description,
    allPeople,
    ignoredPeopleNames,
    categoryManuallySelected,
    removedPeopleIds,
    categories,
  ]);

  const handleAddContact = async (name: string) => {
    const saved = await savePerson({
      name,
      phone: "",
      email: "",
      notes: "Added from agenda entry auto-detection",
    });
    setAllPeople((prev) => [...prev, saved]);
    setSelectedPeopleIds((prev) => [...prev, saved.id]);
    setDetectedNewPeople((prev) => prev.filter((n) => n !== name));
  };

  const handleIgnoreContact = (name: string) => {
    setIgnoredPeopleNames((prev) => [...prev, name]);
    setDetectedNewPeople((prev) => prev.filter((n) => n !== name));
  };

  const handleRemovePerson = (id: string) => {
    setSelectedPeopleIds((prev) => prev.filter((pId) => pId !== id));
    setRemovedPeopleIds((prev) => [...prev, id]);
  };

  const handleCategoryToggle = (cat: EntryCategory) => {
    setCategoryManuallySelected(true);
    setCategories((prev) => {
      if (prev.includes(cat)) {
        if (prev.length === 1) return prev;
        return prev.filter((c) => c !== cat);
      } else {
        return [...prev, cat];
      }
    });
  };

  const handleAddPhotoFromGallery = async () => {
    const uri = await pickPhoto();
    if (uri) {
      const savedUri = await savePhotoLocally(uri);
      setPhotos((prev) => [...prev, savedUri]);
    }
    setShowPhotoMenu(false);
  };

  const handleAddPhotoFromCamera = async () => {
    const uri = await takePhoto();
    if (uri) {
      const savedUri = await savePhotoLocally(uri);
      setPhotos((prev) => [...prev, savedUri]);
    }
    setShowPhotoMenu(false);
  };

  const handleRemovePhoto = async (uri: string) => {
    await deletePhoto(uri);
    setPhotos((prev) => prev.filter((p) => p !== uri));
  };

  const formatDisplayDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    return dt.toLocaleDateString("en-US", {
      weekday: "short",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);

    const entryData = {
      date: date || new Date().toISOString().slice(0, 10),
      title: title.trim(),
      description: description.trim(),
      categories,
      people: selectedPeopleIds,
      photos,
      recurrence,
      recurrenceEndDate: recurrence !== "none" ? recurrenceEndDate : undefined,
      notifyEnabled,
      notifyMinutesBefore: notifyEnabled ? notifyMinutesBefore : undefined,
    };

    if (isEditMode && currentEntry) {
      await updateEntry(currentEntry.id, entryData);

      // Update notifications
      if (notifyEnabled) {
        await cancelEntryNotification(currentEntry.id);
        await scheduleEntryNotification({ ...currentEntry, ...entryData });
      } else {
        await cancelEntryNotification(currentEntry.id);
      }
    } else {
      const newEntry = await saveEntry(entryData);

      // Schedule notifications
      if (notifyEnabled) {
        await scheduleEntryNotification(newEntry);
      }
    }

    setSaving(false);
    router.back();
  };

  const selectedPeople = allPeople.filter((p) =>
    selectedPeopleIds.includes(p.id),
  );

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Top bar */}
      <View style={[styles.topBar, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.topBarBtn}
        >
          <MaterialIcons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.topBarTitle, { color: colors.text }]}>
          {isEditMode ? "Edit Entry" : "New Entry"}
        </Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={!title.trim() || saving}
          style={[
            styles.saveBtn,
            {
              backgroundColor: title.trim()
                ? colors.tint
                : colors.surfaceElevated,
            },
          ]}
        >
          <Text
            style={[
              styles.saveBtnText,
              { color: title.trim() ? "#FFFFFF" : colors.placeholder },
            ]}
          >
            Save
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        {/* Date display */}
        <View
          style={[styles.dateRow, { backgroundColor: colors.surfaceElevated }]}
        >
          <MaterialIcons name="event" size={18} color={colors.tint} />
          <Text style={[styles.dateText, { color: colors.text }]}>
            {date ? formatDisplayDate(date) : "Today"}
          </Text>
        </View>

        {/* Title */}
        <TextInput
          style={[
            styles.titleInput,
            { color: colors.text, borderBottomColor: colors.border },
          ]}
          placeholder="What happened?"
          placeholderTextColor={colors.placeholder}
          value={title}
          onChangeText={setTitle}
          autoFocus
          maxLength={100}
        />

        {/* Description */}
        <TextInput
          style={[
            styles.descriptionInput,
            { color: colors.text, backgroundColor: colors.inputBackground },
          ]}
          placeholder="Add details..."
          placeholderTextColor={colors.placeholder}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          maxLength={500}
        />

        {/* Photos Section */}
        <View style={styles.photosSection}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            PHOTOS
          </Text>
          <View style={styles.photosContainer}>
            {photos.map((uri, idx) => (
              <View key={idx} style={styles.photoThumbnail}>
                <Image source={{ uri }} style={styles.photoImage} />
                <TouchableOpacity
                  style={[
                    styles.photoRemoveBtn,
                    { backgroundColor: colors.tint },
                  ]}
                  onPress={() => handleRemovePhoto(uri)}
                >
                  <MaterialIcons name="close" size={12} color="#FFF" />
                </TouchableOpacity>
              </View>
            ))}
            {showPhotoMenu && (
              <View
                style={[
                  styles.photoMenu,
                  {
                    backgroundColor: colors.surfaceElevated,
                    borderColor: colors.border,
                  },
                ]}
              >
                <TouchableOpacity
                  style={styles.photoMenuBtn}
                  onPress={handleAddPhotoFromGallery}
                >
                  <MaterialIcons name="image" size={20} color={colors.tint} />
                  <Text
                    style={[styles.photoMenuBtnText, { color: colors.text }]}
                  >
                    Gallery
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.photoMenuBtn}
                  onPress={handleAddPhotoFromCamera}
                >
                  <MaterialIcons
                    name="photo-camera"
                    size={20}
                    color={colors.tint}
                  />
                  <Text
                    style={[styles.photoMenuBtnText, { color: colors.text }]}
                  >
                    Camera
                  </Text>
                </TouchableOpacity>
              </View>
            )}
            <TouchableOpacity
              style={[styles.addPhotoBtn, { borderColor: colors.tint }]}
              onPress={() => setShowPhotoMenu(!showPhotoMenu)}
            >
              <MaterialIcons name="add-a-photo" size={24} color={colors.tint} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Unrecognized people alert */}
        {detectedNewPeople.map((name) => (
          <View
            key={name}
            style={[
              styles.promptCard,
              {
                backgroundColor: colors.surfaceElevated,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.promptHeader}>
              <MaterialIcons name="person-add" size={20} color={colors.tint} />
              <Text style={[styles.promptTitle, { color: colors.text }]}>
                {`Vols afegir "${name}"?`}
              </Text>
            </View>
            <Text
              style={[styles.promptSubtitle, { color: colors.textSecondary }]}
            >
              No és a la teva llista de contactes. El vols afegir ara?
            </Text>
            <View style={styles.promptActions}>
              <TouchableOpacity
                style={[styles.promptButton, { backgroundColor: colors.tint }]}
                onPress={() => handleAddContact(name)}
              >
                <Text style={styles.promptButtonText}>Afegir</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.promptButtonSecondary,
                  { borderColor: colors.border },
                ]}
                onPress={() => handleIgnoreContact(name)}
              >
                <Text
                  style={[
                    styles.promptButtonTextSecondary,
                    { color: colors.textSecondary },
                  ]}
                >
                  Ignorar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* Selected people chips */}
        {selectedPeople.length > 0 && (
          <View style={styles.selectedPeopleContainer}>
            <Text
              style={[styles.sectionLabel, { color: colors.textSecondary }]}
            >
              AMB (PERSONES)
            </Text>
            <View style={styles.peopleChipsRow}>
              {selectedPeople.map((person) => (
                <View
                  key={person.id}
                  style={[
                    styles.personChip,
                    {
                      backgroundColor: person.avatarColor + "15",
                      borderColor: person.avatarColor,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.personChipDot,
                      { backgroundColor: person.avatarColor },
                    ]}
                  />
                  <Text style={[styles.personChipText, { color: colors.text }]}>
                    {person.name}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleRemovePerson(person.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <MaterialIcons
                      name="cancel"
                      size={16}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Category */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
          CATEGORY
        </Text>
        <View style={styles.categoryGrid}>
          {CATEGORIES.map((cat) => {
            const isActive = categories.includes(cat);
            return (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor: isActive
                      ? CATEGORY_COLORS[cat] + "25"
                      : colors.surfaceElevated,
                    borderColor: isActive
                      ? CATEGORY_COLORS[cat]
                      : colors.border,
                  },
                ]}
                onPress={() => handleCategoryToggle(cat)}
              >
                <View
                  style={[
                    styles.categoryDot,
                    { backgroundColor: CATEGORY_COLORS[cat] },
                  ]}
                />
                <Text
                  style={[
                    styles.categoryChipText,
                    {
                      color: isActive
                        ? CATEGORY_COLORS[cat]
                        : colors.textSecondary,
                    },
                  ]}
                >
                  {CATEGORY_LABELS[cat]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Recurrence Section */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
          RECURRENCE
        </Text>
        <View style={styles.recurrenceGrid}>
          {RECURRENCE_OPTIONS.map((rec) => {
            const isActive = recurrence === rec;
            return (
              <TouchableOpacity
                key={rec}
                style={[
                  styles.recurrenceChip,
                  {
                    backgroundColor: isActive
                      ? colors.tint + "25"
                      : colors.surfaceElevated,
                    borderColor: isActive ? colors.tint : colors.border,
                  },
                ]}
                onPress={() => setRecurrence(rec)}
              >
                <Text
                  style={[
                    styles.recurrenceChipText,
                    { color: isActive ? colors.tint : colors.textSecondary },
                  ]}
                >
                  {rec.charAt(0).toUpperCase() + rec.slice(1)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Recurrence end date */}
        {recurrence !== "none" && (
          <View
            style={[
              styles.endDateRow,
              { backgroundColor: colors.surfaceElevated },
            ]}
          >
            <MaterialIcons name="event" size={18} color={colors.tint} />
            <TextInput
              style={[styles.endDateInput, { color: colors.text }]}
              placeholder="End date (YYYY-MM-DD)"
              placeholderTextColor={colors.placeholder}
              value={recurrenceEndDate}
              onChangeText={setRecurrenceEndDate}
            />
          </View>
        )}

        {/* Notification Section */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
          NOTIFICATIONS
        </Text>
        <View
          style={[
            styles.notificationRow,
            {
              backgroundColor: colors.surfaceElevated,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.notificationLabel}>
            <MaterialIcons name="notifications" size={18} color={colors.tint} />
            <Text style={[styles.notificationText, { color: colors.text }]}>
              Send notification
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.toggle,
              {
                backgroundColor: notifyEnabled
                  ? colors.tint
                  : colors.inputBackground,
              },
            ]}
            onPress={() => setNotifyEnabled(!notifyEnabled)}
          >
            <View
              style={[
                styles.toggleDot,
                {
                  transform: [{ translateX: notifyEnabled ? 18 : 2 }],
                },
              ]}
            />
          </TouchableOpacity>
        </View>

        {notifyEnabled && (
          <View
            style={[
              styles.notificationMinutesRow,
              { backgroundColor: colors.surfaceElevated },
            ]}
          >
            <MaterialIcons name="schedule" size={18} color={colors.tint} />
            <TextInput
              style={[styles.minutesInput, { color: colors.text }]}
              placeholder="Minutes before"
              placeholderTextColor={colors.placeholder}
              value={notifyMinutesBefore.toString()}
              onChangeText={(text) =>
                setNotifyMinutesBefore(parseInt(text) || 0)
              }
              keyboardType="number-pad"
            />
            <Text
              style={[styles.minutesLabel, { color: colors.textSecondary }]}
            >
              minutes before
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 56,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  topBarBtn: {
    padding: 4,
  },
  topBarTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  saveBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: "700",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 20,
  },
  dateText: {
    fontSize: 14,
    fontWeight: "600",
  },
  titleInput: {
    fontSize: 22,
    fontWeight: "600",
    paddingVertical: 16,
    borderBottomWidth: 1,
    marginTop: 8,
  },
  descriptionInput: {
    fontSize: 15,
    padding: 14,
    borderRadius: 12,
    marginTop: 16,
    minHeight: 100,
    lineHeight: 22,
  },
  photosSection: {
    marginTop: 24,
  },
  photosContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    alignItems: "flex-start",
  },
  photoThumbnail: {
    position: "relative",
    width: 80,
    height: 80,
    borderRadius: 10,
    overflow: "hidden",
  },
  photoImage: {
    width: "100%",
    height: "100%",
  },
  photoRemoveBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  photoMenu: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    borderRadius: 10,
    borderWidth: 1,
    overflow: "hidden",
  },
  photoMenuBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  photoMenuBtnText: {
    fontSize: 14,
    fontWeight: "500",
  },
  addPhotoBtn: {
    width: 80,
    height: 80,
    borderRadius: 10,
    borderWidth: 2,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  promptCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 16,
  },
  promptHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  promptTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  promptSubtitle: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  promptActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  promptButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: "center",
  },
  promptButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  promptButtonSecondary: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
  },
  promptButtonTextSecondary: {
    fontSize: 13,
    fontWeight: "700",
  },
  selectedPeopleContainer: {
    marginTop: 20,
  },
  peopleChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  personChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  personChipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  personChipText: {
    fontSize: 13,
    fontWeight: "600",
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginTop: 24,
    marginBottom: 10,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 40,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 8,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: "600",
  },
  recurrenceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  recurrenceChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  recurrenceChipText: {
    fontSize: 14,
    fontWeight: "600",
  },
  endDateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 16,
  },
  endDateInput: {
    flex: 1,
    fontSize: 14,
  },
  notificationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
  },
  notificationLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  notificationText: {
    fontSize: 15,
    fontWeight: "600",
  },
  toggle: {
    width: 40,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
  },
  toggleDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
  },
  notificationMinutesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 16,
  },
  minutesInput: {
    width: 50,
    fontSize: 14,
  },
  minutesLabel: {
    fontSize: 14,
  },
});
