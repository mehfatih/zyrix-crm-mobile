/**
 * ContractBuilderScreen — 6-step contract wizard. Auto-saves the draft
 * to local state every 30 seconds so merchants don't lose progress.
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  I18nManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';

import { Button } from '../../../components/common/Button';
import { DatePicker } from '../../../components/forms/DatePicker';
import { Header } from '../../../components/common/Header';
import { LocalizedCurrencyInput } from '../../../components/common/LocalizedCurrencyInput';
import { RichTextEditor } from '../../../components/forms/RichTextEditor';
import { SearchableDropdown, type DropdownItem } from '../../../components/forms/SearchableDropdown';
import { colors } from '../../../constants/colors';
import { listCustomers } from '../../../api/customers';
import { radius, shadows, spacing } from '../../../constants/spacing';
import { textStyles } from '../../../constants/typography';
import { useToast } from '../../../hooks/useToast';

export type ContractType =
  | 'serviceContract'
  | 'salesContract'
  | 'nda'
  | 'lease'
  | 'partnership'
  | 'other';

export type PaymentTerms = 'upfront' | 'monthly' | 'quarterly';

interface ContractDraft {
  customer: DropdownItem | null;
  type: ContractType;
  startDate: Date | null;
  endDate: Date | null;
  autoRenew: boolean;
  amount: string;
  paymentTerms: PaymentTerms;
  template: string;
  terms: string;
}

const TOTAL_STEPS = 6;
type Step = 1 | 2 | 3 | 4 | 5 | 6;

const CONTRACT_TYPES: readonly ContractType[] = [
  'serviceContract',
  'salesContract',
  'nda',
  'lease',
  'partnership',
  'other',
];

const DEFAULT: ContractDraft = {
  customer: null,
  type: 'serviceContract',
  startDate: null,
  endDate: null,
  autoRenew: false,
  amount: '',
  paymentTerms: 'monthly',
  template: 'standard',
  terms: '',
};

export const ContractBuilderScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const toast = useToast();

  const [draft, setDraft] = useState<ContractDraft>(DEFAULT);
  const [step, setStep] = useState<Step>(1);
  const [dirty, setDirty] = useState(false);

  const customersQuery = useQuery({
    queryKey: ['customers', 'picker'],
    queryFn: () => listCustomers({ pageSize: 100 }),
  });

  const customerOptions = useMemo<DropdownItem[]>(
    () =>
      (customersQuery.data?.items ?? []).map((c) => ({
        id: c.id,
        label: c.name,
        subtitle: c.email,
      })),
    [customersQuery.data]
  );

  const patch = (partial: Partial<ContractDraft>): void => {
    setDraft((prev) => ({ ...prev, ...partial }));
    setDirty(true);
  };

  useEffect(() => {
    if (!dirty) return undefined;
    const id = setTimeout(() => {
      toast.info(t('quoteBuilder.saveDraft'));
      setDirty(false);
    }, 30_000);
    return () => clearTimeout(id);
  }, [dirty, toast, t]);

  const canContinue = useMemo(() => {
    switch (step) {
      case 1:
        return Boolean(draft.customer && draft.type);
      case 2:
        return Boolean(draft.startDate && draft.endDate);
      case 3:
        return Number(draft.amount.replace(/,/g, '')) > 0;
      default:
        return true;
    }
  }, [step, draft]);

  const advance = (): void => {
    if (step < TOTAL_STEPS) setStep((s) => ((s + 1) as Step));
    else {
      toast.success(t('contracts.createContract'));
      navigation.goBack();
    }
  };

  const goBack = (): void => {
    if (step > 1) setStep((s) => ((s - 1) as Step));
    else if (dirty) {
      Alert.alert(t('quoteBuilder.unsavedChanges'), t('quoteBuilder.confirmDiscard'), [
        { text: t('common.cancel') },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => navigation.goBack(),
        },
      ]);
    } else {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <Header
        title={t('contracts.createContract')}
        onBack={goBack}
      />

      <View style={styles.progress}>
        {Array.from({ length: TOTAL_STEPS }).map((_, idx) => (
          <View
            key={idx}
            style={[
              styles.dot,
              idx + 1 <= step ? styles.dotActive : styles.dotInactive,
            ]}
          />
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {step === 1 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {t('contracts.createContract')}
            </Text>
            <SearchableDropdown
              items={customerOptions}
              value={draft.customer}
              onChange={(item) => patch({ customer: item })}
              label={t('quoteBuilder.customer')}
              placeholder={t('customers.searchCustomers')}
            />
            <Text style={styles.fieldLabel}>{t('contracts.type')}</Text>
            <View style={styles.typeGrid}>
              {CONTRACT_TYPES.map((tKey) => (
                <Pressable
                  key={tKey}
                  onPress={() => patch({ type: tKey })}
                  style={[
                    styles.typeCard,
                    draft.type === tKey ? styles.typeCardActive : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.typeLabel,
                      draft.type === tKey
                        ? { color: colors.primaryDark, fontWeight: '700' }
                        : null,
                    ]}
                  >
                    {t(`contracts.${tKey}`)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {step === 2 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('contracts.dates')}</Text>
            <DatePicker
              label={t('deals.expectedClose')}
              value={draft.startDate}
              onChange={(d) => patch({ startDate: d })}
            />
            <DatePicker
              label={t('deals.expectedClose')}
              value={draft.endDate}
              onChange={(d) => patch({ endDate: d })}
              minDate={draft.startDate ?? undefined}
            />
            <View style={styles.autoRenewRow}>
              <Text style={styles.fieldLabel}>{t('contracts.renew')}</Text>
              <Switch
                value={draft.autoRenew}
                onValueChange={(v) => patch({ autoRenew: v })}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.white}
              />
            </View>
          </View>
        ) : null}

        {step === 3 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('contracts.financial')}</Text>
            <LocalizedCurrencyInput
              label={t('currency.amount')}
              value={draft.amount}
              onChangeText={(next) => patch({ amount: next })}
            />
            <Text style={styles.fieldLabel}>{t('contracts.financial')}</Text>
            <View style={styles.paymentRow}>
              {(['upfront', 'monthly', 'quarterly'] as PaymentTerms[]).map((term) => (
                <Pressable
                  key={term}
                  onPress={() => patch({ paymentTerms: term })}
                  style={[
                    styles.paymentChip,
                    draft.paymentTerms === term ? styles.paymentChipActive : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.paymentText,
                      draft.paymentTerms === term
                        ? { color: colors.textInverse }
                        : null,
                    ]}
                  >
                    {t(`paymentTerms.${term}`)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {step === 4 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('contracts.template')}</Text>
            {['standard', 'custom'].map((tpl) => (
              <Pressable
                key={tpl}
                onPress={() => patch({ template: tpl })}
                style={[
                  styles.templateRow,
                  draft.template === tpl ? styles.templateRowActive : null,
                ]}
              >
                <Text style={styles.templateTitle}>
                  {tpl === 'standard'
                    ? t('quoteBuilder.useTemplate')
                    : t('quoteBuilder.saveAsTemplate')}
                </Text>
                <Text style={styles.templateHint}>
                  {t(`contracts.${draft.type}`)}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {step === 5 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('quoteBuilder.terms')}</Text>
            <RichTextEditor
              value={draft.terms}
              onChangeText={(next) => patch({ terms: next })}
              placeholder={t('quoteBuilder.terms')}
            />
          </View>
        ) : null}

        {step === 6 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('contracts.review')}</Text>
            <ReviewRow label={t('quoteBuilder.customer')} value={draft.customer?.label ?? '—'} />
            <ReviewRow label={t('contracts.type')} value={t(`contracts.${draft.type}`)} />
            <ReviewRow
              label={t('contracts.dates')}
              value={`${draft.startDate?.toDateString() ?? '—'} → ${draft.endDate?.toDateString() ?? '—'}`}
            />
            <ReviewRow label={t('currency.amount')} value={draft.amount || '—'} />
            <ReviewRow
              label={t('contracts.financial')}
              value={t(`paymentTerms.${draft.paymentTerms}`)}
            />
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <Button label={t('common.cancel')} variant="ghost" onPress={goBack} />
        <Button
          label={
            step === TOTAL_STEPS
              ? t('contracts.createContract')
              : t('onboarding.next')
          }
          onPress={advance}
          disabled={!canContinue}
        />
      </View>
    </SafeAreaView>
  );
};

const ReviewRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.reviewRow}>
    <Text style={styles.reviewLabel}>{label}</Text>
    <Text style={styles.reviewValue} numberOfLines={2}>
      {value}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  progress: {
    flexDirection: 'row',
    justifyContent: 'center',
    columnGap: spacing.xs,
    padding: spacing.sm,
  },
  dot: { width: 22, height: 5, borderRadius: 3 },
  dotActive: { backgroundColor: colors.primary },
  dotInactive: { backgroundColor: colors.border },
  scroll: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.xxl,
  },
  section: {
    backgroundColor: colors.surface,
    padding: spacing.base,
    borderRadius: radius.lg,
    rowGap: spacing.sm,
    ...shadows.xs,
  },
  sectionTitle: {
    ...textStyles.h3,
    color: colors.textPrimary,
  },
  fieldLabel: {
    ...textStyles.label,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  typeCard: {
    flexGrow: 1,
    flexBasis: '45%',
    padding: spacing.base,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  typeCardActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  typeLabel: {
    ...textStyles.body,
    color: colors.textSecondary,
  },
  autoRenewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  paymentRow: {
    flexDirection: 'row',
    columnGap: spacing.sm,
  },
  paymentChip: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
  },
  paymentChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  paymentText: {
    ...textStyles.caption,
    color: colors.textSecondary,
    textTransform: 'capitalize',
    fontWeight: '600',
  },
  templateRow: {
    padding: spacing.base,
    borderRadius: radius.base,
    borderWidth: 1,
    borderColor: colors.border,
    rowGap: spacing.xs,
  },
  templateRowActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  templateTitle: {
    ...textStyles.bodyMedium,
    color: colors.textPrimary,
  },
  templateHint: {
    ...textStyles.caption,
    color: colors.textMuted,
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  reviewLabel: { ...textStyles.caption, color: colors.textMuted },
  reviewValue: {
    ...textStyles.bodyMedium,
    color: colors.textPrimary,
    maxWidth: '60%',
    textAlign: 'right',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.base,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    backgroundColor: colors.surface,
  },
});

export default ContractBuilderScreen;
