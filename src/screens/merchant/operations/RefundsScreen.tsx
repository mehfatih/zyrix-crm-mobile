/**
 * RefundsScreen — list of refunds with status filter and a summary
 * card showing total refunded this month.
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
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { CurrencyDisplay } from '../../../components/forms/CurrencyDisplay';
import { Header } from '../../../components/common/Header';
import { Icon } from '../../../components/common/Icon';
import { SkeletonCard } from '../../../components/common/SkeletonCard';
import { darkColors } from '../../../theme/dark';
import { radius, shadows, spacing } from '../../../constants/spacing';
import { textStyles } from '../../../constants/typography';
import { useCountryConfig } from '../../../hooks/useCountryConfig';
import { useRefundsList } from '../../../hooks/usePayments';
import type { Refund, RefundStatus } from '../../../types/billing';
import type { MerchantOperationsStackParamList } from '../../../navigation/types';

type Filter = RefundStatus | 'all';

type Navigation = NativeStackNavigationProp<
  MerchantOperationsStackParamList,
  'Refunds'
>;

const STATUS_TONE: Record<RefundStatus, { background: string; color: string }> = {
  pending: { background: darkColors.warningSoft, color: darkColors.warning },
  processing: { background: darkColors.infoSoft, color: darkColors.info },
  processed: { background: darkColors.successSoft, color: darkColors.success },
  failed: { background: darkColors.errorSoft, color: darkColors.error },
};

export const RefundsScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<Navigation>();
  const { formatDate } = useCountryConfig();
  const refundsQuery = useRefundsList();
  const [filter, setFilter] = useState<Filter>('all');

  const items = useMemo(() => {
    const raw = refundsQuery.data ?? [];
    if (filter === 'all') return raw;
    return raw.filter((refund) => refund.status === filter);
  }, [refundsQuery.data, filter]);

  const totalThisMonth = useMemo(() => {
    return (refundsQuery.data ?? [])
      .filter((refund) => refund.processedAt.startsWith('2026-04'))
      .reduce((acc, refund) => acc + refund.amount, 0);
  }, [refundsQuery.data]);

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <Header
        title={t('refunds.newRefund')}
        onBack={() => navigation.goBack()}
      />

      <View style={styles.summary}>
        <Text style={styles.summaryLabel}>{t('refunds.refundProcessed')}</Text>
        <CurrencyDisplay
          amount={totalThisMonth}
          size="large"
          color={darkColors.warning}
        />
      </View>

      <View style={styles.filterRow}>
        {(
          ['all', 'pending', 'processing', 'processed', 'failed'] as Filter[]
        ).map((key) => (
          <Pressable
            key={key}
            onPress={() => setFilter(key)}
            style={[
              styles.chip,
              filter === key ? styles.chipActive : null,
            ]}
          >
            <Text
              style={[
                styles.chipText,
                filter === key ? { color: darkColors.textOnPrimary } : null,
              ]}
            >
              {key === 'all' ? t('customers.title') : key}
            </Text>
          </Pressable>
        ))}
      </View>

      {refundsQuery.isLoading ? (
        <View style={styles.list}>
          {Array.from({ length: 3 }).map((_, idx) => (
            <SkeletonCard key={idx} height={88} />
          ))}
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {items.map((refund: Refund) => {
            const tone = STATUS_TONE[refund.status];
            return (
              <View key={refund.id} style={styles.card}>
                <View style={styles.headerRow}>
                  <Text style={styles.refundId}>{`#${refund.id}`}</Text>
                  <View style={[styles.statusPill, { backgroundColor: tone.background }]}>
                    <Text style={[styles.statusText, { color: tone.color }]}>
                      {refund.status}
                    </Text>
                  </View>
                </View>
                <Text style={styles.customer} numberOfLines={1}>
                  {refund.customerName ?? '—'}
                </Text>
                <Text style={styles.reason} numberOfLines={2}>
                  {refund.reason}
                </Text>
                <View style={styles.metaRow}>
                  <CurrencyDisplay amount={refund.amount} size="medium" />
                  <Text style={styles.date}>
                    {formatDate(refund.processedAt)}
                  </Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      <Pressable
        onPress={() => navigation.navigate('NewRefund')}
        style={({ pressed }) => [
          styles.fab,
          pressed ? { opacity: 0.9 } : null,
        ]}
      >
        <Icon name="add" size={26} color={darkColors.textOnPrimary} />
      </Pressable>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: darkColors.background },
  summary: {
    margin: spacing.base,
    backgroundColor: darkColors.surface,
    padding: spacing.base,
    borderRadius: radius.lg,
    rowGap: spacing.xs,
    ...shadows.xs,
  },
  summaryLabel: {
    ...textStyles.caption,
    color: darkColors.textMuted,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    paddingHorizontal: spacing.base,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: darkColors.border,
    backgroundColor: darkColors.surface,
  },
  chipActive: {
    backgroundColor: darkColors.primary,
    borderColor: darkColors.primary,
  },
  chipText: {
    ...textStyles.caption,
    color: darkColors.textSecondary,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  list: {
    padding: spacing.base,
    rowGap: spacing.sm,
    paddingBottom: spacing.xxxl * 2,
  },
  card: {
    backgroundColor: darkColors.surface,
    padding: spacing.base,
    borderRadius: radius.lg,
    rowGap: spacing.xs,
    ...shadows.xs,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  refundId: {
    ...textStyles.bodyMedium,
    color: darkColors.textPrimary,
    fontWeight: '700',
  },
  statusPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  statusText: {
    ...textStyles.caption,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  customer: { ...textStyles.caption, color: darkColors.textSecondary },
  reason: { ...textStyles.body, color: darkColors.textPrimary },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  date: { ...textStyles.caption, color: darkColors.textMuted },
  fab: {
    position: 'absolute',
    insetInlineEnd: spacing.lg,
    bottom: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: darkColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
});

export default RefundsScreen;
