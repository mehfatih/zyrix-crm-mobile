/**
 * PaymentCard — list row for the Payments screen. Status badge swaps
 * tones for paid/pending/failed/refunded, and the method icon mirrors
 * the visuals used in `PaymentMethodsList`.
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { CurrencyDisplay } from '../forms/CurrencyDisplay';
import { Icon, type AnyIconName } from '../common/Icon';
import { colors } from '../../constants/colors';
import { radius, shadows, spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';
import { useCountryConfig } from '../../hooks/useCountryConfig';
import type { Payment, PaymentStatus } from '../../types/billing';

export interface PaymentCardProps {
  payment: Payment;
  onPress?: (payment: Payment) => void;
}

const STATUS_TONE: Record<
  PaymentStatus,
  { background: string; color: string }
> = {
  paid: { background: colors.successSoft, color: colors.success },
  pending: { background: colors.warningSoft, color: colors.warning },
  failed: { background: colors.errorSoft, color: colors.error },
  refunded: { background: colors.surfaceAlt, color: colors.textMuted },
  partial_refund: { background: colors.surfaceAlt, color: colors.textMuted },
};

const METHOD_VISUAL: Record<
  string,
  { kind: 'icon'; iconName: AnyIconName } | { kind: 'badge'; badge: string }
> = {
  cash: { kind: 'icon', iconName: 'cash-outline' },
  bank_transfer: { kind: 'icon', iconName: 'swap-horizontal-outline' },
  applepay: { kind: 'icon', iconName: 'logo-apple' },
  visa: { kind: 'icon', iconName: 'card-outline' },
  mastercard: { kind: 'icon', iconName: 'card-outline' },
  mada: { kind: 'badge', badge: 'مدى' },
  stcpay: { kind: 'badge', badge: 'STC' },
  knet: { kind: 'badge', badge: 'KNET' },
  benefit: { kind: 'badge', badge: 'B' },
  thawani: { kind: 'badge', badge: 'Th' },
  omannet: { kind: 'badge', badge: 'OM' },
  naps: { kind: 'badge', badge: 'NAPS' },
  iyzico: { kind: 'badge', badge: 'iyzi' },
  paytr: { kind: 'badge', badge: 'PT' },
  troy: { kind: 'badge', badge: 'Troy' },
  tabby: { kind: 'badge', badge: 'tabby' },
  tamara: { kind: 'badge', badge: 'tamara' },
  fawry: { kind: 'badge', badge: 'Fawry' },
  vodafone_cash: { kind: 'badge', badge: 'VC' },
  instapay: { kind: 'badge', badge: 'IP' },
  cliq: { kind: 'badge', badge: 'CliQ' },
  stripe: { kind: 'badge', badge: 'Stripe' },
};

export const PaymentCard: React.FC<PaymentCardProps> = ({ payment, onPress }) => {
  const { t } = useTranslation();
  const { formatDate } = useCountryConfig();
  const tone = STATUS_TONE[payment.status];
  const visual = METHOD_VISUAL[payment.method] ?? { kind: 'icon', iconName: 'card-outline' as AnyIconName };

  return (
    <Pressable
      onPress={() => onPress?.(payment)}
      style={({ pressed }) => [
        styles.card,
        pressed ? { opacity: 0.85 } : null,
      ]}
      accessibilityRole="button"
    >
      <View style={styles.methodCircle}>
        {visual.kind === 'icon' ? (
          <Icon name={visual.iconName} size={20} color={colors.primary} />
        ) : (
          <Text style={styles.methodBadge}>{visual.badge}</Text>
        )}
      </View>

      <View style={styles.body}>
        <View style={styles.headerRow}>
          <Text style={styles.customer} numberOfLines={1}>
            {payment.customerName ?? t('payments.title')}
          </Text>
          <View style={[styles.statusPill, { backgroundColor: tone.background }]}>
            <Text style={[styles.statusText, { color: tone.color }]}>
              {t(`payments.${payment.status}`)}
            </Text>
          </View>
        </View>
        <View style={styles.metaRow}>
          <CurrencyDisplay amount={payment.amount} size="medium" />
          <Text style={styles.date}>{formatDate(payment.createdAt)}</Text>
        </View>
        {payment.transactionId ? (
          <Text style={styles.txn}>{payment.transactionId}</Text>
        ) : null}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.sm,
    backgroundColor: colors.surface,
    padding: spacing.base,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
    ...shadows.xs,
  },
  methodCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodBadge: {
    ...textStyles.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  body: { flex: 1, rowGap: 2 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    columnGap: spacing.xs,
  },
  customer: {
    ...textStyles.bodyMedium,
    color: colors.textPrimary,
    flex: 1,
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
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  date: {
    ...textStyles.caption,
    color: colors.textMuted,
  },
  txn: {
    ...textStyles.caption,
    color: colors.textMuted,
  },
});

export default PaymentCard;
