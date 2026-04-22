/**
 * OnboardingScreen — 5-step wizard for new users.
 *
 *   Step 1  Welcome       (brand, start CTA)
 *   Step 2  Country       (opens CountryPicker, persists code)
 *   Step 3  Language      (auto-picked from country, allow override)
 *   Step 4  Business type (8-option icon grid)
 *   Step 5  Complete      (summary + "Go to Dashboard")
 *
 * Completion wires the user to the existing Merchant flow by calling
 * `userStore.updateProfile({ country })` — the `RootNavigator` already
 * routes based on role + auth so no extra navigation call is needed
 * beyond clearing the auth stack.
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Button } from '../../components/common/Button';
import { Icon, type AnyIconName } from '../../components/common/Icon';
import { CountryPicker } from '../../components/forms/CountryPicker';
import { colors } from '../../constants/colors';
import { findCountry } from '../../constants/countries';
import { hitSlop, radius, shadows, spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';
import { useCountryConfig } from '../../hooks/useCountryConfig';
import type { SupportedLanguage } from '../../i18n';
import { useCountryConfigStore } from '../../store/countryConfigStore';
import { useUiStore } from '../../store/uiStore';
import { useUserStore } from '../../store/userStore';
import type { CountryCode } from '../../types/country';

type Step = 1 | 2 | 3 | 4 | 5;
const TOTAL_STEPS = 5;

interface BusinessTypeOption {
  key:
    | 'retail'
    | 'services'
    | 'restaurant'
    | 'realEstate'
    | 'manufacturing'
    | 'education'
    | 'healthcare'
    | 'other';
  icon: AnyIconName;
}

const BUSINESS_TYPES: readonly BusinessTypeOption[] = [
  { key: 'retail', icon: 'storefront-outline' },
  { key: 'services', icon: 'briefcase-outline' },
  { key: 'restaurant', icon: 'restaurant-outline' },
  { key: 'realEstate', icon: 'business-outline' },
  { key: 'manufacturing', icon: 'construct-outline' },
  { key: 'education', icon: 'school-outline' },
  { key: 'healthcare', icon: 'medkit-outline' },
  { key: 'other', icon: 'ellipsis-horizontal' },
];

export const OnboardingScreen: React.FC = () => {
  const { t } = useTranslation();
  const language = useUiStore((s) => s.language) as SupportedLanguage;
  const setLanguage = useUiStore((s) => s.setLanguage);
  const setCountry = useCountryConfigStore((s) => s.setCountry);
  const updateProfile = useUserStore((s) => s.updateProfile);
  const currentUser = useUserStore((s) => s.currentUser);
  const { config } = useCountryConfig();

  const [step, setStep] = useState<Step>(1);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<CountryCode | null>(null);
  const [businessType, setBusinessType] = useState<BusinessTypeOption['key'] | null>(null);
  const [completing, setCompleting] = useState(false);

  const { width } = useWindowDimensions();
  const columnCount = width >= 640 ? 4 : 2;

  // Whenever country changes (step 2 → 3 transition), align language.
  useEffect(() => {
    if (!selectedCountry) return;
    const country = findCountry(selectedCountry);
    if (country.language !== language) {
      void setLanguage(country.language);
    }
  }, [selectedCountry, language, setLanguage]);

  const goNext = (): void => {
    if (step < TOTAL_STEPS) {
      setStep((s) => (s + 1) as Step);
    }
  };

  const goBack = (): void => {
    if (step > 1) {
      setStep((s) => (s - 1) as Step);
    }
  };

  const handleCountrySelect = async (code: CountryCode): Promise<void> => {
    setSelectedCountry(code);
    await setCountry(code);
  };

  const handleFinish = async (): Promise<void> => {
    if (!selectedCountry) return;
    setCompleting(true);
    try {
      await updateProfile({ country: selectedCountry });
    } finally {
      setCompleting(false);
    }
  };

  const selectedCountryName = useMemo(() => {
    if (!selectedCountry) return null;
    return findCountry(selectedCountry).name[language];
  }, [selectedCountry, language]);

  const canContinue = useMemo(() => {
    switch (step) {
      case 2:
        return Boolean(selectedCountry);
      case 4:
        return Boolean(businessType);
      default:
        return true;
    }
  }, [step, selectedCountry, businessType]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.progressRow}>
        {step > 1 ? (
          <Pressable
            onPress={goBack}
            hitSlop={hitSlop.md}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel={t('onboarding.back')}
          >
            <Icon name="chevron-back" size={22} color={colors.primaryDark} />
          </Pressable>
        ) : (
          <View style={styles.backBtn} />
        )}

        <View style={styles.dots}>
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

        <Text style={styles.stepLabel}>
          {t('onboarding.stepOf', { current: step, total: TOTAL_STEPS })}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {step === 1 ? (
          <StepWelcome onStart={goNext} />
        ) : null}

        {step === 2 ? (
          <StepCountry
            selectedCountry={selectedCountry}
            selectedName={selectedCountryName}
            selectedFlag={
              selectedCountry ? findCountry(selectedCountry).flag : null
            }
            onOpenPicker={() => setPickerVisible(true)}
          />
        ) : null}

        {step === 3 ? (
          <StepLanguage
            currentLanguage={language}
            onConfirm={goNext}
          />
        ) : null}

        {step === 4 ? (
          <StepBusinessType
            columnCount={columnCount}
            value={businessType}
            onSelect={setBusinessType}
          />
        ) : null}

        {step === 5 ? (
          <StepComplete
            countryName={selectedCountryName ?? config.name[language]}
            countryFlag={
              (selectedCountry
                ? findCountry(selectedCountry).flag
                : config.flag) ?? ''
            }
            languageLabel={t(`language.${languageKey(language)}`)}
            businessTypeLabel={
              businessType ? t(`businessTypes.${businessType}`) : '—'
            }
            userName={currentUser?.name ?? ''}
          />
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        {step === 1 ? (
          <Button
            label={t('onboarding.letsGo')}
            fullWidth
            onPress={goNext}
          />
        ) : null}

        {step === 2 ? (
          <Button
            label={t('onboarding.next')}
            fullWidth
            onPress={goNext}
            disabled={!canContinue}
          />
        ) : null}

        {step === 3 ? (
          <Button
            label={t('onboarding.thisIsCorrect')}
            fullWidth
            onPress={goNext}
          />
        ) : null}

        {step === 4 ? (
          <Button
            label={t('onboarding.continue')}
            fullWidth
            onPress={goNext}
            disabled={!canContinue}
          />
        ) : null}

        {step === 5 ? (
          <Button
            label={t('onboarding.goToDashboard')}
            fullWidth
            onPress={handleFinish}
            loading={completing}
          />
        ) : null}
      </View>

      <CountryPicker
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onSelect={(code) => void handleCountrySelect(code)}
        currentCountry={selectedCountry}
      />
    </SafeAreaView>
  );
};

const languageKey = (lang: SupportedLanguage): 'arabic' | 'english' | 'turkish' => {
  switch (lang) {
    case 'ar':
      return 'arabic';
    case 'tr':
      return 'turkish';
    case 'en':
    default:
      return 'english';
  }
};

const StepWelcome: React.FC<{ onStart: () => void }> = () => {
  const { t } = useTranslation();
  return (
    <View style={styles.stepBody}>
      <View style={styles.logoBadge}>
        <Text style={styles.logoMark}>Z</Text>
      </View>
      <Text style={styles.stepTitle}>{t('onboarding.welcome')}</Text>
      <Text style={styles.stepSubtitle}>{t('onboarding.welcomeSubtitle')}</Text>
    </View>
  );
};

interface StepCountryProps {
  selectedCountry: CountryCode | null;
  selectedName: string | null;
  selectedFlag: string | null;
  onOpenPicker: () => void;
}

const StepCountry: React.FC<StepCountryProps> = ({
  selectedCountry,
  selectedName,
  selectedFlag,
  onOpenPicker,
}) => {
  const { t } = useTranslation();
  return (
    <View style={styles.stepBody}>
      <Text style={styles.stepTitle}>{t('onboarding.whereBusiness')}</Text>
      <Text style={styles.stepSubtitle}>
        {t('onboarding.whereBusinessSubtitle')}
      </Text>

      <Pressable
        onPress={onOpenPicker}
        style={({ pressed }) => [
          styles.countryButton,
          selectedCountry ? styles.countryButtonFilled : null,
          pressed ? { opacity: 0.85 } : null,
        ]}
        accessibilityRole="button"
      >
        {selectedCountry ? (
          <>
            <Text style={styles.countryFlag}>{selectedFlag}</Text>
            <View style={styles.countryTextWrap}>
              <Text style={styles.countryName}>{selectedName}</Text>
              <Text style={styles.countryHint}>
                {t('onboarding.selectCountry')}
              </Text>
            </View>
            <Icon name="checkmark-circle" size={24} color={colors.primary} />
          </>
        ) : (
          <>
            <Icon name="earth-outline" size={28} color={colors.primary} />
            <Text style={styles.countryPlaceholder}>
              {t('onboarding.selectCountry')}
            </Text>
            <Icon name="chevron-forward" size={20} color={colors.primary} />
          </>
        )}
      </Pressable>
    </View>
  );
};

interface StepLanguageProps {
  currentLanguage: SupportedLanguage;
  onConfirm: () => void;
}

const StepLanguage: React.FC<StepLanguageProps> = ({ currentLanguage }) => {
  const { t } = useTranslation();
  const setLanguage = useUiStore((s) => s.setLanguage);

  const flag =
    currentLanguage === 'ar' ? '🇸🇦' : currentLanguage === 'tr' ? '🇹🇷' : '🇬🇧';
  const native =
    currentLanguage === 'ar'
      ? 'العربية'
      : currentLanguage === 'tr'
        ? 'Türkçe'
        : 'English';

  const cycle = async (): Promise<void> => {
    const order: readonly SupportedLanguage[] = ['en', 'ar', 'tr'];
    const nextIdx = (order.indexOf(currentLanguage) + 1) % order.length;
    await setLanguage(order[nextIdx] as SupportedLanguage);
  };

  return (
    <View style={styles.stepBody}>
      <Text style={styles.stepTitle}>{t('onboarding.yourLanguage')}</Text>
      <Text style={styles.stepSubtitle}>
        {t('onboarding.yourLanguageSubtitle')}
      </Text>

      <View style={styles.languageCard}>
        <Text style={styles.languageFlag}>{flag}</Text>
        <Text style={styles.languageLabel}>{native}</Text>
        <Icon name="checkmark-circle" size={22} color={colors.primary} />
      </View>

      <Pressable onPress={() => void cycle()} hitSlop={8} style={styles.changeLink}>
        <Text style={styles.changeLinkText}>{t('onboarding.changeLanguage')}</Text>
      </Pressable>
    </View>
  );
};

interface StepBusinessTypeProps {
  columnCount: number;
  value: BusinessTypeOption['key'] | null;
  onSelect: (key: BusinessTypeOption['key']) => void;
}

const StepBusinessType: React.FC<StepBusinessTypeProps> = ({
  columnCount,
  value,
  onSelect,
}) => {
  const { t } = useTranslation();
  return (
    <View style={styles.stepBody}>
      <Text style={styles.stepTitle}>{t('onboarding.businessType')}</Text>
      <Text style={styles.stepSubtitle}>
        {t('onboarding.businessTypeSubtitle')}
      </Text>

      <View style={styles.typeGrid}>
        {BUSINESS_TYPES.map((option) => {
          const selected = option.key === value;
          return (
            <Pressable
              key={option.key}
              onPress={() => onSelect(option.key)}
              style={({ pressed }) => [
                styles.typeCard,
                { flexBasis: `${100 / columnCount - 2}%` },
                selected ? styles.typeCardSelected : null,
                pressed ? { opacity: 0.8 } : null,
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected }}
            >
              <Icon
                name={option.icon}
                size={30}
                color={selected ? colors.primary : colors.primaryDark}
              />
              <Text
                style={[
                  styles.typeLabel,
                  selected ? styles.typeLabelSelected : null,
                ]}
              >
                {t(`businessTypes.${option.key}`)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

interface StepCompleteProps {
  countryName: string;
  countryFlag: string;
  languageLabel: string;
  businessTypeLabel: string;
  userName: string;
}

const StepComplete: React.FC<StepCompleteProps> = ({
  countryName,
  countryFlag,
  languageLabel,
  businessTypeLabel,
  userName,
}) => {
  const { t } = useTranslation();
  return (
    <View style={styles.stepBody}>
      <View style={styles.successCircle}>
        <Icon name="checkmark" size={48} color={colors.textInverse} />
      </View>
      <Text style={styles.stepTitle}>{t('onboarding.allSet')}</Text>
      <Text style={styles.stepSubtitle}>
        {userName
          ? t('dashboard.welcomeName', { name: userName })
          : t('onboarding.allSetSubtitle')}
      </Text>

      <View style={styles.summaryCard}>
        <SummaryRow
          label={t('onboardingComplete.country')}
          value={`${countryFlag} ${countryName}`}
        />
        <SummaryRow
          label={t('onboardingComplete.language')}
          value={languageLabel}
        />
        <SummaryRow
          label={t('onboardingComplete.businessType')}
          value={businessTypeLabel}
        />
      </View>
    </View>
  );
};

const SummaryRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.summaryRow}>
    <Text style={styles.summaryLabel}>{label}</Text>
    <Text style={styles.summaryValue} numberOfLines={1}>
      {value}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dots: {
    flexDirection: 'row',
    columnGap: spacing.xs,
  },
  dot: {
    width: 24,
    height: 6,
    borderRadius: 3,
  },
  dotActive: { backgroundColor: colors.primary },
  dotInactive: { backgroundColor: colors.border },
  stepLabel: {
    ...textStyles.caption,
    color: colors.textMuted,
    minWidth: 60,
    textAlign: 'right',
  },
  scroll: {
    padding: spacing.xl,
    flexGrow: 1,
  },
  stepBody: {
    alignItems: 'center',
    paddingTop: spacing.lg,
    rowGap: spacing.md,
    flexGrow: 1,
  },
  logoBadge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.base,
    ...shadows.lg,
  },
  logoMark: {
    fontSize: 52,
    fontWeight: '800',
    color: colors.white,
  },
  stepTitle: {
    ...textStyles.h2,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  stepSubtitle: {
    ...textStyles.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  countryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    width: '100%',
    ...shadows.sm,
  },
  countryButtonFilled: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  countryFlag: { fontSize: 32 },
  countryTextWrap: { flex: 1 },
  countryName: {
    ...textStyles.h4,
    color: colors.textPrimary,
  },
  countryHint: {
    ...textStyles.caption,
    color: colors.textMuted,
  },
  countryPlaceholder: {
    flex: 1,
    ...textStyles.bodyMedium,
    color: colors.textSecondary,
  },
  languageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.base,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primary,
    width: '100%',
  },
  languageFlag: { fontSize: 32 },
  languageLabel: {
    flex: 1,
    ...textStyles.h4,
    color: colors.primaryDark,
  },
  changeLink: {
    paddingVertical: spacing.sm,
  },
  changeLinkText: {
    ...textStyles.label,
    color: colors.primary,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    width: '100%',
  },
  typeCard: {
    flexGrow: 1,
    aspectRatio: 1,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.base,
    rowGap: spacing.sm,
    minHeight: 110,
  },
  typeCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  typeLabel: {
    ...textStyles.label,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  typeLabelSelected: {
    color: colors.primaryDark,
  },
  successCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  summaryCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.base,
    rowGap: spacing.sm,
    ...shadows.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  summaryLabel: {
    ...textStyles.caption,
    color: colors.textMuted,
  },
  summaryValue: {
    ...textStyles.bodyMedium,
    color: colors.textPrimary,
    maxWidth: '60%',
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    backgroundColor: colors.surface,
  },
});

export default OnboardingScreen;
