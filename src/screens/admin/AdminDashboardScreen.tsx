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
import { colors } from '../../constants/colors';
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
            <Icon name="menu-outline" size={24} color={colors.textInverse} />
          </Pressable>
        }
        rightSlot={
          <Pressable hitSlop={hitSlop.md} style={styles.headerBtn}>
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
            refreshing={summaryQuery.isFetching && !summaryQuery.isLoading}
            onRefresh={refresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
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
                label: 'MRR',
                value: `$${summary.monthlyRecurringRevenue}/mo`,
                icon: 'cash-outline',
                tone: colors.success,
              },
              {
                key: 'signups',
                label: 'New today',
                value: String(summary.newSignupsToday),
                icon: 'sparkles-outline',
                tone: colors.warning,
              },
            ]}
          />
        )}

        {summary ? (
          <View style={styles.alertsRow}>
            <AlertCard
              icon="alert-circle-outline"
              tone={colors.error}
              count={summary.alerts.overduePayments}
              label="overdue payments"
            />
            <AlertCard
              icon="help-buoy-outline"
              tone={colors.warning}
              count={summary.alerts.pendingTickets}
              label="support tickets"
            />
            <AlertCard
              icon="shield-checkmark-outline"
              tone={colors.primary}
              count={summary.alerts.pendingCompliance}
              label="compliance"
            />
          </View>
        ) : null}

        {linePoints.length > 0 ? (
          <LineChart
            data={linePoints}
            title="Signups · last 14 days"
            height={180}
          />
        ) : null}

        {revenuePoints.length > 0 ? (
          <LineChart
            data={revenuePoints}
            title="Revenue · last 12 months"
            currency
            height={200}
          />
        ) : null}

        {planDistribution.length > 0 ? (
          <PieChart
            data={planDistribution}
            title="Companies by plan"
            size={160}
          />
        ) : null}

        {summary && summary.topCompanies.length > 0 ? (
          <View style={styles.topCompaniesCard}>
            <Text style={styles.sectionTitle}>Top companies by MRR</Text>
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
                      ? colors.error
                      : entry.severity === 'warning'
                        ? colors.warning
                        : colors.primary
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
  safe: { flex: 1, backgroundColor: colors.background },
  headerBtn: {
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
  scroll: {
    padding: spacing.base,
    paddingBottom: spacing.xxxl,
    rowGap: spacing.base,
  },
  welcomeCard: {
    backgroundColor: colors.surface,
    padding: spacing.base,
    borderRadius: radius.xl,
    rowGap: spacing.xs,
    ...shadows.sm,
  },
  welcomeEyebrow: {
    ...textStyles.overline,
    color: colors.primary,
  },
  welcomeName: { ...textStyles.h2, color: colors.textPrimary },
  welcomeSub: { ...textStyles.caption, color: colors.textMuted },
  alertsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  alertCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.sm,
    backgroundColor: colors.surface,
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
    color: colors.textPrimary,
  },
  alertLabel: { ...textStyles.caption, color: colors.textMuted },
  topCompaniesCard: {
    backgroundColor: colors.surface,
    padding: spacing.base,
    borderRadius: radius.lg,
    rowGap: spacing.sm,
    ...shadows.xs,
  },
  sectionTitle: { ...textStyles.h4, color: colors.textPrimary },
  topCompanyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  topCompanyName: { flex: 1, ...textStyles.body, color: colors.textPrimary },
  topCompanyMRR: {
    ...textStyles.bodyMedium,
    color: colors.success,
    fontWeight: '700',
  },
  activitiesCard: {
    backgroundColor: colors.surface,
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
    borderBottomColor: colors.divider,
  },
  activityBody: { flex: 1 },
  activityTitle: { ...textStyles.body, color: colors.textPrimary },
  activitySub: { ...textStyles.caption, color: colors.textMuted },
});

export default AdminDashboardScreen;
