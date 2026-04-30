/**
 * SystemStatsScreen — real-time platform health (response times,
 * sessions, DB connections, storage, error rate, uptime) plus charts
 * and an incidents log.
 */

import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { DrawerActions, useNavigation } from '@react-navigation/native';

import { BarChart } from '../../components/charts/BarChart';
import { Header } from '../../components/common/Header';
import { Icon } from '../../components/common/Icon';
import { LineChart } from '../../components/charts/LineChart';
import { SkeletonCard } from '../../components/common/SkeletonCard';
import { StatsGrid } from '../../components/admin/StatsGrid';
import { darkColors } from '../../theme/dark';
import { hitSlop, radius, shadows, spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';
import { useSystemStats } from '../../hooks/useAdmin';

export const SystemStatsScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const statsQuery = useSystemStats();

  const stats = statsQuery.data;

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <Header
        title={t('admin.systemStats')}
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
      />
      <ScrollView contentContainerStyle={styles.scroll}>
        {statsQuery.isLoading || !stats ? (
          <SkeletonCard height={160} />
        ) : (
          <>
            <StatsGrid
              items={[
                {
                  key: 'response',
                  label: 'API · avg',
                  value: `${stats.apiResponseTime.avg} ms`,
                  icon: 'pulse-outline',
                },
                {
                  key: 'p95',
                  label: 'p95 / p99',
                  value: `${stats.apiResponseTime.p95} / ${stats.apiResponseTime.p99}`,
                  icon: 'speedometer-outline',
                  tone: darkColors.warning,
                },
                {
                  key: 'sessions',
                  label: t('systemStats.activeSessions'),
                  value: String(stats.activeSessions),
                  icon: 'people-outline',
                },
                {
                  key: 'db',
                  label: t('systemStats.dbConnections'),
                  value: `${stats.dbConnections.active}/${stats.dbConnections.max}`,
                  icon: 'server-outline',
                },
                {
                  key: 'storage',
                  label: t('systemStats.storageUsed'),
                  value: `${stats.storageUsedGB} / ${stats.storageQuotaGB} GB`,
                  icon: 'cloud-outline',
                },
                {
                  key: 'error',
                  label: t('systemStats.errorRate'),
                  value: `${stats.errorRate}%`,
                  icon: 'warning-outline',
                  tone: darkColors.error,
                },
                {
                  key: 'uptime',
                  label: t('systemStats.uptime'),
                  value: `${stats.uptimePercent}%`,
                  icon: 'shield-checkmark-outline',
                  tone: darkColors.success,
                },
              ]}
            />

            <LineChart
              data={stats.responseTrend.map((entry) => ({
                x: entry.time,
                y: entry.ms,
              }))}
              title={t('systemStats.apiResponseTime')}
              height={180}
            />

            <LineChart
              data={stats.errorTrend.map((entry) => ({
                x: entry.time,
                y: entry.rate,
              }))}
              title={t('systemStats.errorRate')}
              height={180}
            />

            <BarChart
              data={stats.trafficByHour.map((entry) => ({
                label: entry.hour,
                value: entry.requests,
              }))}
              title="Traffic per hour"
            />

            <View style={styles.incidentsCard}>
              <Text style={styles.sectionTitle}>
                {t('systemStats.incidents')}
              </Text>
              {stats.incidents.map((incident) => (
                <View key={incident.id} style={styles.incidentRow}>
                  <Icon
                    name={
                      incident.severity === 'critical'
                        ? 'alert-circle-outline'
                        : incident.severity === 'warning'
                          ? 'warning-outline'
                          : 'information-circle-outline'
                    }
                    size={18}
                    color={
                      incident.severity === 'critical'
                        ? darkColors.error
                        : incident.severity === 'warning'
                          ? darkColors.warning
                          : darkColors.primary
                    }
                  />
                  <View style={styles.incidentBody}>
                    <Text style={styles.incidentTitle}>{incident.title}</Text>
                    <Text style={styles.incidentMeta}>
                      {incident.date.slice(0, 10)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.healthCard}>
              <Text style={styles.sectionTitle}>
                {t('systemStats.healthChecks')}
              </Text>
              <HealthRow label="API" status="ok" />
              <HealthRow label="Database" status="ok" />
              <HealthRow label="Redis cache" status="ok" />
              <HealthRow label="ZATCA gateway" status="warn" />
              <HealthRow label="e-Fatura gateway" status="ok" />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const HealthRow: React.FC<{ label: string; status: 'ok' | 'warn' | 'crit' }> = ({
  label,
  status,
}) => (
  <View style={styles.healthRow}>
    <View
      style={[
        styles.healthDot,
        {
          backgroundColor:
            status === 'ok'
              ? darkColors.success
              : status === 'warn'
                ? darkColors.warning
                : darkColors.error,
        },
      ]}
    />
    <Text style={styles.healthLabel}>{label}</Text>
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
  scroll: {
    padding: spacing.base,
    rowGap: spacing.base,
    paddingBottom: spacing.xxxl,
  },
  incidentsCard: {
    backgroundColor: darkColors.surface,
    padding: spacing.base,
    borderRadius: radius.lg,
    rowGap: spacing.sm,
    ...shadows.xs,
  },
  sectionTitle: { ...textStyles.h4, color: darkColors.textPrimary },
  incidentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.sm,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: darkColors.divider,
  },
  incidentBody: { flex: 1 },
  incidentTitle: { ...textStyles.body, color: darkColors.textPrimary },
  incidentMeta: { ...textStyles.caption, color: darkColors.textMuted },
  healthCard: {
    backgroundColor: darkColors.surface,
    padding: spacing.base,
    borderRadius: radius.lg,
    rowGap: spacing.sm,
    ...shadows.xs,
  },
  healthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  healthDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  healthLabel: { ...textStyles.body, color: darkColors.textPrimary },
});

export default SystemStatsScreen;
