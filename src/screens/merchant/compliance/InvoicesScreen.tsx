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
import { colors } from '../../../constants/colors';
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

const STATUS_TONE: Record<InvoiceStatus, { background: string; color: string }> = {
  draft: { background: colors.surfaceAlt, color: colors.textMuted },
  issued: { background: colors.infoSoft, color: colors.info },
  sent: { background: colors.infoSoft, color: colors.info },
  viewed: { background: colors.warningSoft, color: colors.warning },
  paid: { background: colors.successSoft, color: colors.success },
  overdue: { background: colors.errorSoft, color: colors.error },
  cancelled: { background: colors.surfaceAlt, color: colors.textMuted },
};

const COMPLIANCE_TONE: Record<
  ComplianceStatus,
  { background: string; color: string }
> = {
  pending: { background: colors.warningSoft, color: colors.warning },
  submitted: { background: colors.infoSoft, color: colors.info },
  accepted: { background: colors.successSoft, color: colors.success },
  rejected: { background: colors.errorSoft, color: colors.error },
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
            <Icon name="menu-outline" size={24} color={colors.textInverse} />
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
              color={colors.textInverse}
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
              color={colors.error}
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
            <Text style={[styles.summaryValue, { color: colors.error }]}>
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
                status === key ? { color: colors.textInverse } : null,
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
            const tone = STATUS_TONE[item.status];
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
                  <View
                    style={[styles.statusPill, { backgroundColor: tone.background }]}
                  >
                    <Text style={[styles.statusText, { color: tone.color }]}>
                      {t(`invoices.${item.status}`)}
                    </Text>
                  </View>
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
                color={colors.primary}
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
        <Icon name="add" size={26} color={colors.textInverse} />
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
      <Icon name={icon} size={16} color={colors.primary} />
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
    {value}
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
    color: colors.textMuted,
  },
  summaryValue: {
    ...textStyles.h3,
    color: colors.textPrimary,
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
  list: {
    padding: spacing.base,
    paddingBottom: spacing.xxxl * 2,
    rowGap: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
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
    color: colors.textPrimary,
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
  },
  customer: {
    ...textStyles.caption,
    color: colors.textSecondary,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  date: {
    ...textStyles.caption,
    color: colors.textMuted,
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

export default InvoicesScreen;
