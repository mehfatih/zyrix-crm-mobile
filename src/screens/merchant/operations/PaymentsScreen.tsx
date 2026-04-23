/**
 * PaymentsScreen — list of payments with summary cards, filter chips,
 * and a FAB that opens the payment-link generator.
 */

import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { CurrencyDisplay } from '../../../components/forms/CurrencyDisplay';
import { Header } from '../../../components/common/Header';
import { Icon } from '../../../components/common/Icon';
import { PaymentCard } from '../../../components/feature-specific/PaymentCard';
import { SkeletonCard } from '../../../components/common/SkeletonCard';
import { colors } from '../../../constants/colors';
import { hitSlop, radius, shadows, spacing } from '../../../constants/spacing';
import { textStyles } from '../../../constants/typography';
import { useCountryConfig } from '../../../hooks/useCountryConfig';
import { usePayments, usePaymentSummary } from '../../../hooks/usePayments';
import type { Payment, PaymentStatus } from '../../../types/billing';
import type { MerchantOperationsStackParamList } from '../../../navigation/types';

type StatusFilter = PaymentStatus | 'all';

type Navigation = NativeStackNavigationProp<
  MerchantOperationsStackParamList,
  'Payments'
>;

const STATUS_CHIPS: readonly StatusFilter[] = [
  'all',
  'paid',
  'pending',
  'failed',
  'refunded',
];

export const PaymentsScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<Navigation>();
  const { config } = useCountryConfig();

  const [status, setStatus] = useState<StatusFilter>('all');

  const summaryQuery = usePaymentSummary(config.currency);
  const paymentsQuery = usePayments({
    filters: status === 'all' ? undefined : { status },
    pageSize: 50,
  });

  const items = useMemo(
    () => paymentsQuery.data?.items ?? [],
    [paymentsQuery.data]
  );

  const openDetail = (payment: Payment): void => {
    navigation.navigate('PaymentDetail', { paymentId: payment.id });
  };

  const onNewPaymentLink = (): void => {
    navigation.navigate('NewPaymentLink');
  };

  const summary = summaryQuery.data;

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <Header
        title={t('payments.title')}
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
          <Pressable
            onPress={() => navigation.navigate('Refunds')}
            hitSlop={hitSlop.md}
            style={styles.headerBtn}
          >
            <Icon name="refresh-circle-outline" size={22} color={colors.textInverse} />
          </Pressable>
        }
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.summaryRow}
      >
        <SummaryCard
          label={t('payments.paid')}
          amount={summary?.totalReceived ?? 0}
          color={colors.success}
        />
        <SummaryCard
          label={t('payments.pending')}
          amount={summary?.pending ?? 0}
          color={colors.warning}
        />
        <SummaryCard
          label={t('payments.refunded')}
          amount={summary?.refunded ?? 0}
          color={colors.textMuted}
        />
        <SummaryCard
          label={t('payments.failed')}
          amount={summary?.failed ?? 0}
          color={colors.error}
        />
      </ScrollView>

      <View style={styles.filterRow}>
        {STATUS_CHIPS.map((key) => (
          <Pressable
            key={key}
            onPress={() => setStatus(key)}
            style={[
              styles.chip,
              status === key ? styles.chipActive : null,
            ]}
          >
            <Text
              style={[
                styles.chipText,
                status === key ? styles.chipTextActive : null,
              ]}
            >
              {key === 'all' ? t('customers.title') : t(`payments.${key}`)}
            </Text>
          </Pressable>
        ))}
      </View>

      {paymentsQuery.isLoading ? (
        <View style={styles.list}>
          {Array.from({ length: 4 }).map((_, idx) => (
            <SkeletonCard key={idx} height={92} />
          ))}
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(payment) => payment.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <PaymentCard payment={item} onPress={openDetail} />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Icon name="card-outline" size={44} color={colors.primary} />
              <Text style={styles.emptyTitle}>{t('payments.title')}</Text>
            </View>
          }
        />
      )}

      <Pressable
        onPress={onNewPaymentLink}
        style={({ pressed }) => [
          styles.fab,
          pressed ? { opacity: 0.9 } : null,
        ]}
      >
        <Icon name="link-outline" size={26} color={colors.textInverse} />
      </Pressable>
    </SafeAreaView>
  );
};

const SummaryCard: React.FC<{
  label: string;
  amount: number;
  color: string;
}> = ({ label, amount, color }) => (
  <View style={[styles.summaryCard, { borderLeftColor: color }]}>
    <Text style={styles.summaryLabel}>{label}</Text>
    <CurrencyDisplay amount={amount} size="medium" color={color} />
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
  summaryRow: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
    columnGap: spacing.sm,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    borderRadius: radius.lg,
    borderLeftWidth: 4,
    rowGap: 2,
    minWidth: 160,
    ...shadows.xs,
  },
  summaryLabel: {
    ...textStyles.caption,
    color: colors.textMuted,
  },
  filterRow: {
    flexDirection: 'row',
    columnGap: spacing.xs,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
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
    paddingBottom: spacing.xxxl * 2,
  },
  empty: {
    alignItems: 'center',
    paddingTop: spacing.xxxl,
    rowGap: spacing.sm,
  },
  emptyTitle: {
    ...textStyles.h4,
    color: colors.textPrimary,
  },
  fab: {
    position: 'absolute',
    insetInlineEnd: spacing.lg,
    bottom: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
});

export default PaymentsScreen;
