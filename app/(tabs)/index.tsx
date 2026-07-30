import { CalendarGrid } from "@/components/calendar/CalendarGrid";
import { DayDetail } from "@/components/calendar/DayDetail";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTranslation } from "@/i18n/LanguageContext";
import { translations } from "@/i18n";
import { CalendarEntry } from "@/lib/models";
import {
  deleteEntry,
  getEntriesForDate,
  getEntriesForMonth,
} from "@/lib/storage";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function CalendarScreen() {
  const colorScheme = useColorScheme() ?? "dark";
  const colors = Colors[colorScheme as "light" | "dark"];
  const router = useRouter();
  const { t, language } = useTranslation();

  const monthNames = translations[language].calendar.months;

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-indexed
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [datesWithEntries, setDatesWithEntries] = useState<Set<string>>(
    new Set(),
  );
  const [dayEntries, setDayEntries] = useState<CalendarEntry[]>([]);

  const loadMonth = useCallback(async () => {
    const entries = await getEntriesForMonth(year, month + 1);
    const dateSet = new Set(entries.map((e) => e.date));
    setDatesWithEntries(dateSet);
  }, [year, month]);

  const loadDay = useCallback(async () => {
    if (selectedDate) {
      const entries = await getEntriesForDate(selectedDate);
      setDayEntries(entries.sort((a, b) => a.createdAt - b.createdAt));
    }
  }, [selectedDate]);

  useFocusEffect(
    useCallback(() => {
      loadMonth();
      loadDay();
    }, [loadMonth, loadDay]),
  );

  const goToPrevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const goToNextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  const handleSelectDate = (date: string) => {
    setSelectedDate(date);
    // If selected date changes month, update month
    const [y, m] = date.split("-").map(Number);
    if (y !== year || m - 1 !== month) {
      setYear(y);
      setMonth(m - 1);
    }
  };

  const handleDeleteEntry = async (id: string) => {
    await deleteEntry(id);
    await loadMonth();
    await loadDay();
  };

  const handleAddEntry = () => {
    router.push({ pathname: "/add-entry", params: { date: selectedDate } });
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {t("calendar.title")}
        </Text>
      </View>

      {/* Month navigation */}
      <View style={[styles.monthNav, { backgroundColor: colors.surface }]}>
        <TouchableOpacity onPress={goToPrevMonth} style={styles.navButton}>
          <MaterialIcons name="chevron-left" size={28} color={colors.tint} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            setMonth(now.getMonth());
            setYear(now.getFullYear());
          }}
        >
          <Text style={[styles.monthTitle, { color: colors.text }]}>
            {monthNames[month]} {year}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
          <MaterialIcons name="chevron-right" size={28} color={colors.tint} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Calendar grid */}
        <View
          style={[
            styles.calendarCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <CalendarGrid
            year={year}
            month={month}
            selectedDate={selectedDate}
            datesWithEntries={datesWithEntries}
            onSelectDate={handleSelectDate}
          />
        </View>

        {/* Day detail */}
        {selectedDate && (
          <DayDetail
            date={selectedDate}
            entries={dayEntries}
            onDeleteEntry={handleDeleteEntry}
          />
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.fab }]}
        onPress={handleAddEntry}
        activeOpacity={0.8}
      >
        <MaterialIcons name="add" size={28} color={colors.fabText} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  navButton: {
    padding: 4,
  },
  monthTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  scrollView: {
    flex: 1,
  },
  calendarCard: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    paddingTop: 8,
  },
  fab: {
    position: "absolute",
    bottom: 28,
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#6C63FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
});
