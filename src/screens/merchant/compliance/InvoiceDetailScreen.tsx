/**
 * InvoiceDetailScreen — country-aware invoice viewer. Picks one of:
 *   - ZATCAInvoicePreview  (Saudi)
 *   - EFaturaInvoicePreview (Turkey)
 *   - GenericInvoicePreview (everything else)
 *
 * Action bar handles download/send/mark-paid/cancel/submit.
 */

import React, { useState } from 'react';
import {
  Alert,
  Linking,
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

import { EFaturaInvoicePreview } from '../../../components/feature-specific/EFaturaInvoicePreview';
import { GenericInvoicePreview } from '../../../components/feature-specific/GenericInvoicePreview';
import { Header } from '../../../components/common/Header';
import { Icon, type AnyIconName } from '../../../components/common/Icon';
import { SkeletonCard } from '../../../components/common/SkeletonCard';
import { ZATCAInvoicePreview } from '../../../components/feature-specific/ZATCAInvoicePreview';
import { colors } from '../../../constants/colors';
import {
  useCancelInvoice,
  useDownloadInvoicePDF,
  useInvoice,
  useMarkPaid,
  useSendInvoice,
  useSubmitEFatura,
  useSubmitZATCA,
} from '../../../hooks/useInvoices';
import { radius, shadows, spacing } from '../../../constants/spacing';
import { textStyles } from '../../../constants/typography';
import { useCountryConfig } from '../../../hooks/useCountryConfig';
import { useToast } from '../../../hooks/useToast';
import type {
  ComplianceStatus,
  InvoiceStatus,
} from '../../../types/billing';
import type { MerchantComplianceStackParamList } from '../../../navigation/types';

type Route = RouteProp<MerchantComplianceStackParamList, 'InvoiceDetail'>;

const STATUS_ORDER: readonly InvoiceStatus[] = [
  'draft',
  'issued',
  'sent',
  'viewed',
  'paid',
];

const STATUS_TONE: Record<ComplianceStatus, { background: string; color: string }> = {
  pending: { background: colors.warningSoft, color: colors.warning },
  submitted: { background: colors.infoSoft, color: colors.info },
  accepted: { background: colors.successSoft, color: colors.success },
  rejected: { background: colors.errorSoft, color: colors.error },
};

export const InvoiceDetailScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute<Route>();
  const toast = useToast();
  const { formatDate } = useCountryConfig();
  const { data: invoice, isLoading } = useInvoice(route.params.invoiceId);

  const downloadMut = useDownloadInvoicePDF();
  const sendMut = useSendInvoice();
  const markPaidMut = useMarkPaid();
  const cancelMut = useCancelInvoice();
  const submitZATCAMut = useSubmitZATCA();
  const submitEFaturaMut = useSubmitEFatura();

  const [actionsOpen, setActionsOpen] = useState(false);

  const download = async (): Promise<void> => {
    if (!invoice) return;
    try {
      const url = await downloadMut.mutateAsync(invoice.id);
      await Linking.openURL(url);
    } catch (err) {
      console.warn('[invoice] download', err);
    }
  };

  const send = (channel: 'email' | 'whatsapp' | 'sms'): void => {
    if (!invoice) return;
    sendMut.mutate({ id: invoice.id, channel });
  };

  const markPaid = (): void => {
    if (!invoice) return;
    Alert.alert(
      t('invoices.markAsPaid'),
      `${invoice.customerName} — ${invoice.total}`,
      [
        { text: t('common.cancel') },
        {
          text: t('invoices.markAsPaid'),
          onPress: () =>
            markPaidMut.mutate({
              id: invoice.id,
              method: 'bank_transfer',
              amount: invoice.total,
            }),
        },
      ]
    );
  };

  const cancelInvoice = (): void => {
    if (!invoice) return;
    Alert.prompt?.(
      t('invoices.cancel'),
      t('invoices.cancelReason'),
      [
        { text: t('common.cancel') },
        {
          text: t('invoices.cancel'),
          style: 'destructive',
          onPress: (reason?: string) =>
            cancelMut.mutate({
              id: invoice.id,
              reason: reason ?? 'Customer request',
            }),
        },
      ]
    );
    if (typeof Alert.prompt === 'undefined') {
      cancelMut.mutate({ id: invoice.id, reason: 'Customer request' });
    }
  };

  const submitZATCA = (): void => {
    if (!invoice) return;
    submitZATCAMut.mutate(invoice.id);
  };

  const submitEFatura = (): void => {
    if (!invoice) return;
    submitEFaturaMut.mutate(invoice.id);
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <Header
        title={invoice?.invoiceNumber ?? t('invoices.title')}
        onBack={() => navigation.goBack()}
        rightSlot={
          <Pressable
            onPress={() => setActionsOpen((prev) => !prev)}
            style={styles.headerBtn}
          >
            <Icon
              name="ellipsis-vertical"
              size={20}
              color={colors.textInverse}
            />
          </Pressable>
        }
      />

      {isLoading || !invoice ? (
        <View style={{ padding: spacing.base }}>
          <SkeletonCard height={140} />
          <SkeletonCard height={200} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.statusCard}>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: colors.primarySoft },
              ]}
            >
              <Text style={styles.statusText}>
                {t(`invoices.${invoice.status}`)}
              </Text>
            </View>
            <View style={styles.timelineRow}>
              {STATUS_ORDER.map((status, idx) => {
                const reachedIdx = STATUS_ORDER.indexOf(invoice.status);
                const reached = idx <= reachedIdx;
                return (
                  <View key={status} style={styles.timelineNode}>
                    <View
                      style={[
                        styles.timelineDot,
                        {
                          backgroundColor: reached
                            ? colors.primary
                            : colors.border,
                        },
                      ]}
                    />
                    <Text
                      style={[
                        styles.timelineLabel,
                        reached
                          ? { color: colors.primaryDark, fontWeight: '700' }
                          : null,
                      ]}
                    >
                      {t(`invoices.${status}`)}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          {invoice.zatca ? (
            <ComplianceCard
              title="ZATCA"
              status={invoice.zatca.status}
              submittedAt={invoice.zatca.submittedAt}
              uuid={invoice.zatca.uuid}
              error={invoice.zatca.errorMessage}
              dateFormat={formatDate}
            />
          ) : null}
          {invoice.efatura ? (
            <ComplianceCard
              title="e-Fatura"
              status={invoice.efatura.status}
              submittedAt={invoice.efatura.submittedAt}
              uuid={invoice.efatura.uuid}
              error={invoice.efatura.errorMessage}
              dateFormat={formatDate}
            />
          ) : null}

          {invoice.customerCountry === 'SA' ? (
            <ZATCAInvoicePreview invoice={invoice} />
          ) : invoice.customerCountry === 'TR' ? (
            <EFaturaInvoicePreview invoice={invoice} />
          ) : (
            <GenericInvoicePreview invoice={invoice} />
          )}

          {actionsOpen ? (
            <View style={styles.actionsCard}>
              <ActionRow
                icon="download-outline"
                label={t('invoices.downloadPDF')}
                onPress={() => void download()}
              />
              <ActionRow
                icon="mail-outline"
                label={`${t('common.continue')} · email`}
                onPress={() => send('email')}
              />
              <ActionRow
                icon="logo-whatsapp"
                label={`${t('common.continue')} · WhatsApp`}
                onPress={() => send('whatsapp')}
              />
              <ActionRow
                icon="checkmark-circle-outline"
                label={t('invoices.markAsPaid')}
                onPress={markPaid}
              />
              {invoice.zatca && invoice.zatca.status !== 'accepted' ? (
                <ActionRow
                  icon="shield-checkmark-outline"
                  label={t('invoices.submitToZATCA')}
                  onPress={submitZATCA}
                />
              ) : null}
              {invoice.efatura && invoice.efatura.status !== 'accepted' ? (
                <ActionRow
                  icon="shield-checkmark-outline"
                  label={t('invoices.submitToEFatura')}
                  onPress={submitEFatura}
                />
              ) : null}
              <ActionRow
                icon="copy-outline"
                label={t('invoices.duplicate')}
                onPress={() => toast.info(t('invoices.duplicate'))}
              />
              <ActionRow
                icon="close-circle-outline"
                label={t('invoices.cancel')}
                tone="error"
                onPress={cancelInvoice}
              />
            </View>
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const ComplianceCard: React.FC<{
  title: string;
  status: ComplianceStatus;
  submittedAt: string;
  uuid?: string;
  error?: string;
  dateFormat: (input: string) => string;
}> = ({ title, status, submittedAt, uuid, error, dateFormat }) => {
  const tone = STATUS_TONE[status];
  return (
    <View
      style={[
        styles.complianceCard,
        { backgroundColor: tone.background, borderColor: tone.color },
      ]}
    >
      <View style={styles.complianceHeader}>
        <Icon name="shield-checkmark-outline" size={20} color={tone.color} />
        <Text style={[styles.complianceTitle, { color: tone.color }]}>
          {`${title} · ${status}`}
        </Text>
      </View>
      <Text style={styles.complianceMeta}>
        {`Submitted: ${dateFormat(submittedAt)}`}
      </Text>
      {uuid ? <Text style={styles.complianceMeta}>{`UUID: ${uuid}`}</Text> : null}
      {error ? (
        <Text style={[styles.complianceMeta, { color: colors.error }]}>
          {error}
        </Text>
      ) : null}
    </View>
  );
};

const ActionRow: React.FC<{
  icon: AnyIconName;
  label: string;
  onPress: () => void;
  tone?: 'primary' | 'error';
}> = ({ icon, label, onPress, tone = 'primary' }) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      styles.actionRow,
      pressed ? { opacity: 0.85 } : null,
    ]}
  >
    <Icon
      name={icon}
      size={20}
      color={tone === 'error' ? colors.error : colors.primary}
    />
    <Text
      style={[
        styles.actionLabel,
        tone === 'error' ? { color: colors.error } : null,
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
    paddingBottom: spacing.xxl,
    rowGap: spacing.base,
  },
  statusCard: {
    backgroundColor: colors.surface,
    padding: spacing.base,
    borderRadius: radius.lg,
    rowGap: spacing.sm,
    ...shadows.xs,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  statusText: {
    ...textStyles.label,
    color: colors.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  timelineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
  },
  timelineNode: {
    alignItems: 'center',
    rowGap: 4,
    flex: 1,
  },
  timelineDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  timelineLabel: {
    ...textStyles.caption,
    color: colors.textMuted,
  },
  complianceCard: {
    padding: spacing.base,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    rowGap: 4,
  },
  complianceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.xs,
  },
  complianceTitle: {
    ...textStyles.bodyMedium,
    fontWeight: '700',
  },
  complianceMeta: {
    ...textStyles.caption,
    color: colors.textSecondary,
  },
  actionsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.sm,
    rowGap: spacing.xs,
    ...shadows.xs,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  actionLabel: {
    ...textStyles.body,
    color: colors.textPrimary,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default InvoiceDetailScreen;
