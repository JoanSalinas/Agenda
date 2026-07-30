import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTranslation } from '@/i18n/LanguageContext';
import { translations } from '@/i18n';

interface CalendarGridProps {
  year: number;
  month: number; // 0-indexed
  selectedDate: string | null; // YYYY-MM-DD
  datesWithEntries: Set<string>;
  onSelectDate: (date: string) => void;
}

export function CalendarGrid({ year, month, selectedDate, datesWithEntries, onSelectDate }: CalendarGridProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const { language } = useTranslation();

  const dayNames = translations[language].calendar.daysShort;

  const today = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const weeks = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    // Monday = 0, Sunday = 6
    let startDow = firstDay.getDay() - 1;
    if (startDow < 0) startDow = 6;

    const cells: (number | null)[] = [];
    for (let i = 0; i < startDow; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);

    const rows: (number | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) {
      rows.push(cells.slice(i, i + 7));
    }
    return rows;
  }, [year, month]);

  const formatDate = (day: number) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        {dayNames.map((name) => (
          <View key={name} style={styles.headerCell}>
            <Text style={[styles.headerText, { color: colors.textSecondary }]}>{name}</Text>
          </View>
        ))}
      </View>
      {weeks.map((week, wi) => (
        <View key={wi} style={styles.weekRow}>
          {week.map((day, di) => {
            if (day === null) {
              return <View key={di} style={styles.dayCell} />;
            }
            const dateStr = formatDate(day);
            const isToday = dateStr === today;
            const isSelected = dateStr === selectedDate;
            const hasEntries = datesWithEntries.has(dateStr);

            return (
              <TouchableOpacity
                key={di}
                style={[
                  styles.dayCell,
                  isSelected && { backgroundColor: colors.tint, borderRadius: 14 },
                  isToday && !isSelected && { backgroundColor: colors.surfaceElevated, borderRadius: 14 },
                ]}
                onPress={() => onSelectDate(dateStr)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.dayText,
                    { color: colors.text },
                    isSelected && { color: '#FFFFFF', fontWeight: '700' },
                    isToday && !isSelected && { color: colors.tint, fontWeight: '700' },
                  ]}
                >
                  {day}
                </Text>
                {hasEntries && (
                  <View
                    style={[
                      styles.dot,
                      { backgroundColor: isSelected ? '#FFFFFF' : colors.accent },
                    ]}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  headerCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  headerText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  weekRow: {
    flexDirection: 'row',
  },
  dayCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    minHeight: 44,
  },
  dayText: {
    fontSize: 15,
    fontWeight: '500',
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginTop: 3,
  },
});
