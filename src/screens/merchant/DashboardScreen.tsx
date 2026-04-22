/**
 * DashboardScreen — real merchant home for Sprint 4.
 *
 * Pulls stats from `useDashboardStats`, renders a welcome card with
 * country flag, 2×2 StatCard grid, revenue LineChart, deals-by-stage
 * PieChart, a recent-activities feed, and a horizontal scroll of quick
 * actions. Pull-to-refresh hits `refetch()` on the stats query.
 */

import React, { useCallback, useMemo } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';

import { CurrencyDisplay } from '../../components/forms/CurrencyDisplay';
import { Header } from '../../components/common/Header';
import { Icon, type AnyIconName } from '../../components/common/Icon';
import { LineChart, type LinePoint } from '../../components/charts/LineChart';
import { PieChart } from '../../components/charts/PieChart';
import { StatCard } from '../../components/common/StatCard';
import { colors } from '../../constants/colors';
import { findCountry } from '../../constants/countries';
import { hitSlop, radius, shadows, spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';
import { useCountryConfig } from '../../hooks/useCountryConfig';
import { useDashboardStats } from '../../hooks/useDashboardStats';
import type { SupportedLanguage } from '../../i18n';
import { useUiStore } from '../../store/uiStore';
import { useUserStore } from '../../store/userStore';

interface QuickAction {
  key: 'addCustomer' | 'createQuote' | 'newDeal' | 'viewReports';
  icon: AnyIconName;
  parent: 'SalesTab' | 'MoreTab';
  screen: string;
}

const QUICK_ACTIONS: readonly QuickAction[] = [
  {
    key: 'addCustomer',
    icon: 'person-add-outline',
    parent: 'SalesTab',
    screen: 'Customers',
  },
  {
    key: 'createQuote',
    icon: 'document-text-outline',
    parent: 'SalesTab',
    screen: 'Quotes',
  },
  {
    key: 'newDeal',
    icon: 'briefcase-outline',
    parent: 'SalesTab',
    screen: 'Deals',
  },
  {
    key: 'viewReports',
    icon: 'bar-chart-outline',
    parent: 'MoreTab',
    screen: 'Reports',
  },
];

const ACTIVITY_ICON: Record<string, AnyIconName> = {
  deal_won: 'trophy-outline',
  payment_received: 'cash-outline',
  email_sent: 'mail-outline',
  meeting_scheduled: 'calendar-outline',
  call_made: 'call-outline',
  customer_created: 'person-add-outline',
};

export const DashboardScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const currentUser = useUserStore((s) => s.currentUser);
  const language = useUiStore((s) => s.language) as SupportedLanguage;
  const { config, formatDate } = useCountryConfig();

  const displayName = currentUser?.name?.split(' ')[0] ?? t('common.appName');
  const countryFlag = config.flag;
  const countryName = config.name[language];

  const statsQuery = useDashboardStats();
  const { data: stats, isLoading, isFetching, refetch } = statsQuery;

  const onRefresh = useCallback((): void => {
    void refetch();
  }, [refetch]);

  const linePoints = useMemo<LinePoint[]>(() => {
    if (!stats) return [];
    return stats.revenueByMonth.map((p) => ({
      x: p.month.slice(5),
      y: p.amount,
    }));
  }, [stats]);

  const pieData = useMemo(() => {
    if (!stats) return [];
    return stats.dealsByStage.map((s) => ({
      label: t(`stages.${s.stage}`),
      value: s.value,
      color: s.color,
    }));
  }, [stats, t]);

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <Header
        title={t('navigation.dashboard')}
        showBack={false}
        rightSlot={
          <Pressable hitSlop={hitSlop.md} style={styles.bellBtn}>
            <Icon
              name="notifications-outline"
              size={22}
              color={colors.textInverse}
            />
            <View style={styles.bellDot} />
          </Pressable>
        }
      />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <View style={styles.welcomeCard}>
          <View style={styles.countryRow}>
            <Text style={styles.countryFlag}>{countryFlag}</Text>
            <Text style={styles.countryName} numberOfLines={1}>
              {countryName}
            </Text>
          </View>
          <Text style={styles.welcomeEyebrow}>
            {t('dashboard.welcomeBack')}
          </Text>
          <Text style={styles.welcomeName}>
            {t('dashboard.welcomeName', { name: displayName })}
          </Text>
        </View>

        <View style={styles.statsGrid}>
          <StatCard
            icon="people-outline"
            label={t('dashboard.customers')}
            value={String(stats?.customersCount ?? 0)}
            loading={isLoading}
          />
          <StatCard
            icon="briefcase-outline"
            label={t('dashboard.activeDeals')}
            value={String(stats?.activeDealsCount ?? 0)}
            trend={stats?.growth.deals}
            loading={isLoading}
          />
          <StatCard
            icon="cash-outline"
            label={t('dashboard.monthRevenue')}
            value={
              <CurrencyDisplay
                amount={stats?.monthRevenue ?? 0}
                size="large"
                color={colors.primaryDark}
              />
            }
            trend={stats?.growth.revenue}
            loading={isLoading}
          />
          <StatCard
            icon="checkmark-done-outline"
            label={t('dashboard.pendingTasks')}
            value={String(stats?.pendingTasksCount ?? 0)}
            loading={isLoading}
          />
        </View>

        <LineChart
          data={linePoints}
          title={`${t('dashboard.revenueTrend')} — ${t('dashboard.last6Months')}`}
          currency
          height={200}
        />

        <PieChart
          data={pieData}
          title={t('dashboard.dealsByStage')}
          size={160}
        />

        <View style={styles.activitiesCard}>
          <Text style={styles.sectionTitle}>
            {t('activities.recentActivities')}
          </Text>
          {stats && stats.recentActivities.length > 0 ? (
            stats.recentActivities.map((activity) => (
              <View key={activity.id} style={styles.activityRow}>
                <View style={styles.activityIcon}>
                  <Icon
                    name={ACTIVITY_ICON[activity.kind] ?? 'ellipse-outline'}
                    size={18}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.activityBody}>
                  <Text style={styles.activityTitle} numberOfLines={1}>
                    {activity.title}
                  </Text>
                  {activity.subtitle ? (
                    <Text style={styles.activitySub} numberOfLines={1}>
                      {activity.subtitle}
                    </Text>
                  ) : null}
                </View>
                <Text style={styles.activityDate}>
                  {formatDate(activity.createdAt)}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.activityEmpty}>
              {t('activities.noActivities')}
            </Text>
          )}
        </View>

        <Text style={styles.sectionHeader}>{t('dashboard.quickActions')}</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickScroll}
        >
          {QUICK_ACTIONS.map((action) => (
            <Pressable
              key={action.key}
              onPress={() => {
                (navigation as unknown as {
                  navigate: (route: string, params?: unknown) => void;
                }).navigate(action.parent, { screen: action.screen });
              }}
              style={({ pressed }) => [
                styles.quickCard,
                pressed ? { opacity: 0.85 } : null,
              ]}
              accessibilityRole="button"
            >
              <View style={styles.quickIcon}>
                <Icon name={action.icon} size={22} color={colors.primary} />
              </View>
              <Text style={styles.quickLabel}>
                {t(`dashboard.${action.key}`)}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </ScrollView>
    </SafeAreaView>
  );
};

// keep `findCountry` referenced so tree-shaking doesn't accidentally drop
// the import when this file is inspected standalone.
void findCountry;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    padding: spacing.base,
    paddingBottom: spacing.xxxl,
    rowGap: spacing.base,
  },
  bellBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellDot: {
    position: 'absolute',
    top: 8,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.warning,
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: spacing.md,
    rowGap: spacing.md,
  },
  activitiesCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.base,
    ...shadows.xs,
  },
  sectionTitle: {
    ...textStyles.h4,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  sectionHeader: {
    ...textStyles.h4,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    columnGap: spacing.sm,
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityBody: { flex: 1 },
  activityTitle: {
    ...textStyles.label,
    color: colors.textPrimary,
  },
  activitySub: {
    ...textStyles.caption,
    color: colors.textMuted,
  },
  activityDate: {
    ...textStyles.caption,
    color: colors.textMuted,
  },
  activityEmpty: {
    ...textStyles.body,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  quickScroll: {
    columnGap: spacing.md,
    paddingEnd: spacing.base,
  },
  quickCard: {
    width: 120,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.base,
    rowGap: spacing.xs,
    alignItems: 'flex-start',
    ...shadows.xs,
  },
  quickIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: {
    ...textStyles.label,
    color: colors.textPrimary,
    fontWeight: '600',
  },
});

export default DashboardScreen;
