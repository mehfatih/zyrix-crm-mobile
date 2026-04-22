/**
 * NewCustomerScreen — 5-step wizard for creating a customer.
 *
 * Country-sensitive: region picker uses `config.regions`, phone uses
 * the country prefix, tax ID validates against `config.taxIdLength`,
 * and `config.commercialRegLabel` (where present) drives the label
 * shown for the Commercial Registration field.
 */

import React, { useMemo, useState } from 'react';
import {
  I18nManager,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Button } from '../../../components/common/Button';
import { Header } from '../../../components/common/Header';
import { Icon } from '../../../components/common/Icon';
import { Input } from '../../../components/common/Input';
import { PhoneInput } from '../../../components/common/PhoneInput';
import { SearchableDropdown, type DropdownItem } from '../../../components/forms/SearchableDropdown';
import { TagsInput } from '../../../components/forms/TagsInput';
import { TaxIdInput } from '../../../components/common/TaxIdInput';
import { colors } from '../../../constants/colors';
import { findCountry } from '../../../constants/countries';
import { radius, shadows, spacing } from '../../../constants/spacing';
import { textStyles } from '../../../constants/typography';
import { useCountryConfig } from '../../../hooks/useCountryConfig';
import { useCreateCustomer } from '../../../hooks/useCustomers';
import { useToast } from '../../../hooks/useToast';
import type { SupportedLanguage } from '../../../i18n';
import { useUiStore } from '../../../store/uiStore';
import type { MerchantSalesStackParamList } from '../../../navigation/types';

type Channel = 'email' | 'whatsapp' | 'phone';
type Navigation = NativeStackNavigationProp<
  MerchantSalesStackParamList,
  'NewCustomer'
>;

interface Draft {
  fullName: string;
  companyName: string;
  role: string;
  tags: string[];
  email: string;
  phone: string;
  alternativePhone: string;
  channel: Channel;
  region: string | null;
  city: string;
  district: string;
  street: string;
  postalCode: string;
  taxId: string;
  commercialReg: string;
  exempt: boolean;
  notes: string;
  customKey: string;
  customValue: string;
}

const DEFAULT_DRAFT: Draft = {
  fullName: '',
  companyName: '',
  role: '',
  tags: [],
  email: '',
  phone: '',
  alternativePhone: '',
  channel: 'email',
  region: null,
  city: '',
  district: '',
  street: '',
  postalCode: '',
  taxId: '',
  commercialReg: '',
  exempt: false,
  notes: '',
  customKey: '',
  customValue: '',
};

type Step = 1 | 2 | 3 | 4 | 5;
const TOTAL_STEPS = 5;

