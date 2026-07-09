import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getStats, clearAllData } from '@/lib/storage';

export default function SettingsScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const [stats, setStats] = useState({ entries: 0, people: 0 });

  const loadStats = useCallback(async () => {
    const s = await getStats();
    setStats(s);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats])
  );

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all entries and contacts. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Everything',
          style: 'destructive',
          onPress: async () => {
            await clearAllData();
            await loadStats();
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* App Info */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.appInfo}>
            <View style={[styles.appIcon, { backgroundColor: colors.tint }]}>
              <MaterialIcons name="event-note" size={32} color="#FFFFFF" />
            </View>
            <View>
              <Text style={[styles.appName, { color: colors.text }]}>Agenda</Text>
              <Text style={[styles.appVersion, { color: colors.textSecondary }]}>Version 1.0.0</Text>
            </View>
          </View>
        </View>

        {/* Statistics */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>DATA</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <MaterialIcons name="event" size={22} color={colors.accentTeal} />
              <View style={styles.statInfo}>
                <Text style={[styles.statValue, { color: colors.text }]}>{stats.entries}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Entries</Text>
              </View>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <MaterialIcons name="people" size={22} color={colors.accent} />
              <View style={styles.statInfo}>
                <Text style={[styles.statValue, { color: colors.text }]}>{stats.people}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>People</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Actions */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>ACTIONS</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity style={styles.actionRow} onPress={handleClearData}>
            <MaterialIcons name="delete-forever" size={22} color={colors.danger} />
            <Text style={[styles.actionText, { color: colors.danger }]}>Clear All Data</Text>
            <MaterialIcons name="chevron-right" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.footer, { color: colors.placeholder }]}>
          All data is stored locally on your device.
        </Text>
      </ScrollView>
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
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 8,
  },
  appInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    gap: 16,
  },
  appIcon: {
    width: 54,
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    fontSize: 20,
    fontWeight: '700',
  },
  appVersion: {
    fontSize: 13,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginTop: 20,
    marginBottom: 8,
    marginLeft: 4,
  },
  statRow: {
    flexDirection: 'row',
    padding: 18,
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statInfo: {},
  statValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 1,
  },
  statDivider: {
    width: 1,
    marginHorizontal: 16,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  footer: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 24,
    marginBottom: 40,
  },
});
