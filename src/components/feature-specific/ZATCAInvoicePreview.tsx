/**
 * ZATCAInvoicePreview — bilingual (Arabic + English) Saudi tax-invoice
 * layout. Renders the ZATCA QR (base64 from backend) when present and
 * notes that the QR is generated server-side (TLV format).
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { CurrencyDisplay } from '../forms/CurrencyDisplay';
import { QRCodeDisplay } from './QRCodeDisplay';
import { colors } from '../../constants/colors';
import { radius, shadows, spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';
import type { Invoice } from '../../types/billing';

export interface ZATCAInvoicePreviewProps {
  invoice: Invoice;
  sellerNameEn?: string;
  sellerNameAr?: string;
  sellerVAT?: string;
  sellerCR?: string;
  sellerAddress?: string;
}

export const ZATCAInvoicePreview: React.FC<ZATCAInvoicePreviewProps> = ({
  invoice,
  sellerNameEn = 'Zyrix CRM Co.',
  sellerNameAr = 'شركة زيريكس CRM',
  sellerVAT = '300012345600003',
  sellerCR = '1010123456',
  sellerAddress = 'Riyadh, Kingdom of Saudi Arabia',
}) => {
  const submission = invoice.zatca;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.sellerBlock}>
          <Text style={styles.sellerArabic}>{sellerNameAr}</Text>
          <Text style={styles.sellerEnglish}>{sellerNameEn}</Text>
          <Text style={styles.sellerMeta}>{`الرقم الضريبي · VAT: ${sellerVAT}`}</Text>
          <Text style={styles.sellerMeta}>{`السجل التجاري · CR: ${sellerCR}`}</Text>
          <Text style={styles.sellerMeta}>{sellerAddress}</Text>
        </View>
        <View style={styles.titleBlock}>
          <Text style={styles.titleArabic}>فاتورة ضريبية</Text>
          <Text style={styles.titleEnglish}>Tax Invoice</Text>
          <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
        </View>
      </View>

      <View style={styles.partiesRow}>
        <View style={styles.partyBlock}>
          <Text style={styles.partyTitle}>المُشتري · Buyer</Text>
          <Text style={styles.partyName}>{invoice.customerName}</Text>
        </View>
        <View style={styles.partyBlock}>
          <Text style={styles.partyTitle}>تاريخ الإصدار · Issue date</Text>
          <Text style={styles.partyValue}>{invoice.issuedAt.slice(0, 10)}</Text>
          <Text style={styles.partyTitle}>تاريخ الاستحقاق · Due date</Text>
          <Text style={styles.partyValue}>{invoice.dueDate}</Text>
        </View>
      </View>

      <View style={styles.itemsCard}>
        <View style={styles.itemsHeader}>
          <Text style={[styles.itemHeaderText, styles.colDesc]}>
            الوصف · Description
          </Text>
          <Text style={[styles.itemHeaderText, styles.colQty]}>الكمية · Qty</Text>
          <Text style={[styles.itemHeaderText, styles.colTotal]}>
            الإجمالي · Total
          </Text>
        </View>
        {invoice.items.map((item, idx) => (
          <View key={`${item.description}-${idx}`} style={styles.itemRow}>
            <Text style={[styles.itemText, styles.colDesc]} numberOfLines={2}>
              {item.description}
            </Text>
            <Text style={[styles.itemText, styles.colQty]}>{item.quantity}</Text>
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
        <TotalsRow label="المجموع الفرعي · Subtotal" amount={invoice.subtotal} />
        {invoice.discount > 0 ? (
          <TotalsRow
            label="الخصم · Discount"
            amount={invoice.discount}
            negative
          />
        ) : null}
        <TotalsRow
          label="ضريبة القيمة المضافة · VAT (15%)"
          amount={invoice.tax}
        />
        <View style={styles.divider} />
        <View style={styles.grandRow}>
          <Text style={styles.grandLabel}>الإجمالي مع الضريبة · Grand Total</Text>
          <CurrencyDisplay
            amount={invoice.total}
            size="large"
            color={colors.primaryDark}
          />
        </View>
      </View>

      <View style={styles.qrWrap}>
        <QRCodeDisplay
          base64Data={submission?.qrCodeBase64}
          size={150}
          label="رمز الفاتورة الضريبية · ZATCA QR"
        />
        {submission?.uuid ? (
          <Text style={styles.uuidLine}>{`UUID: ${submission.uuid}`}</Text>
        ) : null}
      </View>

      <Text style={styles.footnote}>
        التوقيع الإلكتروني للفاتورة يتم على الخادم بصيغة TLV — ZATCA Phase 2.
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
  },
  sellerBlock: { flex: 2, rowGap: 2 },
  sellerArabic: {
    ...textStyles.h3,
    color: colors.textPrimary,
    textAlign: 'right',
  },
  sellerEnglish: {
    ...textStyles.body,
    color: colors.textSecondary,
  },
  sellerMeta: {
    ...textStyles.caption,
    color: colors.textMuted,
  },
  titleBlock: {
    flex: 1,
    alignItems: 'flex-end',
    rowGap: 2,
  },
  titleArabic: {
    ...textStyles.h2,
    color: colors.primary,
    fontWeight: '800',
  },
  titleEnglish: {
    ...textStyles.label,
    color: colors.primaryDark,
    letterSpacing: 2,
  },
  invoiceNumber: {
    ...textStyles.h4,
    color: colors.textPrimary,
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
  partyTitle: {
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
  colDesc: { flex: 3 },
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
    textAlign: 'right',
    fontStyle: 'italic',
  },
});

export default ZATCAInvoicePreview;
