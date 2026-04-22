/**
 * QuoteBuilder — multi-section scrollable form that produces a quote
 * draft ready to be saved or sent. Self-contained: parent screens pass
 * an initial quote + an onChange handler (or use the uncontrolled API
 * and read the state back through the imperative ref).
 *
 * Tax is auto-computed from `useCountryConfig` so merchants can't
 * accidentally undercharge in ZATCA/KDV/VAT jurisdictions.
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  I18nManager,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { CurrencyDisplay } from '../forms/CurrencyDisplay';
import { DatePicker } from '../forms/DatePicker';
import { ItemLineBuilder, computeLineTotal, type LineItem } from './ItemLineBuilder';
import { SearchableDropdown, type DropdownItem } from '../forms/SearchableDropdown';
import { colors } from '../../constants/colors';
import { radius, shadows, spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';
import { useCountryConfig } from '../../hooks/useCountryConfig';
import type { SupportedLanguage } from '../../i18n';
import { useUiStore } from '../../store/uiStore';

export interface QuoteDraft {
  customerId: string | null;
  customerName: string;
  quoteNumber: string;
  quoteDate: Date | null;
  expiryDate: Date | null;
  reference: string;
  items: LineItem[];
  globalDiscountPct: number;
  customerNotes: string;
  internalNotes: string;
  terms: string;
  termsTemplate: 'standard' | 'custom';
}

export interface QuoteTotals {
  subtotal: number;
  discount: number;
  tax: number;
  grandTotal: number;
}

export interface QuoteBuilderProps {
  value: QuoteDraft;
  onChange: (next: QuoteDraft) => void;
  customerOptions: readonly DropdownItem[];
  onRequestNewCustomer?: () => void;
  onTotalsChange?: (totals: QuoteTotals) => void;
}

export const calculateTotals = (
  items: readonly LineItem[],
  globalDiscountPct: number,
  taxRate: number
): QuoteTotals => {
  const subtotal = items.reduce((sum, item) => sum + computeLineTotal(item), 0);
  const discount = (subtotal * (globalDiscountPct || 0)) / 100;
  const taxableBase = Math.max(subtotal - discount, 0);
  const tax = (taxableBase * taxRate) / 100;
  const grandTotal = taxableBase + tax;
  return {
    subtotal,
    discount,
    tax,
    grandTotal,
  };
};

export const QuoteBuilder: React.FC<QuoteBuilderProps> = ({
  value,
  onChange,
  customerOptions,
  onRequestNewCustomer,
  onTotalsChange,
}) => {
  const { t } = useTranslation();
  const { config, isTaxRequired } = useCountryConfig();
  const language = useUiStore((s) => s.language) as SupportedLanguage;

  const taxRate = isTaxRequired() ? config.taxRate : 0;
  const totals = useMemo(
    () => calculateTotals(value.items, value.globalDiscountPct, taxRate),
    [value.items, value.globalDiscountPct, taxRate]
  );

  useEffect(() => {
    onTotalsChange?.(totals);
  }, [totals, onTotalsChange]);

  const [selectedCustomer, setSelectedCustomer] = useState<DropdownItem | null>(
    () => customerOptions.find((item) => item.id === value.customerId) ?? null
  );

  const patch = (partial: Partial<QuoteDraft>): void => {
    onChange({ ...value, ...partial });
  };

  const taxName = config.taxName[language] || config.taxName.en;

  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <Section title={t('quoteBuilder.customer')}>
        <SearchableDropdown
          items={customerOptions}
          value={selectedCustomer}
          onChange={(item) => {
            setSelectedCustomer(item);
            patch({ customerId: item.id, customerName: item.label });
          }}
          placeholder={t('customers.searchCustomers')}
        />
        {onRequestNewCustomer ? (
          <Text style={styles.link} onPress={onRequestNewCustomer}>
            {`+ ${t('customers.addFirstCustomer')}`}
          </Text>
        ) : null}
      </Section>

      <Section title={t('quoteBuilder.quoteDetails')}>
        <Text style={styles.fieldLabel}>{t('deals.title')}</Text>
        <TextInput
          value={value.quoteNumber}
          onChangeText={(next) => patch({ quoteNumber: next })}
          style={[
            styles.textInput,
            { textAlign: I18nManager.isRTL ? 'right' : 'left' },
          ]}
        />
        <Text style={styles.fieldLabel}>{t('forms.fullName')}</Text>
        <TextInput
          value={value.reference}
          onChangeText={(next) => patch({ reference: next })}
          placeholder={t('forms.fullNamePlaceholder')}
          placeholderTextColor={colors.textMuted}
          style={[
            styles.textInput,
            { textAlign: I18nManager.isRTL ? 'right' : 'left' },
          ]}
        />
        <DatePicker
          label={t('deals.expectedClose')}
          value={value.quoteDate}
          onChange={(d) => patch({ quoteDate: d })}
        />
        <DatePicker
          label={t('quoteBuilder.terms')}
          value={value.expiryDate}
          onChange={(d) => patch({ expiryDate: d })}
          minDate={value.quoteDate ?? undefined}
        />
      </Section>

      <Section title={t('quoteBuilder.items')}>
        <ItemLineBuilder
          items={value.items}
          onChange={(items) => patch({ items })}
        />
      </Section>

      <Section title={t('quoteBuilder.discountAndTax')}>
        <Text style={styles.fieldLabel}>{t('forms.discount')} %</Text>
        <TextInput
          value={String(value.globalDiscountPct)}
          onChangeText={(next) => {
            const cleaned = next.replace(/[^0-9.]/g, '');
            const pct = Math.min(Math.max(parseFloat(cleaned || '0'), 0), 100);
            patch({
              globalDiscountPct: Number.isFinite(pct) ? pct : 0,
            });
          }}
          keyboardType="decimal-pad"
          style={[
            styles.textInput,
            { textAlign: I18nManager.isRTL ? 'right' : 'left' },
          ]}
        />
        <View style={styles.taxBadge}>
          <Text style={styles.taxText}>
            {isTaxRequired()
              ? `${taxName} (${config.taxRate}%)`
              : t('forms.required')}
          </Text>
        </View>
      </Section>

      <Section title={t('quoteBuilder.totals')}>
        <TotalsRow label={t('currency.subtotal')} amount={totals.subtotal} />
        <TotalsRow
          label={t('currency.discount')}
          amount={totals.discount}
          negative
        />
        <TotalsRow
          label={`${t('currency.tax')} (${taxName || t('currency.tax')})`}
          amount={totals.tax}
        />
        <View style={styles.divider} />
        <View style={styles.grandTotalRow}>
          <Text style={styles.grandTotalLabel}>
            {t('currency.grandTotal')}
          </Text>
          <CurrencyDisplay
            amount={totals.grandTotal}
            size="large"
            color={colors.primaryDark}
          />
        </View>
      </Section>

      <Section title={t('quoteBuilder.notes')}>
        <Text style={styles.fieldLabel}>
          {t('quoteBuilder.customerNotes')}
        </Text>
        <TextInput
          value={value.customerNotes}
          onChangeText={(next) => patch({ customerNotes: next })}
          placeholder={t('quoteBuilder.customerNotes')}
          placeholderTextColor={colors.textMuted}
          multiline
          style={[
            styles.textArea,
            { textAlign: I18nManager.isRTL ? 'right' : 'left' },
          ]}
        />
        <Text style={styles.fieldLabel}>
          {t('quoteBuilder.internalNotes')}
        </Text>
        <TextInput
          value={value.internalNotes}
          onChangeText={(next) => patch({ internalNotes: next })}
          placeholder={t('quoteBuilder.internalNotes')}
          placeholderTextColor={colors.textMuted}
          multiline
          style={[
            styles.textArea,
            { textAlign: I18nManager.isRTL ? 'right' : 'left' },
          ]}
        />
      </Section>

      <Section title={t('quoteBuilder.terms')}>
        <View style={styles.templateRow}>
          {(['standard', 'custom'] as const).map((key) => (
            <Text
              key={key}
              onPress={() => patch({ termsTemplate: key })}
              style={[
                styles.templateChip,
                value.termsTemplate === key ? styles.templateChipActive : null,
              ]}
            >
              {t(`quoteBuilder.${key === 'standard' ? 'useTemplate' : 'saveAsTemplate'}`)}
            </Text>
          ))}
        </View>
        <TextInput
          value={value.terms}
          onChangeText={(next) => patch({ terms: next })}
          multiline
          placeholder={t('quoteBuilder.terms')}
          placeholderTextColor={colors.textMuted}
          style={[
            styles.textArea,
            { textAlign: I18nManager.isRTL ? 'right' : 'left' },
          ]}
        />
      </Section>
    </ScrollView>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.sectionBody}>{children}</View>
  </View>
);

const TotalsRow: React.FC<{
  label: string;
  amount: number;
  negative?: boolean;
}> = ({ label, amount, negative }) => (
  <View style={styles.totalsRow}>
    <Text style={styles.totalsLabel}>{label}</Text>
    <CurrencyDisplay
      amount={amount}
      size="medium"
      color={negative ? colors.error : colors.textPrimary}
    />
  </View>
);

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: spacing.xxxl,
    rowGap: spacing.base,
  },
  section: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.base,
    marginBottom: spacing.sm,
    borderRadius: radius.lg,
    padding: spacing.base,
    ...shadows.xs,
  },
  sectionTitle: {
    ...textStyles.h4,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  sectionBody: {
    rowGap: spacing.sm,
  },
  fieldLabel: {
    ...textStyles.label,
    color: colors.textSecondary,
  },
  textInput: {
    ...textStyles.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.base,
    padding: spacing.sm,
    minHeight: 44,
    backgroundColor: colors.surface,
  },
  textArea: {
    ...textStyles.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.base,
    padding: spacing.sm,
    minHeight: 80,
    textAlignVertical: 'top',
    backgroundColor: colors.surface,
  },
  link: {
    ...textStyles.label,
    color: colors.primary,
    fontWeight: '700',
  },
  taxBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.warningSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  taxText: {
    ...textStyles.label,
    color: colors.warning,
    fontWeight: '700',
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  totalsLabel: {
    ...textStyles.body,
    color: colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.xs,
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  grandTotalLabel: {
    ...textStyles.h3,
    color: colors.textPrimary,
  },
  templateRow: {
    flexDirection: 'row',
    columnGap: spacing.sm,
    marginBottom: spacing.sm,
  },
  templateChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.textSecondary,
    ...textStyles.caption,
    fontWeight: '600',
  },
  templateChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    color: colors.textInverse,
  },
});

export default QuoteBuilder;
