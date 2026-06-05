/**
 * AdminDashboardScreen — real platform-admin home. Shows quick stats,
 * trend charts, plan distribution, top companies, alert cards, and a
 * recent activities feed pulled from `useAdminSummary`.
 */

import React, { useMemo } from 'react';
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
import { DrawerActions, useNavigation } from '@react-navigation/native';

import { Header } from '../../components/common/Header';
import { Icon, type AnyIconName } from '../../components/common/Icon';
import { LineChart } from '../../components/charts/LineChart';
import { PieChart } from '../../components/charts/PieChart';
import { SkeletonCard } from '../../components/common/SkeletonCard';
import { StatsGrid } from '../../components/admin/StatsGrid';
import { darkColors } from '../../theme/dark';
import { getPageAccent } from '../../theme/dark/accents';

const PAGE_ACCENT = getPageAccent('settings');
import { hitSlop, radius, shadows, spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';
import { useAdminSummary } from '../../hooks/useAdmin';
import { useUserStore } from '../../store/userStore';
import type { PlanTier } from '../../types/admin';

const PLAN_LABEL: Record<PlanTier, string> = {
  free: 'Free',
  starter: 'Starter',
  business: 'Business',
  enterprise: 'Enterprise',
};

export const AdminDashboardScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const summaryQuery = useAdminSummary();
  const currentUser = useUserStore((state) => state.currentUser);

  const summary = summaryQuery.data;

  const linePoints = useMemo(
    () =>
      summary?.signupsTrend.map((item) => ({ x: item.date, y: item.count })) ??
      [],
    [summary]
  );
  const revenuePoints = useMemo(
    () =>
      summary?.revenueTrend.map((item) => ({ x: item.month, y: item.amount })) ??
      [],
    [summary]
  );
  const planDistribution = useMemo(
    () =>
      summary?.planDistribution.map((item) => ({
        label: PLAN_LABEL[item.plan],
        value: item.count,
      })) ?? [],
    [summary]
  );

  const refresh = (): void => {
    void summaryQuery.refetch();
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <Header
        title={t('admin.adminPanel')}
        showBack={false}
        leftSlot={
          <Pressable
            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
            hitSlop={hitSlop.md}
            style={styles.headerBtn}
          >
            <Icon name="menu-outline" size={24} color={darkColors.textOnPrimary} />
          </Pressable>
        }
        rightSlot={
          <Pressable hitSlop={hitSlop.md} style={styles.headerBtn}>
            <Icon
              name="notifications-outline"
              size={22}
              color={darkColors.textOnPrimary}
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
            refreshing={summaryQuery.isFetching && !summaryQuery.isLoading}
            onRefresh={refresh}
            tintColor={darkColors.primary}
            colors={[darkColors.primary]}
          />
        }
      >
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeEyebrow}>{t('common.welcome')}</Text>
          <Text style={styles.welcomeName}>
            {currentUser?.name ?? t('admin.adminPanel')}
          </Text>
          <Text style={styles.welcomeSub}>{t('admin.dashboard')}</Text>
        </View>

        {summaryQuery.isLoading || !summary ? (
          <SkeletonCard height={140} />
        ) : (
          <StatsGrid
            items={[
              {
                key: 'companies',
                label: t('admin.companies'),
                value: String(summary.totalCompanies),
                icon: 'business-outline',
                trend: summary.totalCompaniesDelta,
              },
              {
                key: 'users',
                label: t('admin.users'),
                value: String(summary.activeUsers),
                icon: 'people-outline',
              },
              {
                key: 'mrr',
                label: t('companies.mrr'),
                value: `$${summary.monthlyRecurringRevenue}/mo`,
                icon: 'cash-outline',
                tone: darkColors.success,
              },
              {
                key: 'signups',
                label: t('admin.newToday'),
                value: String(summary.newSignupsToday),
                icon: 'sparkles-outline',
                tone: darkColors.warning,
              },
            ]}
          />
        )}

        {summary ? (
          <View style={styles.alertsRow}>
            <AlertCard
              icon="alert-circle-outline"
              tone={darkColors.error}
              count={summary.alerts.overduePayments}
              label={t('admin.overduePayments')}
            />
            <AlertCard
              icon="help-buoy-outline"
              tone={darkColors.warning}
              count={summary.alerts.pendingTickets}
              label={t('admin.supportTickets')}
            />
            <AlertCard
              icon="shield-checkmark-outline"
              tone={darkColors.primary}
              count={summary.alerts.pendingCompliance}
              label={t('admin.complianceAlertsLabel')}
            />
          </View>
        ) : null}

        {linePoints.length > 0 ? (
          <LineChart
            data={linePoints}
            title={t('admin.signupsTrend')}
            height={180}
          />
        ) : null}

        {revenuePoints.length > 0 ? (
          <LineChart
            data={revenuePoints}
            title={t('admin.revenueTrend')}
            currency
            height={200}
          />
        ) : null}

        {planDistribution.length > 0 ? (
          <PieChart
            data={planDistribution}
            title={t('admin.companiesByPlan')}
            size={160}
          />
        ) : null}

        {summary && summary.topCompanies.length > 0 ? (
          <View style={styles.topCompaniesCard}>
            <Text style={styles.sectionTitle}>{t('admin.topCompaniesByMrr')}</Text>
            {summary.topCompanies.map((company) => (
              <View key={company.id} style={styles.topCompanyRow}>
                <Text style={styles.topCompanyName} numberOfLines={1}>
                  {company.name}
                </Text>
                <Text style={styles.topCompanyMRR}>{`$${company.mrr}/mo`}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {summary && summary.recentActivities.length > 0 ? (
          <View style={styles.activitiesCard}>
            <Text style={styles.sectionTitle}>
              {t('activities.recentActivities')}
            </Text>
            {summary.recentActivities.map((entry) => (
              <View key={entry.id} style={styles.activityRow}>
                <Icon
                  name={
                    entry.severity === 'critical'
                      ? 'alert-circle-outline'
                      : entry.severity === 'warning'
                        ? 'warning-outline'
                        : 'information-circle-outline'
                  }
                  size={16}
                  color={
                    entry.severity === 'critical'
                      ? darkColors.error
                      : entry.severity === 'warning'
                        ? darkColors.warning
                        : darkColors.primary
                  }
                />
                <View style={styles.activityBody}>
                  <Text style={styles.activityTitle} numberOfLines={1}>
                    {`${entry.userName} · ${entry.action}`}
                  </Text>
                  <Text style={styles.activitySub} numberOfLines={1}>
                    {`${entry.companyName ?? '—'} · ${entry.ipAddress}`}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

const AlertCard: React.FC<{
  icon: AnyIconName;
  tone: string;
  count: number;
  label: string;
}> = ({ icon, tone, count, label }) => (
  <View style={[styles.alertCard, { borderLeftColor: tone }]}>
    <Icon name={icon} size={20} color={tone} />
    <View style={styles.alertBody}>
      <Text style={styles.alertCount}>{count}</Text>
      <Text style={styles.alertLabel} numberOfLines={1}>
        {label}
      </Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: darkColors.background },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellDot: {
    position: 'absolute',
    top: 8,
    insetInlineEnd: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: darkColors.warning,
  },
  scroll: {
    padding: spacing.base,
    paddingBottom: spacing.xxxl,
    rowGap: spacing.base,
  },
  welcomeCard: {
    backgroundColor: darkColors.surface,
    padding: spacing.base,
    borderRadius: radius.xl,
    rowGap: spacing.xs,
    ...shadows.sm,
  },
  welcomeEyebrow: {
    ...textStyles.overline,
    color: darkColors.primary,
  },
  welcomeName: { ...textStyles.h2, color: darkColors.textPrimary },
  welcomeSub: { ...textStyles.caption, color: darkColors.textMuted },
  alertsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  alertCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.sm,
    backgroundColor: darkColors.surface,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    borderRadius: radius.lg,
    borderLeftWidth: 4,
    minHeight: 60,
    ...shadows.xs,
  },
  alertBody: { flex: 1 },
  alertCount: {
    ...textStyles.h3,
    fontWeight: '800',
    color: darkColors.textPrimary,
  },
  alertLabel: { ...textStyles.caption, color: darkColors.textMuted },
  topCompaniesCard: {
    backgroundColor: darkColors.surface,
    padding: spacing.base,
    borderRadius: radius.lg,
    rowGap: spacing.sm,
    ...shadows.xs,
  },
  sectionTitle: { ...textStyles.h4, color: darkColors.textPrimary },
  topCompanyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: darkColors.divider,
  },
  topCompanyName: { flex: 1, ...textStyles.body, color: darkColors.textPrimary },
  topCompanyMRR: {
    ...textStyles.bodyMedium,
    color: darkColors.success,
    fontWeight: '700',
  },
  activitiesCard: {
    backgroundColor: darkColors.surface,
    padding: spacing.base,
    borderRadius: radius.lg,
    rowGap: spacing.sm,
    ...shadows.xs,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.sm,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: darkColors.divider,
  },
  activityBody: { flex: 1 },
  activityTitle: { ...textStyles.body, color: darkColors.textPrimary },
  activitySub: { ...textStyles.caption, color: darkColors.textMuted },
});

export default AdminDashboardScreen;
