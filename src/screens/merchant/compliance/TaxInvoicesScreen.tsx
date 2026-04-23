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
import { colors } from '../../../constants/colors';
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

const STATUS_TONE: Record<
  ComplianceStatus | 'needs',
  { background: string; color: string }
> = {
  needs: { background: colors.errorSoft, color: colors.error },
  pending: { background: colors.warningSoft, color: colors.warning },
  submitted: { background: colors.infoSoft, color: colors.info },
  accepted: { background: colors.successSoft, color: colors.success },
  rejected: { background: colors.errorSoft, color: colors.error },
};

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
          <Icon name="information-circle-outline" size={40} color={colors.primary} />
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
              tone={colors.warning}
            />
            <StatCell label={t('zatca.accepted')} value={acceptedCount} tone={colors.success} />
            <StatCell label={t('zatca.rejected')} value={rejectedCount} tone={colors.error} />
            <StatCell
              label={t('taxCompliance.acceptanceRate')}
              value={`${acceptanceRate}%`}
              tone={colors.primary}
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
              <Icon name="cloud-upload-outline" size={20} color={colors.textInverse} />
              <Text style={styles.batchText}>
                {`${t('taxCompliance.batchSubmit')} (${pendingCount})`}
              </Text>
            </Pressable>
          ) : null}

          {invoicesQuery.isLoading ? (
            <SkeletonCard height={120} />
          ) : (
            groups.map((group) => {
              const tone = STATUS_TONE[group.key];
              return (
                <View key={group.key} style={styles.groupCard}>
                  <View style={styles.groupHeader}>
                    <View
                      style={[
                        styles.groupBadge,
                        { backgroundColor: tone.background },
                      ]}
                    >
                      <Text
                        style={[styles.groupBadgeText, { color: tone.color }]}
                      >
                        {group.label}
                      </Text>
                    </View>
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
  safe: { flex: 1, backgroundColor: colors.background },
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
    backgroundColor: colors.surface,
    padding: spacing.base,
    borderRadius: radius.lg,
    rowGap: 4,
    ...shadows.xs,
  },
  statLabel: {
    ...textStyles.caption,
    color: colors.textMuted,
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
    backgroundColor: colors.primary,
    ...shadows.md,
  },
  batchText: {
    ...textStyles.button,
    color: colors.textInverse,
  },
  groupCard: {
    backgroundColor: colors.surface,
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
  groupBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  groupBadgeText: {
    ...textStyles.caption,
    fontWeight: '700',
  },
  groupCount: {
    ...textStyles.h4,
    color: colors.textPrimary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    columnGap: spacing.sm,
  },
  rowBody: { flex: 1 },
  rowTitle: { ...textStyles.bodyMedium, color: colors.textPrimary },
  rowMeta: { ...textStyles.caption, color: colors.textMuted },
  rowMetaRight: { alignItems: 'flex-end' },
  systemTag: {
    ...textStyles.caption,
    color: colors.primary,
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
  emptyTitle: { ...textStyles.h4, color: colors.textPrimary },
  emptyBody: { ...textStyles.body, color: colors.textMuted, textAlign: 'center' },
});

export default TaxInvoicesScreen;
