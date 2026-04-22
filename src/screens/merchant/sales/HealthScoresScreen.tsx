/**
 * HealthScoresScreen — customers ranked by health score with filters
 * for At Risk (< 40) and Healthy (> 70).
 */

import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Header } from '../../../components/common/Header';
import { Icon } from '../../../components/common/Icon';
import { colors } from '../../../constants/colors';
import { findCountry } from '../../../constants/countries';
import { radius, shadows, spacing } from '../../../constants/spacing';
import { textStyles } from '../../../constants/typography';
import { useCountryConfig } from '../../../hooks/useCountryConfig';
import { useCustomers } from '../../../hooks/useCustomers';
import type { SupportedLanguage } from '../../../i18n';
import { useUiStore } from '../../../store/uiStore';

type Filter = 'all' | 'risk' | 'healthy';

const reason = (
  score: number,
  t: (k: string) => string
): string | null => {
  if (score >= 40) return null;
  return score < 25
    ? t('healthScores.missedPayments')
    : t('healthScores.noContact');
};

const gaugeColor = (score: number): string => {
  if (score >= 70) return colors.success;
  if (score >= 40) return colors.warning;
  return colors.error;
};

export const HealthScoresScreen: React.FC = () => {
  const { t } = useTranslation();
  const { formatDate } = useCountryConfig();
  const language = useUiStore((s) => s.language) as SupportedLanguage;
  const customersQuery = useCustomers({ pageSize: 100 });
  const [filter, setFilter] = useState<Filter>('all');

  const sorted = useMemo(() => {
    const items = customersQuery.data?.items ?? [];
    const filtered = items.filter((c) => {
      if (filter === 'risk') return c.healthScore < 40;
      if (filter === 'healthy') return c.healthScore > 70;
      return true;
    });
    return filtered.sort((a, b) => a.healthScore - b.healthScore);
  }, [customersQuery.data, filter]);

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <Header title={t('customers.healthScore')} />

      <View style={styles.filterRow}>
        {(
          [
            { key: 'all', label: 'customers.title' },
            { key: 'risk', label: 'healthScores.atRisk' },
            { key: 'healthy', label: 'healthScores.healthy' },
          ] as const
        ).map((chip) => (
          <Pressable
            key={chip.key}
            onPress={() => setFilter(chip.key)}
            style={[
              styles.chip,
              filter === chip.key ? styles.chipActive : null,
            ]}
          >
            <Text
              style={[
                styles.chipText,
                filter === chip.key ? styles.chipTextActive : null,
              ]}
            >
              {t(chip.label)}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {sorted.map((customer) => {
          const reasonText = reason(customer.healthScore, t);
          return (
            <View key={customer.id} style={styles.row}>
              <View style={styles.gauge}>
                <View
                  style={[
                    styles.gaugeFill,
                    {
                      backgroundColor: gaugeColor(customer.healthScore),
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.gaugeText,
                    { color: gaugeColor(customer.healthScore) },
                  ]}
                >
                  {customer.healthScore}
                </Text>
              </View>
              <View style={styles.body}>
                <View style={styles.headerRow}>
                  <Text style={styles.name} numberOfLines={1}>
                    {customer.name}
                  </Text>
                  <Text style={styles.flag}>
                    {findCountry(customer.country).flag}
                  </Text>
                </View>
                <Text style={styles.meta}>
                  {`${t('customers.memberSince')}: ${formatDate(customer.createdAt)}`}
                </Text>
                <Text style={styles.meta}>
                  {`${t('dashboard.recentActivity')}: ${formatDate(customer.lastContactAt)}`}
                </Text>
                {reasonText ? (
                  <View style={styles.reasonRow}>
                    <Icon
                      name="alert-circle-outline"
                      size={14}
                      color={colors.error}
                    />
                    <Text style={styles.reasonText}>{reasonText}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  filterRow: {
    flexDirection: 'row',
    padding: spacing.base,
    columnGap: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    ...textStyles.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  chipTextActive: { color: colors.textInverse },
  list: {
    padding: spacing.base,
    paddingBottom: spacing.xxl,
    rowGap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.base,
    columnGap: spacing.base,
    ...shadows.xs,
  },
  gauge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  gaugeFill: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.18,
  },
  gaugeText: {
    ...textStyles.h4,
    fontWeight: '800',
  },
  body: { flex: 1, rowGap: 2 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    ...textStyles.bodyMedium,
    color: colors.textPrimary,
    flex: 1,
  },
  flag: {
    fontSize: 16,
  },
  meta: {
    ...textStyles.caption,
    color: colors.textMuted,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 4,
    marginTop: spacing.xs,
  },
  reasonText: {
    ...textStyles.caption,
    color: colors.error,
    flex: 1,
  },
});

export default HealthScoresScreen;