export const NewCustomerScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<Navigation>();
  const toast = useToast();
  const language = useUiStore((s) => s.language) as SupportedLanguage;
  const { config } = useCountryConfig();
  const createMut = useCreateCustomer();

  const [step, setStep] = useState<Step>(1);
  const [draft, setDraft] = useState<Draft>(DEFAULT_DRAFT);

  const patch = (partial: Partial<Draft>): void => {
    setDraft((prev) => ({ ...prev, ...partial }));
  };

  const regionOptions = useMemo<DropdownItem[]>(
    () =>
      config.regions.map((r) => ({
        id: r,
        label: r,
      })),
    [config.regions]
  );

  const canContinue = useMemo(() => {
    switch (step) {
      case 1:
        return draft.fullName.trim().length >= 2;
      case 2:
        return /.+@.+/.test(draft.email);
      case 3:
        return draft.region !== null && draft.city.trim().length > 0;
      default:
        return true;
    }
  }, [step, draft]);

  const next = (): void => {
    if (step < TOTAL_STEPS) setStep((s) => ((s + 1) as Step));
    else void submit();
  };

  const back = (): void => {
    if (step > 1) setStep((s) => ((s - 1) as Step));
    else navigation.goBack();
  };

  const skip = (): void => {
    if (step < TOTAL_STEPS) setStep((s) => ((s + 1) as Step));
  };

  const submit = async (): Promise<void> => {
    try {
      const customer = await createMut.mutateAsync({
        name: draft.fullName,
        email: draft.email,
        phone: draft.phone,
        company: draft.companyName || undefined,
        country: config.code,
        taxId: draft.taxId || undefined,
        address: [draft.street, draft.district, draft.city, draft.region]
          .filter(Boolean)
          .join(', '),
        tags: draft.tags,
      });
      toast.success(t('common.success'));
      navigation.replace('CustomerDetail', { customerId: customer.id });
    } catch (err) {
      console.warn('[newCustomer] submit failed', err);
    }
  };

  const commercialLabel =
    config.commercialRegLabel?.[language] ??
    config.commercialRegLabel?.en ??
    t('forms.fullName');

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <Header
        title={`${t('customers.addFirstCustomer')} — ${t('common.step')} ${step}/${TOTAL_STEPS}`}
        onBack={back}
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
      >
        {step === 1 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('forms.fullName')}</Text>
            <Input
              label={t('forms.fullName')}
              value={draft.fullName}
              onChangeText={(next) => patch({ fullName: next })}
              required
            />
            <Input
              label={t('customers.contactInfo')}
              value={draft.companyName}
              onChangeText={(next) => patch({ companyName: next })}
            />
            <Input
              label={t('commissions.rep')}
              value={draft.role}
              onChangeText={(next) => patch({ role: next })}
            />
            <TagsInput
              label={t('customers.tags')}
              value={draft.tags}
              onChange={(next) => patch({ tags: next })}
            />
          </View>
        ) : null}

        {step === 2 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('customers.contactInfo')}</Text>
            <Input
              label={t('forms.email')}
              value={draft.email}
              onChangeText={(next) => patch({ email: next })}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              required
            />
            <PhoneInput
              label={t('forms.phone')}
              value={draft.phone}
              onChangeText={(next) => patch({ phone: next })}
            />
            <PhoneInput
              label={`${t('forms.phone')} 2`}
              value={draft.alternativePhone}
              onChangeText={(next) => patch({ alternativePhone: next })}
            />
            <Text style={styles.fieldLabel}>{t('customers.contactInfo')}</Text>
            <View style={styles.channelRow}>
              {(['email', 'whatsapp', 'phone'] as Channel[]).map((key) => (
                <Pressable
                  key={key}
                  onPress={() => patch({ channel: key })}
                  style={[
                    styles.channelChip,
                    draft.channel === key ? styles.channelChipActive : null,
                  ]}
                >
                  <Icon
                    name={
                      key === 'email'
                        ? 'mail-outline'
                        : key === 'whatsapp'
                          ? 'logo-whatsapp'
                          : 'call-outline'
                    }
                    size={18}
                    color={draft.channel === key ? colors.textInverse : colors.primary}
                  />
                  <Text
                    style={[
                      styles.channelText,
                      draft.channel === key ? { color: colors.textInverse } : null,
                    ]}
                  >
                    {key}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {step === 3 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('customers.contactInfo')}</Text>
            <View style={styles.countryReadonly}>
              <Text style={styles.countryFlag}>{config.flag}</Text>
              <Text style={styles.countryName}>
                {findCountry(config.code).name[language]}
              </Text>
            </View>
            <SearchableDropdown
              items={regionOptions}
              value={
                regionOptions.find((r) => r.id === draft.region) ?? null
              }
              onChange={(item) => patch({ region: item.id })}
              label={t('territories.assignedReps')}
              placeholder={t('customers.searchCustomers')}
            />
            <Input
              label={t('onboarding.whereBusiness')}
              value={draft.city}
              onChangeText={(next) => patch({ city: next })}
              required
            />
            <Input
              label={t('customers.contactInfo')}
              value={draft.district}
              onChangeText={(next) => patch({ district: next })}
            />
            <Input
              label={t('forms.fullName')}
              value={draft.street}
              onChangeText={(next) => patch({ street: next })}
            />
            <Input
              label={t('forms.email')}
              value={draft.postalCode}
              onChangeText={(next) => patch({ postalCode: next })}
              keyboardType="number-pad"
            />
          </View>
        ) : null}

        {step === 4 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('customers.tags')}</Text>
            <TaxIdInput
              value={draft.taxId}
              onChangeText={(next) => patch({ taxId: next })}
            />
            <Input
              label={commercialLabel}
              value={draft.commercialReg}
              onChangeText={(next) => patch({ commercialReg: next })}
            />
            <Pressable
              onPress={() => patch({ exempt: !draft.exempt })}
              style={styles.exemptRow}
            >
              <View
                style={[
                  styles.checkbox,
                  draft.exempt ? styles.checkboxChecked : null,
                ]}
              >
                {draft.exempt ? (
                  <Icon name="checkmark" size={12} color={colors.textInverse} />
                ) : null}
              </View>
              <Text style={styles.exemptText}>
                {t('currency.tax')} — {t('common.save')}
              </Text>
            </Pressable>
          </View>
        ) : null}

        {step === 5 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {t('quoteBuilder.internalNotes')}
            </Text>
            <TextInput
              value={draft.notes}
              onChangeText={(next) => patch({ notes: next })}
              placeholder={t('quoteBuilder.internalNotes')}
              placeholderTextColor={colors.textMuted}
              multiline
              style={[
                styles.textarea,
                { textAlign: I18nManager.isRTL ? 'right' : 'left' },
              ]}
            />
            <Text style={styles.fieldLabel}>
              {t('customers.contactInfo')}
            </Text>
            <View style={styles.customRow}>
              <TextInput
                value={draft.customKey}
                onChangeText={(next) => patch({ customKey: next })}
                placeholder="Key"
                placeholderTextColor={colors.textMuted}
                style={[
                  styles.customInput,
                  { textAlign: I18nManager.isRTL ? 'right' : 'left' },
                ]}
              />
              <TextInput
                value={draft.customValue}
                onChangeText={(next) => patch({ customValue: next })}
                placeholder="Value"
                placeholderTextColor={colors.textMuted}
                style={[
                  styles.customInput,
                  { textAlign: I18nManager.isRTL ? 'right' : 'left' },
                ]}
              />
            </View>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <Button label={t('common.back')} variant="ghost" onPress={back} />
        {step === 4 ? (
          <Button
            label={t('common.skip')}
            variant="outline"
            onPress={skip}
          />
        ) : null}
        <Button
          label={
            step === TOTAL_STEPS
              ? t('common.finish')
              : t('common.saveAndContinue')
          }
          onPress={next}
          disabled={!canContinue}
          loading={createMut.isPending}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  progress: {
    flexDirection: 'row',
    justifyContent: 'center',
    columnGap: spacing.xs,
    paddingVertical: spacing.sm,
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
  channelRow: {
    flexDirection: 'row',
    columnGap: spacing.sm,
  },
  channelChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  channelChipActive: {
    backgroundColor: colors.primary,
  },
  channelText: {
    ...textStyles.caption,
    color: colors.primary,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  countryReadonly: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.base,
  },
  countryFlag: { fontSize: 24 },
  countryName: { ...textStyles.bodyMedium, color: colors.primaryDark },
  exemptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.sm,
    marginTop: spacing.sm,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  exemptText: {
    ...textStyles.body,
    color: colors.textPrimary,
    flex: 1,
  },
  textarea: {
    ...textStyles.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.base,
    padding: spacing.sm,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  customRow: {
    flexDirection: 'row',
    columnGap: spacing.sm,
  },
  customInput: {
    flex: 1,
    ...textStyles.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.base,
    padding: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    columnGap: spacing.sm,
    padding: spacing.base,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    backgroundColor: colors.surface,
  },
});

export default NewCustomerScreen;
