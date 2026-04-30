/**
 * First-launch language picker.
 * User chooses AR / EN / TR before seeing the login screen.
 */

import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Button } from '../../components/common/Button';
import { darkColors } from '../../theme/dark';
import { radius, shadows, spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '../../i18n';
import { useUiStore } from '../../store/uiStore';

interface LangOption {
  code: SupportedLanguage;
  translationKey: 'language.arabic' | 'language.english' | 'language.turkish';
  nativeLabel: string;
  flag: string;
  exampleKey: 'auth.welcome';
}

const OPTIONS: LangOption[] = [
  { code: 'ar', translationKey: 'language.arabic', nativeLabel: 'العربية', flag: '🇸🇦', exampleKey: 'auth.welcome' },
  { code: 'en', translationKey: 'language.english', nativeLabel: 'English', flag: '🇬🇧', exampleKey: 'auth.welcome' },
  { code: 'tr', translationKey: 'language.turkish', nativeLabel: 'Türkçe', flag: '🇹🇷', exampleKey: 'auth.welcome' },
];

// Surface a warning if the compile-time options fall out of sync
// with the runtime SUPPORTED_LANGUAGES set.
OPTIONS.forEach((opt) => {
  if (!(SUPPORTED_LANGUAGES as readonly string[]).includes(opt.code)) {
    console.warn('[LanguageSelection] unsupported language:', opt.code);
  }
});

export const LanguageSelectionScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const currentLanguage = useUiStore((s) => s.language);
  const setLanguage = useUiStore((s) => s.setLanguage);
  const markLanguageSelected = useUiStore((s) => s.markLanguageSelected);

  const [selected, setSelected] = useState<SupportedLanguage>(currentLanguage);
  const [submitting, setSubmitting] = useState(false);

  const handleSelect = async (code: SupportedLanguage): Promise<void> => {
    setSelected(code);
    // Preview the selected language instantly in the UI without triggering
    // a native reload — the store performs the reload on final confirm.
    try {
      await i18n.changeLanguage(code);
    } catch (err) {
      console.warn('[LanguageSelection] preview changeLanguage failed', err);
    }
  };

  const handleContinue = async (): Promise<void> => {
    setSubmitting(true);
    try {
      if (selected !== currentLanguage) {
        await setLanguage(selected);
      } else {
        await markLanguageSelected();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoMark}>Z</Text>
          </View>
          <Text style={styles.title}>{t('language.select')}</Text>
          <Text style={styles.subtitle}>{t('language.selectSubtitle')}</Text>
        </View>

        <View style={styles.list}>
          {OPTIONS.map((opt) => {
            const isSelected = opt.code === selected;
            return (
              <LangCard
                key={opt.code}
                option={opt}
                selected={isSelected}
                translationLabel={t(opt.translationKey)}
                previewText={t(opt.exampleKey)}
                onPress={() => void handleSelect(opt.code)}
              />
            );
          })}
        </View>

        <View style={styles.footer}>
          <Button
            label={t('common.continue')}
            variant="primary"
            fullWidth
            loading={submitting}
            onPress={() => void handleContinue()}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

interface LangCardProps {
  option: LangOption;
  selected: boolean;
  translationLabel: string;
  previewText: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

const LangCard: React.FC<LangCardProps> = ({
  option,
  selected,
  translationLabel,
  previewText,
  onPress,
  style,
}) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="button"
    accessibilityState={{ selected }}
    style={({ pressed }) => [
      styles.card,
      selected ? styles.cardSelected : null,
      pressed ? { opacity: 0.85 } : null,
      style,
    ]}
  >
    <Text style={styles.cardFlag}>{option.flag}</Text>
    <View style={styles.cardBody}>
      <Text style={styles.cardNative}>{option.nativeLabel}</Text>
      <Text style={styles.cardTranslation}>{translationLabel}</Text>
      <Text style={styles.cardPreview} numberOfLines={1}>
        {previewText}
      </Text>
    </View>
    <View style={[styles.radio, selected ? styles.radioActive : null]}>
      {selected ? <View style={styles.radioDot} /> : null}
    </View>
  </Pressable>
);

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: darkColors.background,
  },
  scroll: {
    padding: spacing.xl,
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
    marginTop: spacing.lg,
  },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: radius.xl,
    backgroundColor: darkColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  logoMark: {
    fontSize: 40,
    fontWeight: '800',
    color: darkColors.textOnPrimary,
  },
  title: {
    ...textStyles.h1,
    color: darkColors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    ...textStyles.body,
    color: darkColors.textMuted,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  list: {
    rowGap: spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.base,
    padding: spacing.base,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: darkColors.border,
    backgroundColor: darkColors.surface,
    ...shadows.xs,
  },
  cardSelected: {
    borderColor: darkColors.primary,
    backgroundColor: darkColors.primarySoft,
  },
  cardFlag: {
    fontSize: 36,
  },
  cardBody: {
    flex: 1,
  },
  cardNative: {
    ...textStyles.h4,
    color: darkColors.textPrimary,
  },
  cardTranslation: {
    ...textStyles.caption,
    color: darkColors.textMuted,
    marginTop: 2,
  },
  cardPreview: {
    ...textStyles.caption,
    color: darkColors.primaryDark,
    marginTop: spacing.xs,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: darkColors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: {
    borderColor: darkColors.primary,
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: radius.full,
    backgroundColor: darkColors.primary,
  },
  footer: {
    marginTop: spacing.xxl,
  },
});

export default LanguageSelectionScreen;
