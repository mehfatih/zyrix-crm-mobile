/**
 * GenericInvoicePreview — clean modern layout used for countries that
 * don't have a dedicated tax-compliance scheme yet (UAE, Kuwait, Qatar,
 * Egypt, Bahrain, Oman, Jordan). Pulls localized labels from
 * `useCountryConfig` so the same component handles VAT / GST / "no tax".
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { CurrencyDisplay } from '../forms/CurrencyDisplay';
import { colors } from '../../constants/colors';
import { findCountry } from '../../constants/countries';
import { radius, shadows, spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';
import type { SupportedLanguage } from '../../i18n';
import { useUiStore } from '../../store/uiStore';
import type { Invoice } from '../../types/billing';

export interface GenericInvoicePreviewProps {
  invoice: Invoice;
  sellerName?: string;
  sellerTaxId?: string;
  sellerAddress?: string;
}

export const GenericInvoicePreview: React.FC<GenericInvoicePreviewProps> = ({
  invoice,
  sellerName,
  sellerTaxId,
  sellerAddress,
}) => {
  const { t } = useTranslation();
  const language = useUiStore((s) => s.language) as SupportedLanguage;
  const country = findCountry(invoice.customerCountry);

  const taxName = country.taxName[language] || country.taxName.en;
  const taxIdLabel = country.taxIdLabel?.[language] ?? country.taxIdLabel?.en ?? 'Tax ID';
  const showTax = country.taxSystem !== 'none' && invoice.tax > 0;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.companyBlock}>
          <Text style={styles.companyName}>{sellerName ?? 'Zyrix CRM Co.'}</Text>
          {sellerAddress ? (
            <Text style={styles.companyMeta}>{sellerAddress}</Text>
          ) : null}
          {sellerTaxId ? (
            <Text style={styles.companyMeta}>
              {`${taxIdLabel}: ${sellerTaxId}`}
            </Text>
          ) : null}
        </View>
        <View style={styles.invoiceMeta}>
          <Text style={styles.invoiceTitle}>{t('invoices.title').toUpperCase()}</Text>
          <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
        </View>
      </View>

      <View style={styles.partiesRow}>
        <View style={styles.party}>
          <Text style={styles.partyLabel}>{t('invoices.title')} →</Text>
          <Text style={styles.partyName}>{invoice.customerName}</Text>
          <Text style={styles.partyMeta}>
            {`${country.flag} ${country.name[language]}`}
          </Text>
        </View>
        <View style={styles.party}>
          <Text style={styles.partyLabel}>{t('invoices.dueDate')}</Text>
          <Text style={styles.partyName}>{invoice.dueDate}</Text>
        </View>
      </View>

      <View style={styles.itemsCard}>
        <View style={styles.itemsHeader}>
          <Text style={[styles.itemsHeaderText, styles.colDescription]}>
            {t('quoteBuilder.items')}
          </Text>
          <Text style={[styles.itemsHeaderText, styles.colQty]}>
            {t('forms.quantity')}
          </Text>
          <Text style={[styles.itemsHeaderText, styles.colTotal]}>
            {t('forms.lineTotal')}
          </Text>
        </View>
        {invoice.items.map((item, idx) => (
          <View key={`${item.description}-${idx}`} style={styles.itemRow}>
            <Text style={[styles.itemText, styles.colDescription]} numberOfLines={2}>
              {item.description}
            </Text>
            <Text style={[styles.itemText, styles.colQty]}>
              {item.quantity}
            </Text>
            <View style={styles.colTotal}>
              <CurrencyDisplay
                amount={item.quantity * item.unitPrice}
                size="small"
              />
            </View>
          </View>
        ))}
      </View>

      <View style={styles.totalsCard}>
        <TotalsRow label={t('currency.subtotal')} amount={invoice.subtotal} />
        {invoice.discount > 0 ? (
          <TotalsRow
            label={t('currency.discount')}
            amount={invoice.discount}
            negative
          />
        ) : null}
        {showTax ? (
          <TotalsRow
            label={`${taxName} (${country.taxRate}%)`}
            amount={invoice.tax}
          />
        ) : null}
        <View style={styles.divider} />
        <View style={styles.grandRow}>
          <Text style={styles.grandLabel}>{t('currency.grandTotal')}</Text>
          <CurrencyDisplay
            amount={invoice.total}
            size="large"
            color={colors.primaryDark}
          />
        </View>
      </View>
    </View>
  );
};

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
  card: {
    backgroundColor: colors.surface,
    padding: spacing.base,
    borderRadius: radius.lg,
    rowGap: spacing.base,
    ...shadows.xs,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  companyBlock: { flex: 1, rowGap: 2 },
  companyName: {
    ...textStyles.h3,
    color: colors.textPrimary,
  },
  companyMeta: {
    ...textStyles.caption,
    color: colors.textMuted,
  },
  invoiceMeta: { alignItems: 'flex-end', rowGap: 2 },
  invoiceTitle: {
    ...textStyles.label,
    color: colors.primary,
    letterSpacing: 2,
    fontWeight: '800',
  },
  invoiceNumber: {
    ...textStyles.h4,
    color: colors.textPrimary,
  },
  partiesRow: {
    flexDirection: 'row',
    columnGap: spacing.base,
  },
  party: {
    flex: 1,
    backgroundColor: colors.primarySoft,
    padding: spacing.sm,
    borderRadius: radius.base,
    rowGap: 2,
  },
  partyLabel: {
    ...textStyles.caption,
    color: colors.primaryDark,
  },
  partyName: {
    ...textStyles.bodyMedium,
    color: colors.textPrimary,
  },
  partyMeta: {
    ...textStyles.caption,
    color: colors.textMuted,
  },
  itemsCard: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.base,
    padding: spacing.sm,
    rowGap: spacing.xs,
  },
  itemsHeader: {
    flexDirection: 'row',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemsHeaderText: {
    ...textStyles.caption,
    color: colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  itemText: {
    ...textStyles.body,
    color: colors.textPrimary,
  },
  colDescription: { flex: 3 },
  colQty: { flex: 1, textAlign: 'center' },
  colTotal: { flex: 2, alignItems: 'flex-end' },
  totalsCard: {
    rowGap: spacing.xs,
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  grandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  grandLabel: {
    ...textStyles.h3,
    color: colors.textPrimary,
  },
});

export default GenericInvoicePreview;
