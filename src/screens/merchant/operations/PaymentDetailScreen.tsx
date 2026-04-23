/**
 * PaymentDetailScreen — full breakdown of a single payment with
 * info cards, transaction events, and the refund/resend/download
 * actions appropriate to the status.
 */

import React from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';

import { CurrencyDisplay } from '../../../components/forms/CurrencyDisplay';
import { Header } from '../../../components/common/Header';
import { Icon, type AnyIconName } from '../../../components/common/Icon';
import { SkeletonCard } from '../../../components/common/SkeletonCard';
import { colors } from '../../../constants/colors';
import { radius, shadows, spacing } from '../../../constants/spacing';
import { textStyles } from '../../../constants/typography';
import { useCountryConfig } from '../../../hooks/useCountryConfig';
import { usePayment } from '../../../hooks/usePayments';
import type { MerchantOperationsStackParamList } from '../../../navigation/types';

type Route = RouteProp<MerchantOperationsStackParamList, 'PaymentDetail'>;

export const PaymentDetailScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute<Route>();
  const { formatDate } = useCountryConfig();
  const { data: payment, isLoading } = usePayment(route.params.paymentId);

  const refund = (): void => {
    if (!payment) return;
    Alert.alert(
      t('payments.refund'),
      `${payment.transactionId}`,
      [
        { text: t('common.cancel') },
        { text: t('payments.refund'), onPress: () => undefined },
      ]
    );
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <Header
        title={payment ? `${t('payments.title')} #${payment.transactionId ?? payment.id}` : t('payments.title')}
        onBack={() => navigation.goBack()}
      />
      {isLoading || !payment ? (
        <View style={{ padding: spacing.base }}>
          <SkeletonCard height={120} />
          <SkeletonCard height={140} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.heroCard}>
            <Text style={styles.heroLabel}>
              {t(`payments.${payment.status}`).toUpperCase()}
            </Text>
            <CurrencyDisplay
              amount={payment.amount}
              size="large"
              color={
                payment.status === 'paid'
                  ? colors.success
                  : payment.status === 'failed'
                    ? colors.error
                    : colors.primaryDark
              }
            />
            {payment.gatewayFee ? (
              <Text style={styles.heroSubtle}>
                {`${t('payments.gatewayFee')}: ${payment.gatewayFee.toFixed(2)}`}
              </Text>
            ) : null}
          </View>

          <View style={styles.card}>
            <InfoRow
              icon="person-outline"
              label={t('quoteBuilder.customer')}
              value={payment.customerName ?? '—'}
            />
            {payment.invoiceId ? (
              <InfoRow
                icon="document-text-outline"
                label={t('invoices.invoiceNumber')}
                value={payment.invoiceId}
              />
            ) : null}
            <InfoRow
              icon="card-outline"
              label={t('payments.paymentMethod')}
              value={payment.method}
            />
            {payment.transactionId ? (
              <InfoRow
                icon="barcode-outline"
                label={t('payments.transactionId')}
                value={payment.transactionId}
              />
            ) : null}
            <InfoRow
              icon="calendar-outline"
              label={t('common.welcome')}
              value={formatDate(payment.createdAt)}
            />
            {payment.gatewayFee ? (
              <InfoRow
                icon="cash-outline"
                label={t('payments.netAmount')}
                value={(payment.amount - payment.gatewayFee).toFixed(2)}
              />
            ) : null}
          </View>

          <View style={styles.timeline}>
            <Text style={styles.sectionTitle}>{t('payments.title')}</Text>
            <TimelineRow
              tone={colors.success}
              label={t('payments.paid')}
              date={payment.paidAt ?? payment.createdAt}
              formatDate={formatDate}
            />
            {payment.refundedAt ? (
              <TimelineRow
                tone={colors.warning}
                label={t('payments.refunded')}
                date={payment.refundedAt}
                formatDate={formatDate}
              />
            ) : null}
            {payment.failureReason ? (
              <TimelineRow
                tone={colors.error}
                label={payment.failureReason}
                date={payment.createdAt}
                formatDate={formatDate}
              />
            ) : null}
          </View>

          <View style={styles.actionsRow}>
            {payment.status === 'paid' ? (
              <ActionPill
                icon="refresh-outline"
                label={t('payments.refund')}
                tone="error"
                onPress={refund}
              />
            ) : null}
            <ActionPill
              icon="mail-outline"
              label={t('payments.resendReceipt')}
              tone="primary"
              onPress={() => Alert.alert(t('payments.resendReceipt'))}
            />
            <ActionPill
              icon="download-outline"
              label={t('payments.downloadReceipt')}
              tone="primary"
              onPress={() => Alert.alert(t('payments.downloadReceipt'))}
            />
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const InfoRow: React.FC<{ icon: AnyIconName; label: string; value: string }> = ({
  icon,
  label,
  value,
}) => (
  <View style={styles.infoRow}>
    <Icon name={icon} size={18} color={colors.primary} />
    <View style={styles.infoBody}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  </View>
);

const TimelineRow: React.FC<{
  tone: string;
  label: string;
  date: string;
  formatDate: (value: string) => string;
}> = ({ tone, label, date, formatDate }) => (
  <View style={styles.timelineRow}>
    <View style={[styles.timelineDot, { backgroundColor: tone }]} />
    <View style={styles.timelineBody}>
      <Text style={styles.timelineLabel}>{label}</Text>
      <Text style={styles.timelineDate}>{formatDate(date)}</Text>
    </View>
  </View>
);

const ActionPill: React.FC<{
  icon: AnyIconName;
  label: string;
  tone: 'primary' | 'error';
  onPress: () => void;
}> = ({ icon, label, tone, onPress }) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      styles.action,
      tone === 'error' ? styles.actionError : styles.actionPrimary,
      pressed ? { opacity: 0.85 } : null,
    ]}
  >
    <Icon
      name={icon}
      size={16}
      color={tone === 'error' ? colors.error : colors.primary}
    />
    <Text
      style={[
        styles.actionText,
        { color: tone === 'error' ? colors.error : colors.primary },
      ]}
    >
      {label}
    </Text>
  </Pressable>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: {
    padding: spacing.base,
    rowGap: spacing.base,
    paddingBottom: spacing.xxl,
  },
  heroCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.xl,
    rowGap: spacing.xs,
    alignItems: 'flex-start',
    ...shadows.sm,
  },
  heroLabel: {
    ...textStyles.label,
    color: colors.primary,
    fontWeight: '700',
    letterSpacing: 1,
  },
  heroSubtle: {
    ...textStyles.caption,
    color: colors.textMuted,
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.base,
    borderRadius: radius.lg,
    rowGap: spacing.sm,
    ...shadows.xs,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  infoBody: { flex: 1 },
  infoLabel: { ...textStyles.caption, color: colors.textMuted },
  infoValue: { ...textStyles.body, color: colors.textPrimary },
  timeline: {
    backgroundColor: colors.surface,
    padding: spacing.base,
    borderRadius: radius.lg,
    rowGap: spacing.sm,
    ...shadows.xs,
  },
  sectionTitle: {
    ...textStyles.h4,
    color: colors.textPrimary,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.sm,
  },
  timelineDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  timelineBody: { flex: 1 },
  timelineLabel: {
    ...textStyles.body,
    color: colors.textPrimary,
  },
  timelineDate: {
    ...textStyles.caption,
    color: colors.textMuted,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    borderRadius: radius.pill,
  },
  actionPrimary: {
    backgroundColor: colors.primarySoft,
  },
  actionError: {
    backgroundColor: colors.errorSoft,
  },
  actionText: {
    ...textStyles.button,
  },
});

export default PaymentDetailScreen;
