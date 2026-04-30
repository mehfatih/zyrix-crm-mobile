/**
 * TaxInvoicesScreen — dedicated view for ZATCA / e-Fatura submissions.
 * Only shown for countries that actually have a tax compliance scheme.
 * Groups invoices by submission status with a Batch Submit affordance.
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
import { StatusPill } from '../../../components/ui/StatusPill';
import { INVOICE_STATUS_TONE } from '../../../lib/ui/status-tones';
import { darkColors } from '../../../theme/dark';
import { getPageAccent } from '../../../theme/dark/accents';

const PAGE_ACCENT = getPageAccent('taxInvoices');
import { radius, shadows, spacing } from '../../../constants/spacing';
import { textStyles } from '../../../constants/typography';
import { useCountryConfig } from '../../../hooks/useCountryConfig';
import { useInvoices, useSubmitEFatura, useSubmitZATCA } from '../../../hooks/useInvoices';
import type {
  ComplianceStatus,
  Invoice,
} from '../../../types/billing';
import type { MerchantComplianceStackParamList } from '../../../navigation/types';

type Navigation = NativeStackNavigationProp<
  MerchantComplianceStackParamList,
  'TaxInvoices'
>;

interface Group {
  key: ComplianceStatus | 'needs';
  label: string;
  items: Invoice[];
}

const submissionFor = (
  invoice: Invoice
): { status: ComplianceStatus | 'none'; system: 'zatca' | 'efatura' | 'none' } => {
  if (invoice.zatca) return { status: invoice.zatca.status, system: 'zatca' };
  if (invoice.efatura) return { status: invoice.efatura.status, system: 'efatura' };
  return { status: 'none', system: 'none' };
};

export const TaxInvoicesScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<Navigation>();
  const { config } = useCountryConfig();
  const invoicesQuery = useInvoices({ pageSize: 100 });
  const submitZATCA = useSubmitZATCA();
  const submitEFatura = useSubmitEFatura();

  const isZATCA = config.code === 'SA';
  const isEFatura = config.code === 'TR';
  const showsScreen = isZATCA || isEFatura;

  const items = useMemo(
    () => invoicesQuery.data?.items ?? [],
    [invoicesQuery.data]
  );

  const groups = useMemo<Group[]>(() => {
    if (!showsScreen) return [];
    const filtered = items.filter((invoice) =>
      isZATCA ? !!invoice.zatca : !!invoice.efatura
    );
    const buckets: Record<Group['key'], Invoice[]> = {
      needs: [],
      pending: [],
      submitted: [],
      accepted: [],
      rejected: [],
    };
    for (const invoice of filtered) {
      const submission = submissionFor(invoice);
      if (submission.status === 'pending') {
        buckets.needs.push(invoice);
      } else if (submission.status !== 'none') {
        buckets[submission.status].push(invoice);
      }
    }
    const list: Group[] = [
      { key: 'needs', label: t('taxCompliance.needsSubmission'), items: buckets.needs },
      { key: 'pending', label: t('zatca.pending'), items: buckets.pending },
      { key: 'submitted', label: 'Submitted', items: buckets.submitted },
      { key: 'accepted', label: t('zatca.accepted'), items: buckets.accepted },
      { key: 'rejected', label: t('zatca.rejected'), items: buckets.rejected },
    ];
    return list.filter((group) => group.items.length > 0);
  }, [items, showsScreen, isZATCA, t]);

  const pendingCount = groups.find((group) => group.key === 'needs')?.items.length ?? 0;
  const acceptedCount =
    groups.find((group) => group.key === 'accepted')?.items.length ?? 0;
  const rejectedCount =
    groups.find((group) => group.key === 'rejected')?.items.length ?? 0;
  const totalProcessed = items.filter(
    (invoice) => !!invoice.zatca || !!invoice.efatura
  ).length;

  const acceptanceRate =
    totalProcessed === 0
      ? 0
      : Math.round((acceptedCount / totalProcessed) * 100);

  const batchSubmit = (): void => {
    const target = groups.find((group) => group.key === 'needs')?.items ?? [];
    target.forEach((invoice) => {
      if (isZATCA) submitZATCA.mutate(invoice.id);
      if (isEFatura) submitEFatura.mutate(invoice.id);
    });
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <Header
        title={isZATCA ? 'ZATCA Invoices' : isEFatura ? 'e-Fatura' : t('invoices.title')}
        onBack={() => navigation.goBack()}
      />
      {!showsScreen ? (
        <View style={styles.empty}>
          <Icon name="information-circle-outline" size={40} color={darkColors.primary} />
          <Text style={styles.emptyTitle}>
            {t('taxCompliance.taxInvoice')}
          </Text>
          <Text style={styles.emptyBody}>
            {t('taxCompliance.taxId')}
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.statsRow}>
            <StatCell
              label={t('taxCompliance.needsSubmission')}
              value={pendingCount}
              tone={darkColors.warning}
            />
            <StatCell label={t('zatca.accepted')} value={acceptedCount} tone={darkColors.success} />
            <StatCell label={t('zatca.rejected')} value={rejectedCount} tone={darkColors.error} />
            <StatCell
              label={t('taxCompliance.acceptanceRate')}
              value={`${acceptanceRate}%`}
              tone={darkColors.primary}
            />
          </View>

          {pendingCount > 0 ? (
            <Pressable
              onPress={batchSubmit}
              style={({ pressed }) => [
                styles.batchBtn,
                pressed ? { opacity: 0.85 } : null,
              ]}
            >
              <Icon name="cloud-upload-outline" size={20} color={darkColors.textOnPrimary} />
              <Text style={styles.batchText}>
                {`${t('taxCompliance.batchSubmit')} (${pendingCount})`}
              </Text>
            </Pressable>
          ) : null}

          {invoicesQuery.isLoading ? (
            <SkeletonCard height={120} />
          ) : (
            groups.map((group) => {
              return (
                <View key={group.key} style={styles.groupCard}>
                  <View style={styles.groupHeader}>
                    <StatusPill
                      tone={INVOICE_STATUS_TONE[group.key] ?? 'neutral'}
                      size="sm"
                    >
                      {group.label}
                    </StatusPill>
                    <Text style={styles.groupCount}>{group.items.length}</Text>
                  </View>

                  {group.items.map((invoice) => {
                    const submission = submissionFor(invoice);
                    return (
                      <Pressable
                        key={invoice.id}
                        onPress={() =>
                          navigation.navigate('InvoiceDetail', {
                            invoiceId: invoice.id,
                          })
                        }
                        style={({ pressed }) => [
                          styles.row,
                          pressed ? { opacity: 0.85 } : null,
                        ]}
                      >
                        <View style={styles.rowBody}>
                          <Text style={styles.rowTitle}>
                            {invoice.invoiceNumber}
                          </Text>
                          <Text style={styles.rowMeta} numberOfLines={1}>
                            {invoice.customerName}
                          </Text>
                        </View>
                        <View style={styles.rowMetaRight}>
                          <CurrencyDisplay
                            amount={invoice.total}
                            size="medium"
                          />
                          <Text style={styles.systemTag}>
                            {submission.system === 'zatca'
                              ? 'ZATCA'
                              : submission.system === 'efatura'
                                ? 'e-Fatura'
                                : ''}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const StatCell: React.FC<{
  label: string;
  value: number | string;
  tone: string;
}> = ({ label, value, tone }) => (
  <View style={styles.statCell}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={[styles.statValue, { color: tone }]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: darkColors.background },
  scroll: {
    padding: spacing.base,
    paddingBottom: spacing.xxl,
    rowGap: spacing.base,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statCell: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: darkColors.surface,
    padding: spacing.base,
    borderRadius: radius.lg,
    rowGap: 4,
    ...shadows.xs,
  },
  statLabel: {
    ...textStyles.caption,
    color: darkColors.textMuted,
  },
  statValue: {
    ...textStyles.h2,
    fontWeight: '800',
  },
  batchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: darkColors.primary,
    ...shadows.md,
  },
  batchText: {
    ...textStyles.button,
    color: darkColors.textOnPrimary,
  },
  groupCard: {
    backgroundColor: darkColors.surface,
    borderRadius: radius.lg,
    padding: spacing.base,
    rowGap: spacing.sm,
    ...shadows.xs,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  groupCount: {
    ...textStyles.h4,
    color: darkColors.textPrimary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: darkColors.divider,
    columnGap: spacing.sm,
  },
  rowBody: { flex: 1 },
  rowTitle: { ...textStyles.bodyMedium, color: darkColors.textPrimary },
  rowMeta: { ...textStyles.caption, color: darkColors.textMuted },
  rowMetaRight: { alignItems: 'flex-end' },
  systemTag: {
    ...textStyles.caption,
    color: darkColors.primary,
    fontWeight: '700',
    marginTop: 2,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    rowGap: spacing.sm,
  },
  emptyTitle: { ...textStyles.h4, color: darkColors.textPrimary },
  emptyBody: { ...textStyles.body, color: darkColors.textMuted, textAlign: 'center' },
});

export default TaxInvoicesScreen;
