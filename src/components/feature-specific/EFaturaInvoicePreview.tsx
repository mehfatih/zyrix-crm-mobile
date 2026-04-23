/**
 * EFaturaInvoicePreview — Turkey-compliant invoice layout with all
 * labels in Turkish, regardless of the merchant's UI language.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { CurrencyDisplay } from '../forms/CurrencyDisplay';
import { QRCodeDisplay } from './QRCodeDisplay';
import { colors } from '../../constants/colors';
import { formatTurkishTaxNumber } from '../../utils/efaturaHelpers';
import { radius, shadows, spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';
import type { Invoice } from '../../types/billing';

export interface EFaturaInvoicePreviewProps {
  invoice: Invoice;
  sellerName?: string;
  sellerVKN?: string;
  sellerMersis?: string;
  sellerSicil?: string;
  sellerAddress?: string;
}

export const EFaturaInvoicePreview: React.FC<EFaturaInvoicePreviewProps> = ({
  invoice,
  sellerName = 'Zyrix CRM A.Ş.',
  sellerVKN = '1234567890',
  sellerMersis = '0011223344556677',
  sellerSicil = '888777',
  sellerAddress = 'Maslak, İstanbul',
}) => {
  const submission = invoice.efatura;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.sellerBlock}>
          <Text style={styles.sellerName}>{sellerName}</Text>
          <Text style={styles.sellerMeta}>{`VKN: ${formatTurkishTaxNumber(sellerVKN)}`}</Text>
          <Text style={styles.sellerMeta}>{`MERSIS: ${sellerMersis}`}</Text>
          <Text style={styles.sellerMeta}>{`Ticaret Sicil No: ${sellerSicil}`}</Text>
          <Text style={styles.sellerMeta}>{sellerAddress}</Text>
        </View>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>FATURA</Text>
          <Text style={styles.invoiceNumber}>
            {`Fatura No: ${invoice.invoiceNumber}`}
          </Text>
          {submission?.uuid ? (
            <Text style={styles.uuid}>{`UUID: ${submission.uuid}`}</Text>
          ) : null}
        </View>
      </View>

      <View style={styles.partiesRow}>
        <View style={styles.partyBlock}>
          <Text style={styles.partyLabel}>Alıcı</Text>
          <Text style={styles.partyName}>{invoice.customerName}</Text>
        </View>
        <View style={styles.partyBlock}>
          <Text style={styles.partyLabel}>Fatura Tarihi</Text>
          <Text style={styles.partyValue}>
            {invoice.issuedAt.slice(0, 10).split('-').reverse().join('.')}
          </Text>
          <Text style={styles.partyLabel}>Vade Tarihi</Text>
          <Text style={styles.partyValue}>
            {invoice.dueDate.split('-').reverse().join('.')}
          </Text>
        </View>
      </View>

      <View style={styles.itemsCard}>
        <View style={styles.itemsHeader}>
          <Text style={[styles.itemHeaderText, styles.colSira]}>Sıra</Text>
          <Text style={[styles.itemHeaderText, styles.colDesc]}>Açıklama</Text>
          <Text style={[styles.itemHeaderText, styles.colQty]}>Miktar</Text>
          <Text style={[styles.itemHeaderText, styles.colKDV]}>KDV %</Text>
          <Text style={[styles.itemHeaderText, styles.colTotal]}>Toplam</Text>
        </View>
        {invoice.items.map((item, idx) => (
          <View key={`${item.description}-${idx}`} style={styles.itemRow}>
            <Text style={[styles.itemText, styles.colSira]}>{idx + 1}</Text>
            <Text style={[styles.itemText, styles.colDesc]} numberOfLines={2}>
              {item.description}
            </Text>
            <Text style={[styles.itemText, styles.colQty]}>{item.quantity}</Text>
            <Text style={[styles.itemText, styles.colKDV]}>{`${item.taxRate}%`}</Text>
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
        <TotalsRow label="Ara Toplam" amount={invoice.subtotal} />
        {invoice.discount > 0 ? (
          <TotalsRow label="İndirim" amount={invoice.discount} negative />
        ) : null}
        <TotalsRow
          label={`KDV Matrahı`}
          amount={invoice.subtotal - invoice.discount}
        />
        <TotalsRow label={`KDV (20%)`} amount={invoice.tax} />
        <View style={styles.divider} />
        <View style={styles.grandRow}>
          <Text style={styles.grandLabel}>Genel Toplam</Text>
          <CurrencyDisplay
            amount={invoice.total}
            size="large"
            color={colors.primaryDark}
          />
        </View>
      </View>

      <View style={styles.qrWrap}>
        <QRCodeDisplay base64Data={undefined} size={140} label="e-Fatura Barkodu" />
        {submission?.uuid ? (
          <Text style={styles.uuidLine}>{`UUID: ${submission.uuid}`}</Text>
        ) : null}
      </View>

      <Text style={styles.footnote}>
        e-Fatura UBL 2.1 imzalama işlemi sunucu tarafında GIB'e iletilir.
      </Text>
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
    columnGap: spacing.base,
  },
  sellerBlock: { flex: 2, rowGap: 2 },
  sellerName: {
    ...textStyles.h3,
    color: colors.textPrimary,
  },
  sellerMeta: {
    ...textStyles.caption,
    color: colors.textMuted,
  },
  titleBlock: {
    alignItems: 'flex-end',
    rowGap: 2,
  },
  title: {
    ...textStyles.display,
    color: colors.primary,
    fontWeight: '800',
  },
  invoiceNumber: {
    ...textStyles.label,
    color: colors.textSecondary,
  },
  uuid: {
    ...textStyles.caption,
    color: colors.textMuted,
  },
  partiesRow: {
    flexDirection: 'row',
    columnGap: spacing.base,
  },
  partyBlock: {
    flex: 1,
    backgroundColor: colors.primarySoft,
    padding: spacing.sm,
    borderRadius: radius.base,
    rowGap: 2,
  },
  partyLabel: {
    ...textStyles.caption,
    color: colors.primaryDark,
    fontWeight: '700',
  },
  partyName: {
    ...textStyles.bodyMedium,
    color: colors.textPrimary,
  },
  partyValue: {
    ...textStyles.body,
    color: colors.textPrimary,
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
  itemHeaderText: {
    ...textStyles.caption,
    color: colors.textMuted,
    fontWeight: '700',
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
  colSira: { flex: 0.6, textAlign: 'center' },
  colDesc: { flex: 3 },
  colQty: { flex: 0.8, textAlign: 'center' },
  colKDV: { flex: 0.8, textAlign: 'center' },
  colTotal: { flex: 1.5, alignItems: 'flex-end' },
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
  qrWrap: {
    alignItems: 'center',
    rowGap: spacing.xs,
  },
  uuidLine: {
    ...textStyles.caption,
    color: colors.textMuted,
  },
  footnote: {
    ...textStyles.caption,
    color: colors.textMuted,
    textAlign: 'left',
    fontStyle: 'italic',
  },
});

export default EFaturaInvoicePreview;
