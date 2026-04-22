/**
 * DashboardScreen — merchant home. Sprint 3 adds a small country badge
 * (flag + localized country name) to the welcome card so the user can
 * see their selected market at a glance, and swaps one placeholder stat
 * value for a `CurrencyDisplay` so the configured currency is visible.
 */

import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { CurrencyDisplay } from '../../components/forms/CurrencyDisplay';
import { Header } from '../../components/common/Header';
import { Icon, type AnyIconName } from '../../components/common/Icon';
import { colors } from '../../constants/colors';
import { radius, shadows, spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';
import { useCountryConfig } from '../../hooks/useCountryConfig';
import type { SupportedLanguage } from '../../i18n';
import { useUiStore } from '../../store/uiStore';
import { useUserStore } from '../../store/userStore';

interface StatTile {
  key: 'customers' | 'deals' | 'revenue' | 'tasks';
  icon: AnyIconName;
  tint: string;
}

const TILES: readonly StatTile[] = [
  { key: 'customers', icon: 'people-outline', tint: colors.primary },
  { key: 'deals', icon: 'briefcase-outline', tint: colors.primaryDark },
  { key: 'revenue', icon: 'cash-outline', tint: colors.success },
  { key: 'tasks', icon: 'checkmark-done-outline', tint: colors.info },
];

export const DashboardScreen: React.FC = () => {
  const { t } = useTranslation();
  const currentUser = useUserStore((s) => s.currentUser);
  const displayName = currentUser?.name?.split(' ')[0] ?? t('common.appName');
  const language = useUiStore((s) => s.language) as SupportedLanguage;
  const { config } = useCountryConfig();

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <Header title={t('navigation.dashboard')} showBack={false} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.welcomeCard}>
          <View style={styles.countryRow}>
            <Text style={styles.countryFlag}>{config.flag}</Text>
            <Text style={styles.countryName} numberOfLines={1}>
              {config.name[language]}
            </Text>
          </View>
          <Text style={styles.welcomeEyebrow}>
            {t('dashboard.welcomeBack')}
          </Text>
          <Text style={styles.welcomeName}>
            {t('dashboard.welcomeName', { name: displayName })}
          </Text>
          <Text style={styles.welcomeSubtitle}>
            {t('placeholders.comingInSprint', { sprint: 4 })}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>{t('dashboard.quickStats')}</Text>

        <View style={styles.statsGrid}>
          {TILES.map((tile) => (
            <View key={tile.key} style={styles.statCard}>
              <View
                style={[
                  styles.statIcon,
                  { backgroundColor: colors.primarySoft },
                ]}
              >
                <Icon name={tile.icon} size={24} color={tile.tint} />
              </View>
              {tile.key === 'revenue' ? (
                <CurrencyDisplay amount={0} size="large" />
              ) : (
                <Text style={styles.statValue}>—</Text>
              )}
              <Text style={styles.statLabel}>
                {t(`dashboard.${tile.key}`)}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.emptyCard}>
          <Icon
            name="bar-chart-outline"
            size={36}
            color={colors.primary}
          />
          <Text style={styles.emptyTitle}>
            {t('dashboard.quickStats')}
          </Text>
          <Text style={styles.emptySubtitle}>
            {t('placeholders.comingInSprint', { sprint: 4 })}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    padding: spacing.base,
    paddingBottom: spacing.xxl,
    rowGap: spacing.base,
  },
  welcomeCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    ...shadows.sm,
  },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.xs,
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginBottom: spacing.sm,
  },
  countryFlag: { fontSize: 16 },
  countryName: {
    ...textStyles.caption,
    color: colors.primaryDark,
    fontWeight: '600',
  },
  welcomeEyebrow: {
    ...textStyles.overline,
    color: colors.primary,
  },
  welcomeName: {
    ...textStyles.h2,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  welcomeSubtitle: {
    ...textStyles.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    ...textStyles.h4,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: spacing.md,
    rowGap: spacing.md,
  },
  statCard: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.base,
    ...shadows.xs,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  statValue: {
    ...textStyles.h2,
    color: colors.textPrimary,
  },
  statLabel: {
    ...textStyles.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  emptyCard: {
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    rowGap: spacing.sm,
    ...shadows.xs,
  },
  emptyTitle: {
    ...textStyles.h4,
    color: colors.textPrimary,
  },
  emptySubtitle: {
    ...textStyles.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },
});

export default DashboardScreen;
