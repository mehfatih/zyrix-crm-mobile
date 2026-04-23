/**
 * NewRefundScreen — pick a paid payment, choose full or partial,
 * select a reason (predefined or custom "Other"), and process.
 */

import React, { useMemo, useState } from 'react';
import {
  Alert,
  I18nManager,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';

import { Button } from '../../../components/common/Button';
import { Header } from '../../../components/common/Header';
import { LocalizedCurrencyInput } from '../../../components/common/LocalizedCurrencyInput';
import { SearchableDropdown, type DropdownItem } from '../../../components/forms/SearchableDropdown';
import { colors } from '../../../constants/colors';
import { radius, shadows, spacing } from '../../../constants/spacing';
import { textStyles } from '../../../constants/typography';
import { useCountryConfig } from '../../../hooks/useCountryConfig';
import { usePayments, useRefund } from '../../../hooks/usePayments';

type RefundType = 'full' | 'partial';
type RefundReason =
  | 'customerRequest'
  | 'productDefect'
  | 'cancelledOrder'
  | 'duplicateCharge'
  | 'other';

const REASONS: readonly RefundReason[] = [
  'customerRequest',
  'productDefect',
  'cancelledOrder',
  'duplicateCharge',
  'other',
];

export const NewRefundScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { formatCurrency } = useCountryConfig();
  const refundMut = useRefund();

  const paymentsQuery = usePayments({ filters: { status: 'paid' }, pageSize: 50 });

  const paymentOptions = useMemo<DropdownItem[]>(
    () =>
      (paymentsQuery.data?.items ?? []).map((payment) => ({
        id: payment.id,
        label: `${payment.customerName ?? '—'} · ${formatCurrency(payment.amount)}`,
        subtitle: payment.transactionId,
      })),
    [paymentsQuery.data, formatCurrency]
  );

  const [paymentSelection, setPaymentSelection] = useState<DropdownItem | null>(null);
  const [type, setType] = useState<RefundType>('full');
  const [partialAmount, setPartialAmount] = useState('');
  const [reason, setReason] = useState<RefundReason>('customerRequest');
  const [customReason, setCustomReason] = useState('');
  const [method, setMethod] = useState<'original' | 'bank_transfer'>('original');
  const [notes, setNotes] = useState('');

  const selectedPayment = useMemo(
    () =>
      paymentsQuery.data?.items.find(
        (payment) => payment.id === paymentSelection?.id
      ) ?? null,
    [paymentsQuery.data, paymentSelection]
  );

  const finalAmount =
    type === 'full'
      ? selectedPayment?.amount ?? 0
      : Number(partialAmount.replace(/,/g, '')) || 0;

  const finalReason =
    reason === 'other' ? customReason.trim() : t(`refunds.${reason}`);

  const canSubmit =
    !!selectedPayment &&
    finalAmount > 0 &&
    (reason !== 'other' || customReason.trim().length > 0) &&
    finalAmount <= (selectedPayment?.amount ?? 0);

  const submit = (): void => {
    if (!selectedPayment) return;
    Alert.alert(
      t('refunds.processRefund'),
      `${formatCurrency(finalAmount)} — ${finalReason}`,
      [
        { text: t('common.cancel') },
        {
          text: t('refunds.processRefund'),
          style: 'destructive',
          onPress: async () => {
            try {
              await refundMut.mutateAsync({
                paymentId: selectedPayment.id,
                amount: finalAmount,
                reason: finalReason,
                method,
                notes,
              });
              navigation.goBack();
            } catch (err) {
              console.warn('[refund] failed', err);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <Header
        title={t('refunds.newRefund')}
        onBack={() => navigation.goBack()}
      />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <SearchableDropdown
            items={paymentOptions}
            value={paymentSelection}
            onChange={setPaymentSelection}
            label={t('payments.title')}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.fieldLabel}>{t('refunds.refundType')}</Text>
          <View style={styles.row}>
            {(['full', 'partial'] as RefundType[]).map((option) => (
              <Pressable
                key={option}
                onPress={() => setType(option)}
                style={[
                  styles.optionChip,
                  type === option ? styles.optionChipActive : null,
                ]}
              >
                <Text
                  style={[
                    styles.optionLabel,
                    type === option ? { color: colors.textInverse } : null,
                  ]}
                >
                  {t(`refunds.${option}`)}
                </Text>
              </Pressable>
            ))}
          </View>
          {type === 'partial' ? (
            <LocalizedCurrencyInput
              value={partialAmount}
              onChangeText={setPartialAmount}
              label={t('payments.amount')}
            />
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.fieldLabel}>{t('refunds.reason')}</Text>
          <View style={styles.reasonGrid}>
            {REASONS.map((entry) => (
              <Pressable
                key={entry}
                onPress={() => setReason(entry)}
                style={[
                  styles.reasonChip,
                  reason === entry ? styles.reasonChipActive : null,
                ]}
              >
                <Text
                  style={[
                    styles.reasonLabel,
                    reason === entry ? { color: colors.textInverse } : null,
                  ]}
                >
                  {t(`refunds.${entry}`)}
                </Text>
              </Pressable>
            ))}
          </View>
          {reason === 'other' ? (
            <TextInput
              value={customReason}
              onChangeText={setCustomReason}
              placeholder={t('refunds.other')}
              placeholderTextColor={colors.textMuted}
              style={[
                styles.textInput,
                { textAlign: I18nManager.isRTL ? 'right' : 'left' },
              ]}
            />
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.fieldLabel}>{t('refunds.refundMethod')}</Text>
          <View style={styles.row}>
            {(['original', 'bank_transfer'] as const).map((option) => (
              <Pressable
                key={option}
                onPress={() => setMethod(option)}
                style={[
                  styles.optionChip,
                  method === option ? styles.optionChipActive : null,
                ]}
              >
                <Text
                  style={[
                    styles.optionLabel,
                    method === option ? { color: colors.textInverse } : null,
                  ]}
                >
                  {t(`refunds.${option === 'original' ? 'originalMethod' : 'bankTransfer'}`)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.fieldLabel}>{t('quoteBuilder.internalNotes')}</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder={t('quoteBuilder.internalNotes')}
            placeholderTextColor={colors.textMuted}
            multiline
            style={[
              styles.textarea,
              { textAlign: I18nManager.isRTL ? 'right' : 'left' },
            ]}
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label={t('refunds.processRefund')}
          onPress={submit}
          disabled={!canSubmit}
          loading={refundMut.isPending}
          fullWidth
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: {
    padding: spacing.base,
    paddingBottom: spacing.xxxl,
    rowGap: spacing.base,
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.base,
    borderRadius: radius.lg,
    rowGap: spacing.sm,
    ...shadows.xs,
  },
  fieldLabel: {
    ...textStyles.label,
    color: colors.textSecondary,
  },
  row: {
    flexDirection: 'row',
    columnGap: spacing.sm,
  },
  optionChip: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
  },
  optionChipActive: {
    backgroundColor: colors.primary,
  },
  optionLabel: {
    ...textStyles.caption,
    color: colors.primary,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  reasonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  reasonChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reasonChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  reasonLabel: {
    ...textStyles.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  textInput: {
    ...textStyles.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.base,
    padding: spacing.sm,
  },
  textarea: {
    ...textStyles.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.base,
    padding: spacing.sm,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  footer: {
    padding: spacing.base,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    backgroundColor: colors.surface,
  },
});

export default NewRefundScreen;
