import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTranslation } from "@/i18n/LanguageContext";
import {
  CalendarEntry,
  CATEGORY_COLORS,
  Person,
} from "@/lib/models";
import { getAllPeople } from "@/lib/storage";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface DayDetailProps {
  date: string;
  entries: CalendarEntry[];
  onDeleteEntry: (id: string) => void;
}

export function DayDetail({ date, entries, onDeleteEntry }: DayDetailProps) {
  const colorScheme = useColorScheme() ?? "dark";
  const colors = Colors[colorScheme as "light" | "dark"];
  const router = useRouter();
  const { t, locale } = useTranslation();

  const [allPeople, setAllPeople] = useState<Person[]>([]);

  useEffect(() => {
    const loadPeople = async () => {
      const list = await getAllPeople();
      setAllPeople(list);
    };
    loadPeople();
  }, [entries]);

  const formatDisplayDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    return dt.toLocaleDateString(locale, {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  };

  const confirmDelete = (id: string, title: string) => {
    Alert.alert(
      t("calendar.deleteAlertTitle"),
      t("calendar.deleteAlertMessage", { title }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: () => onDeleteEntry(id),
        },
      ]
    );
  };

  const handleEditEntry = (entryId: string) => {
    router.push({
      pathname: "/add-entry",
      params: { entryId, date },
    });
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.dateHeader, { color: colors.text }]}>
        {formatDisplayDate(date)}
      </Text>

      {entries.length === 0 ? (
        <View
          style={[
            styles.emptyState,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <MaterialIcons
            name="event-note"
            size={40}
            color={colors.textSecondary}
          />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {t("calendar.emptyStateTitle")}
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.placeholder }]}>
            {t("calendar.emptyStateSubtext")}
          </Text>
        </View>
      ) : (
        entries.map((entry) => {
          const entryPeople = allPeople.filter((p) =>
            entry.people?.includes(p.id),
          );
          const entryCategories = entry.categories || ["personal"];

          return (
            <View
              key={entry.id}
              style={[
                styles.entryCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <View style={styles.categoryBarContainer}>
                {entryCategories.map((cat) => (
                  <View
                    key={cat}
                    style={{ flex: 1, backgroundColor: CATEGORY_COLORS[cat] }}
                  />
                ))}
              </View>
              <View style={styles.entryContent}>
                <View style={styles.entryHeader}>
                  <View style={styles.entryTitleContainer}>
                    <Text style={[styles.entryTitle, { color: colors.text }]}>
                      {entry.title}
                    </Text>
                    {entry.recurrence && entry.recurrence !== "none" && (
                      <MaterialIcons
                        name="repeat"
                        size={14}
                        color={colors.textSecondary}
                        style={styles.recurrenceIcon}
                      />
                    )}
                  </View>
                  <View style={styles.entryActions}>
                    <TouchableOpacity
                      onPress={() => handleEditEntry(entry.id)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <MaterialIcons
                        name="edit"
                        size={18}
                        color={colors.tint}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => confirmDelete(entry.id, entry.title)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      style={{ marginLeft: 8 }}
                    >
                      <MaterialIcons
                        name="close"
                        size={18}
                        color={colors.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
                {entry.description ? (
                  <Text
                    style={[
                      styles.entryDescription,
                      { color: colors.textSecondary },
                    ]}
                    numberOfLines={2}
                  >
                    {entry.description}
                  </Text>
                ) : null}

                {/* Photos */}
                {entry.photos && entry.photos.length > 0 && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.photosRow}
                  >
                    {entry.photos.map((photoUri, idx) => (
                      <Image
                        key={idx}
                        source={{ uri: photoUri }}
                        style={styles.photoThumbnail}
                      />
                    ))}
                  </ScrollView>
                )}

                <View style={styles.entryFooter}>
                  <View style={styles.categoriesRow}>
                    {entryCategories.map((cat) => (
                      <View
                        key={cat}
                        style={[
                          styles.categoryPill,
                          { backgroundColor: CATEGORY_COLORS[cat] + "20" },
                        ]}
                      >
                        <Text
                          style={[
                            styles.categoryText,
                            { color: CATEGORY_COLORS[cat] },
                          ]}
                        >
                          {t(`categories.${cat}`)}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {entryPeople.length > 0 && (
                    <View style={styles.peopleRow}>
                      <View style={styles.avatarList}>
                        {entryPeople.map((p, index) => {
                          const initials = p.name
                            .split(" ")
                            .map((w) => w[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2);
                          return (
                            <View
                              key={p.id}
                              style={[
                                styles.miniAvatar,
                                {
                                  backgroundColor: p.avatarColor,
                                  borderColor: colors.surface,
                                  marginLeft: index === 0 ? 0 : -6,
                                },
                              ]}
                            >
                              <Text style={styles.miniAvatarText}>
                                {initials}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                      <Text
                        style={[
                          styles.peopleNamesText,
                          { color: colors.textSecondary },
                        ]}
                        numberOfLines={1}
                      >
                        {entryPeople
                          .map((p) => p.name.split(" ")[0])
                          .join(", ")}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 100,
  },
  dateHeader: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    marginTop: 4,
  },
  entryCard: {
    flexDirection: "row",
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    overflow: "hidden",
  },
  categoryBarContainer: {
    width: 4,
    flexDirection: "column",
  },
  categoriesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  entryContent: {
    flex: 1,
    padding: 14,
  },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  entryTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },
  entryTitle: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  recurrenceIcon: {
    marginLeft: 6,
  },
  entryActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  entryDescription: {
    fontSize: 13,
    marginTop: 6,
    lineHeight: 18,
  },
  photosRow: {
    marginTop: 10,
    marginHorizontal: -14,
    paddingHorizontal: 14,
  },
  photoThumbnail: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 8,
  },
  entryFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  categoryPill: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  peopleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  avatarList: {
    flexDirection: "row",
    alignItems: "center",
  },
  miniAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
  miniAvatarText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "700",
  },
  peopleNamesText: {
    fontSize: 12,
    fontWeight: "500",
  },
});
