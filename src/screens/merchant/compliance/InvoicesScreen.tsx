/**
 * InvoicesScreen — list of invoices with summary cards (outstanding,
 * issued/paid this month, overdue) and filter chips. Compliance badge
 * shown per invoice for SA (ZATCA) and TR (e-Fatura).
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
import { Icon, type AnyIconName } from '../../../components/common/Icon';
import { SkeletonCard } from '../../../components/common/SkeletonCard';
import { StatusPill } from '../../../components/ui/StatusPill';
import { INVOICE_STATUS_TONE } from '../../../lib/ui/status-tones';
import { darkColors } from '../../../theme/dark';
import { getPageAccent } from '../../../theme/dark/accents';

const PAGE_ACCENT = getPageAccent('taxInvoices');
import { hitSlop, radius, shadows, spacing } from '../../../constants/spacing';
import { textStyles } from '../../../constants/typography';
import { useCountryConfig } from '../../../hooks/useCountryConfig';
import { useInvoiceSummary, useInvoices } from '../../../hooks/useInvoices';
import type {
  ComplianceStatus,
  Invoice,
  InvoiceStatus,
} from '../../../types/billing';
import type { MerchantComplianceStackParamList } from '../../../navigation/types';

type StatusFilter = InvoiceStatus | 'all';

type Navigation = NativeStackNavigationProp<
  MerchantComplianceStackParamList,
  'Invoices'
>;

const COMPLIANCE_TONE: Record<
  ComplianceStatus,
  { background: string; color: string }
> = {
  pending: { background: darkColors.warningSoft, color: darkColors.warning },
  submitted: { background: darkColors.infoSoft, color: darkColors.info },
  accepted: { background: darkColors.successSoft, color: darkColors.success },
  rejected: { background: darkColors.errorSoft, color: darkColors.error },
};

export const InvoicesScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<Navigation>();
  const { config, formatDate } = useCountryConfig();

  const [status, setStatus] = useState<StatusFilter>('all');
  const summaryQuery = useInvoiceSummary(config.currency);
  const invoicesQuery = useInvoices({
    filters: status === 'all' ? undefined : { status },
    pageSize: 50,
  });

  const items = useMemo(
    () => invoicesQuery.data?.items ?? [],
    [invoicesQuery.data]
  );

  const summary = summaryQuery.data;

  const open = (invoice: Invoice): void => {
    navigation.navigate('InvoiceDetail', { invoiceId: invoice.id });
  };

  const onNew = (): void => {
    navigation.navigate('NewInvoice');
  };

  const renderComplianceBadge = (
    invoice: Invoice
  ): { label: string; tone: { background: string; color: string } } | null => {
    if (invoice.zatca) {
      return {
        label: `ZATCA · ${t(`zatca.${invoice.zatca.status}`)}`,
        tone: COMPLIANCE_TONE[invoice.zatca.status],
      };
    }
    if (invoice.efatura) {
      return {
        label: `e-Fatura · ${t(`zatca.${invoice.efatura.status}`)}`,
        tone: COMPLIANCE_TONE[invoice.efatura.status],
      };
    }
    return null;
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <Header
        title={t('invoices.title')}
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
        rightSlot={
          <Pressable
            onPress={() => navigation.navigate('TaxInvoices')}
            hitSlop={hitSlop.md}
            style={styles.headerBtn}
          >
            <Icon
              name="shield-checkmark-outline"
              size={22}
              color={darkColors.textOnPrimary}
            />
          </Pressable>
        }
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.summaryRow}
      >
        <SummaryCard
          label={t('invoices.outstandingAmount', { defaultValue: 'Outstanding' })}
          icon="alert-circle-outline"
          value={
            <CurrencyDisplay
              amount={summary?.outstanding ?? 0}
              size="medium"
              color={darkColors.error}
            />
          }
        />
        <SummaryCard
          label={t('invoices.thisMonthIssued', { defaultValue: 'Issued / mo' })}
          icon="document-text-outline"
          value={
            <Text style={styles.summaryValue}>
              {summary?.thisMonthIssued ?? 0}
            </Text>
          }
        />
        <SummaryCard
          label={t('invoices.thisMonthPaid', { defaultValue: 'Paid / mo' })}
          icon="checkmark-circle-outline"
          value={
            <Text style={styles.summaryValue}>
              {summary?.thisMonthPaid ?? 0}
            </Text>
          }
        />
        <SummaryCard
          label={t('invoices.overdueCount', { defaultValue: 'Overdue' })}
          icon="time-outline"
          value={
            <Text style={[styles.summaryValue, { color: darkColors.error }]}>
              {summary?.overdueCount ?? 0}
            </Text>
          }
        />
      </ScrollView>

      <View style={styles.filterRow}>
        {(
          ['all', 'draft', 'sent', 'paid', 'overdue', 'cancelled'] as StatusFilter[]
        ).map((key) => (
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
                status === key ? { color: darkColors.textOnPrimary } : null,
              ]}
            >
              {key === 'all' ? t('customers.title') : t(`invoices.${key}`)}
            </Text>
          </Pressable>
        ))}
      </View>

      {invoicesQuery.isLoading ? (
        <View style={styles.list}>
          {Array.from({ length: 4 }).map((_, idx) => (
            <SkeletonCard key={idx} height={106} />
          ))}
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(invoice) => invoice.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const compliance = renderComplianceBadge(item);
            return (
              <Pressable
                onPress={() => open(item)}
                style={({ pressed }) => [
                  styles.card,
                  pressed ? { opacity: 0.85 } : null,
                ]}
              >
                <View style={styles.headerRow}>
                  <Text style={styles.invoiceNumber}>{item.invoiceNumber}</Text>
                  <StatusPill
                    tone={INVOICE_STATUS_TONE[item.status] ?? 'neutral'}
                    size="sm"
                  >
                    {t(`invoices.${item.status}`)}
                  </StatusPill>
                </View>
                <Text style={styles.customer} numberOfLines={1}>
                  {item.customerName}
                </Text>
                <View style={styles.metaRow}>
                  <CurrencyDisplay amount={item.total} size="medium" />
                  <Text style={styles.date}>
                    {`${t('invoices.dueDate')}: ${formatDate(item.dueDate)}`}
                  </Text>
                </View>
                {compliance ? (
                  <View
                    style={[
                      styles.compliancePill,
                      { backgroundColor: compliance.tone.background },
                    ]}
                  >
                    <Icon
                      name="shield-checkmark-outline"
                      size={12}
                      color={compliance.tone.color}
                    />
                    <Text
                      style={[
                        styles.complianceText,
                        { color: compliance.tone.color },
                      ]}
                    >
                      {compliance.label}
                    </Text>
                  </View>
                ) : null}
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Icon
                name="document-text-outline"
                size={48}
                color={darkColors.primary}
              />
              <Text style={styles.emptyTitle}>{t('invoices.title')}</Text>
            </View>
          }
        />
      )}

      <Pressable
        onPress={onNew}
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

const SummaryCard: React.FC<{
  label: string;
  icon: AnyIconName;
  value: React.ReactNode;
}> = ({ label, icon, value }) => (
  <View style={styles.summaryCard}>
    <View style={styles.summaryHeader}>
      <Icon name={icon} size={16} color={darkColors.primary} />
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
    {value}
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
  summaryRow: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
    columnGap: spacing.sm,
  },
  summaryCard: {
    backgroundColor: darkColors.surface,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    borderRadius: radius.lg,
    rowGap: spacing.xs,
    minWidth: 150,
    ...shadows.xs,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.xs,
  },
  summaryLabel: {
    ...textStyles.caption,
    color: darkColors.textMuted,
  },
  summaryValue: {
    ...textStyles.h3,
    color: darkColors.textPrimary,
    fontWeight: '800',
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
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
  },
  list: {
    padding: spacing.base,
    paddingBottom: spacing.xxxl * 2,
    rowGap: spacing.sm,
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
  invoiceNumber: {
    ...textStyles.bodyMedium,
    color: darkColors.textPrimary,
    fontWeight: '700',
  },
  customer: {
    ...textStyles.caption,
    color: darkColors.textSecondary,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  date: {
    ...textStyles.caption,
    color: darkColors.textMuted,
  },
  compliancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  complianceText: {
    ...textStyles.caption,
    fontWeight: '700',
  },
  empty: {
    alignItems: 'center',
    paddingTop: spacing.xxxl,
    rowGap: spacing.sm,
  },
  emptyTitle: {
    ...textStyles.h4,
    color: darkColors.textPrimary,
  },
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

export default InvoicesScreen;
