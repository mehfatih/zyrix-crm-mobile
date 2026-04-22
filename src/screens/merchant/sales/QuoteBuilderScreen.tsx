/**
 * QuoteBuilderScreen — hosts the `QuoteBuilder` form and the
 * "Save Draft" / "Send" bottom bar. Warns on back-navigation when
 * the draft has unsaved changes.
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';

import { Button } from '../../../components/common/Button';
import { Header } from '../../../components/common/Header';
import {
  QuoteBuilder,
  calculateTotals,
  type QuoteDraft,
} from '../../../components/feature-specific/QuoteBuilder';
import { colors } from '../../../constants/colors';
import { listCustomers } from '../../../api/customers';
import { radius, shadows, spacing } from '../../../constants/spacing';
import { textStyles } from '../../../constants/typography';
import { useCountryConfig } from '../../../hooks/useCountryConfig';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '../../../hooks/useToast';
import type { MerchantSalesStackParamList } from '../../../navigation/types';

type Route = RouteProp<MerchantSalesStackParamList, 'QuoteBuilder'>;

const today = (): Date => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const buildInitialDraft = (): QuoteDraft => ({
  customerId: null,
  customerName: '',
  quoteNumber: `Q-${Date.now().toString().slice(-6)}`,
  quoteDate: today(),
  expiryDate: (() => {
    const d = today();
    d.setDate(d.getDate() + 30);
    return d;
  })(),
  reference: '',
  items: [],
  globalDiscountPct: 0,
  customerNotes: '',
  internalNotes: '',
  terms: '',
  termsTemplate: 'standard',
});

export const QuoteBuilderScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute<Route>();
  const toast = useToast();
  const { config, isTaxRequired } = useCountryConfig();

  const customersQuery = useQuery({
    queryKey: ['customers', 'picker'],
    queryFn: () => listCustomers({ pageSize: 100 }),
  });

  const customerOptions = useMemo(
    () =>
      (customersQuery.data?.items ?? []).map((c) => ({
        id: c.id,
        label: c.name,
        subtitle: c.email,
      })),
    [customersQuery.data]
  );

  const [draft, setDraft] = useState<QuoteDraft>(buildInitialDraft);
  const [dirty, setDirty] = useState(false);

  const onChange = useCallback((next: QuoteDraft) => {
    setDraft(next);
    setDirty(true);
  }, []);

  const totals = useMemo(
    () => calculateTotals(draft.items, draft.globalDiscountPct, isTaxRequired() ? config.taxRate : 0),
    [draft, isTaxRequired, config.taxRate]
  );

  const onBack = (): void => {
    if (dirty) {
      Alert.alert(t('quoteBuilder.unsavedChanges'), t('quoteBuilder.confirmDiscard'), [
        { text: t('common.cancel') },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => navigation.goBack(),
        },
      ]);
      return;
    }
    navigation.goBack();
  };

  const saveDraft = (): void => {
    toast.success(t('quoteBuilder.saveDraft'));
    setDirty(false);
  };

  const sendNow = (): void => {
    if (!draft.customerId) {
      Alert.alert(t('quoteBuilder.customer'), t('forms.required'));
      return;
    }
    if (draft.items.length === 0) {
      Alert.alert(t('forms.noItemsYet'));
      return;
    }
    toast.success(t('common.success'));
    setDirty(false);
    navigation.goBack();
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <Header
        title={route.params?.quoteId ? t('common.edit') : t('navigation.quotes')}
        onBack={onBack}
      />

      <QuoteBuilder
        value={draft}
        onChange={onChange}
        customerOptions={customerOptions}
      />

      <View style={styles.footer}>
        <View style={styles.totalPreview}>
          <Text style={styles.totalLabel}>{t('currency.grandTotal')}</Text>
          <Text style={styles.totalValue}>
            {totals.grandTotal.toLocaleString('en-US')}
          </Text>
        </View>
        <View style={styles.actions}>
          <Button
            label={t('quoteBuilder.saveDraft')}
            variant="outline"
            onPress={saveDraft}
          />
          <Button label={t('quoteBuilder.sendNow')} onPress={sendNow} />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  footer: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    padding: spacing.base,
    rowGap: spacing.sm,
    ...shadows.md,
  },
  totalPreview: {
    backgroundColor: colors.primarySoft,
    padding: spacing.sm,
    borderRadius: radius.base,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    ...textStyles.label,
    color: colors.primaryDark,
  },
  totalValue: {
    ...textStyles.h4,
    color: colors.primaryDark,
    fontWeight: '800',
  },
  actions: {
    flexDirection: 'row',
    columnGap: spacing.sm,
  },
});

export default QuoteBuilderScreen;
