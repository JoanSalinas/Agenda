import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { SUPPORTED_LANGUAGES } from '@/i18n';
import { useTranslation } from '@/i18n/LanguageContext';
import { useAuth } from '@/lib/AuthContext';
import { clearAllData, getStats } from '@/lib/storage';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function SettingsScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const { t, language, setLanguage } = useTranslation();
  const { storageMode, setStorageMode, user, signOut } = useAuth();
  const router = useRouter();
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
      t('settings.clearDataTitle'),
      t('settings.clearDataMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.clearEverything'),
          style: 'destructive',
          onPress: async () => {
            await clearAllData();
            await loadStats();
          },
        },
      ]
    );
  };

  const handleStorageModeChange = async (mode: 'local' | 'cloud') => {
    if (mode === 'cloud') {
      if (!user) {
        // Navigate to login screen first
        router.push('/login');
        return;
      }
      await setStorageMode('cloud');
    } else {
      await setStorageMode('local');
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      t('settings.signOut'),
      '',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.signOut'),
          style: 'destructive',
          onPress: async () => {
            await signOut();
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('settings.title')}</Text>
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

        {/* Storage Mode Selection */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          {t('settings.storageSection')}
        </Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Local option */}
          <TouchableOpacity
            style={styles.storageRow}
            onPress={() => handleStorageModeChange('local')}
          >
            <View style={[styles.storageIcon, { backgroundColor: colors.accentTeal + '20' }]}>
              <MaterialIcons name="smartphone" size={22} color={colors.accentTeal} />
            </View>
            <View style={styles.storageInfo}>
              <Text style={[styles.storageName, { color: colors.text }]}>
                {t('settings.storageLocal')}
              </Text>
              <Text style={[styles.storageDesc, { color: colors.textSecondary }]}>
                {t('settings.storageLocalDesc')}
              </Text>
            </View>
            {storageMode === 'local' && (
              <MaterialIcons name="check-circle" size={22} color={colors.tint} />
            )}
          </TouchableOpacity>

          <View style={[styles.storageDivider, { backgroundColor: colors.border }]} />

          {/* Cloud option */}
          <TouchableOpacity
            style={styles.storageRow}
            onPress={() => handleStorageModeChange('cloud')}
          >
            <View style={[styles.storageIcon, { backgroundColor: colors.tint + '20' }]}>
              <MaterialIcons name="cloud" size={22} color={colors.tint} />
            </View>
            <View style={styles.storageInfo}>
              <Text style={[styles.storageName, { color: colors.text }]}>
                {t('settings.storageCloud')}
              </Text>
              <Text style={[styles.storageDesc, { color: colors.textSecondary }]}>
                {t('settings.storageCloudDesc')}
              </Text>
            </View>
            {storageMode === 'cloud' && (
              <MaterialIcons name="check-circle" size={22} color={colors.tint} />
            )}
          </TouchableOpacity>
        </View>

        {/* Account Section (only when cloud mode & signed in) */}
        {storageMode === 'cloud' && user && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              {t('settings.accountSection')}
            </Text>
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.accountRow}>
                <View style={[styles.avatarCircle, { backgroundColor: colors.tint + '20' }]}>
                  <MaterialIcons name="person" size={24} color={colors.tint} />
                </View>
                <View style={styles.accountInfo}>
                  <Text style={[styles.accountLabel, { color: colors.textSecondary }]}>
                    {t('settings.signedInAs')}
                  </Text>
                  <Text style={[styles.accountEmail, { color: colors.text }]} numberOfLines={1}>
                    {user.email}
                  </Text>
                </View>
              </View>

              <View style={[styles.storageDivider, { backgroundColor: colors.border }]} />

              <TouchableOpacity style={styles.actionRow} onPress={handleSignOut}>
                <MaterialIcons name="logout" size={22} color={colors.danger} />
                <Text style={[styles.actionText, { color: colors.danger }]}>
                  {t('settings.signOut')}
                </Text>
                <MaterialIcons name="chevron-right" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Language Selection */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          {t('settings.languageSection')}
        </Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {SUPPORTED_LANGUAGES.map((lang, index) => {
            const isSelected = language === lang.code;
            return (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.languageRow,
                  index > 0 && { borderTopWidth: 1, borderTopColor: colors.border },
                ]}
                onPress={() => setLanguage(lang.code)}
              >
                {lang.icon ? (
                  <Image source={lang.icon} style={styles.flagImage} />
                ) : (
                  <Text style={styles.flagText}>{lang.flag}</Text>
                )}
                <Text style={[styles.languageName, { color: colors.text }]}>
                  {lang.nativeName}
                </Text>
                {isSelected && (
                  <MaterialIcons name="check" size={20} color={colors.tint} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Statistics */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          {t('settings.dataSection')}
        </Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <MaterialIcons name="event" size={22} color={colors.accentTeal} />
              <View style={styles.statInfo}>
                <Text style={[styles.statValue, { color: colors.text }]}>{stats.entries}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  {t('settings.entriesLabel')}
                </Text>
              </View>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <MaterialIcons name="people" size={22} color={colors.accent} />
              <View style={styles.statInfo}>
                <Text style={[styles.statValue, { color: colors.text }]}>{stats.people}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  {t('settings.peopleLabel')}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Actions */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          {t('settings.actionsSection')}
        </Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity style={styles.actionRow} onPress={handleClearData}>
            <MaterialIcons name="delete-forever" size={22} color={colors.danger} />
            <Text style={[styles.actionText, { color: colors.danger }]}>
              {t('settings.clearData')}
            </Text>
            <MaterialIcons name="chevron-right" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.footer, { color: colors.placeholder }]}>
          {storageMode === 'cloud' ? t('settings.footerCloud') : t('settings.footer')}
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
  // Storage mode styles
  storageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  storageIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storageInfo: {
    flex: 1,
  },
  storageName: {
    fontSize: 16,
    fontWeight: '600',
  },
  storageDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  storageDivider: {
    height: 1,
    marginLeft: 70,
  },
  // Account styles
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountInfo: {
    flex: 1,
  },
  accountLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  accountEmail: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 2,
  },
  // Language styles
  languageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  flagText: {
    fontSize: 20,
  },
  flagImage: {
    width: 24,
    height: 16,
  },
  languageName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
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
