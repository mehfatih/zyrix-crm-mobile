/**
 * NewInvoiceScreen — invoice creation. Reuses `ItemLineBuilder` for
 * the items section and pulls the country tax rate via `useCountryConfig`
 * so totals match the per-country rules. Backend auto-generates ZATCA /
 * e-Fatura artifacts on submit.
 */

import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';

import { Button } from '../../../components/common/Button';
import { CurrencyDisplay } from '../../../components/forms/CurrencyDisplay';
import { DatePicker } from '../../../components/forms/DatePicker';
import { Header } from '../../../components/common/Header';
import { ItemLineBuilder, type LineItem } from '../../../components/feature-specific/ItemLineBuilder';
import { SearchableDropdown, type DropdownItem } from '../../../components/forms/SearchableDropdown';
import { calculateInvoiceTotals } from '../../../utils/invoiceCalculator';
import { colors } from '../../../constants/colors';
import { listCustomers } from '../../../api/customers';
import { radius, shadows, spacing } from '../../../constants/spacing';
import { textStyles } from '../../../constants/typography';
import { useCountryConfig } from '../../../hooks/useCountryConfig';
import { useCreateInvoice } from '../../../hooks/useInvoices';
import { useToast } from '../../../hooks/useToast';
import type { CountryCode } from '../../../types/country';

const todayPlus = (days: number): Date => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d;
};

export const NewInvoiceScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const toast = useToast();
  const { config, isTaxRequired } = useCountryConfig();
  const createMut = useCreateInvoice();

  const customersQuery = useQuery({
    queryKey: ['customers', 'picker'],
    queryFn: () => listCustomers({ pageSize: 100 }),
  });

  const customerOptions = useMemo<DropdownItem[]>(
    () =>
      (customersQuery.data?.items ?? []).map((customer) => ({
        id: customer.id,
        label: customer.name,
        subtitle: customer.email,
      })),
    [customersQuery.data]
  );

  const [customer, setCustomer] = useState<DropdownItem | null>(null);
  const [items, setItems] = useState<LineItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [dueDate, setDueDate] = useState<Date | null>(todayPlus(30));

  const taxRate = isTaxRequired() ? config.taxRate : 0;
  const totals = useMemo(
    () =>
      calculateInvoiceTotals(
        items.map((item) => ({
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountPct: item.discountPct,
          taxRate,
        })),
        discount,
        taxRate,
        config.code
      ),
    [items, discount, taxRate, config.code]
  );

  const canSave =
    !!customer && items.length > 0 && totals.grandTotal > 0 && !!dueDate;

  const submit = async (sendImmediately: boolean): Promise<void> => {
    if (!customer || !dueDate) return;
    try {
      await createMut.mutateAsync({
        customerId: customer.id,
        customerName: customer.label,
        customerCountry: config.code as CountryCode,
        currency: config.currency,
        items: items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountPct: item.discountPct,
          taxRate,
        })),
        discount: totals.discount,
        dueDate: dueDate.toISOString().slice(0, 10),
      });
      toast.success(
        sendImmediately ? t('common.success') : t('invoices.draft')
      );
      navigation.goBack();
    } catch (err) {
      console.warn('[newInvoice] failed', err);
    }
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <Header
        title={t('invoices.newInvoice')}
        onBack={() => navigation.goBack()}
      />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <SearchableDropdown
            items={customerOptions}
            value={customer}
            onChange={setCustomer}
            label={t('quoteBuilder.customer')}
          />
          <DatePicker
            label={t('invoices.dueDate')}
            value={dueDate}
            onChange={setDueDate}
            minDate={new Date()}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('quoteBuilder.items')}</Text>
          <ItemLineBuilder items={items} onChange={setItems} />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('quoteBuilder.totals')}</Text>
          <Row label={t('currency.subtotal')} amount={totals.subtotal} />
          {totals.discount > 0 ? (
            <Row label={t('currency.discount')} amount={totals.discount} negative />
          ) : null}
          {taxRate > 0 ? (
            <Row
              label={`${t('currency.tax')} (${taxRate}%)`}
              amount={totals.tax}
            />
          ) : null}
          <View style={styles.divider} />
          <View style={styles.grandRow}>
            <Text style={styles.grandLabel}>{t('currency.grandTotal')}</Text>
            <CurrencyDisplay
              amount={totals.grandTotal}
              size="large"
              color={colors.primaryDark}
            />
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label={t('quoteBuilder.saveDraft')}
          variant="outline"
          onPress={() => void submit(false)}
          disabled={!canSave}
        />
        <Button
          label={t('quoteBuilder.sendNow')}
          onPress={() => void submit(true)}
          disabled={!canSave}
          loading={createMut.isPending}
        />
      </View>
    </SafeAreaView>
  );
};

const Row: React.FC<{ label: string; amount: number; negative?: boolean }> = ({
  label,
  amount,
  negative,
}) => (
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
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: {
    padding: spacing.base,
    rowGap: spacing.base,
    paddingBottom: spacing.xxxl,
  },
  card: {
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
  grandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  grandLabel: {
    ...textStyles.h3,
    color: colors.textPrimary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    columnGap: spacing.sm,
    padding: spacing.base,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    backgroundColor: colors.surface,
  },
});

export default NewInvoiceScreen;
