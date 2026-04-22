/**
 * LanguageSwitcher — shows a compact trigger and opens a modal
 * list of the three supported languages (AR/EN/TR).
 */

import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { colors } from '../../constants/colors';
import { radius, shadows, spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '../../i18n';
import { useUiStore } from '../../store/uiStore';

interface LanguageOption {
  code: SupportedLanguage;
  translationKey: 'language.arabic' | 'language.english' | 'language.turkish';
  nativeLabel: string;
  flag: string;
}

const OPTIONS: LanguageOption[] = [
  { code: 'ar', translationKey: 'language.arabic', nativeLabel: 'العربية', flag: '🇸🇦' },
  { code: 'en', translationKey: 'language.english', nativeLabel: 'English', flag: '🇬🇧' },
  { code: 'tr', translationKey: 'language.turkish', nativeLabel: 'Türkçe', flag: '🇹🇷' },
];

// Keep the supported set in sync with the i18n module.
OPTIONS.forEach((opt) => {
  if (!(SUPPORTED_LANGUAGES as readonly string[]).includes(opt.code)) {
    console.warn('[LanguageSwitcher] unsupported language in options:', opt.code);
  }
});

export interface LanguageSwitcherProps {
  style?: StyleProp<ViewStyle>;
  variant?: 'pill' | 'inline';
  showLabel?: boolean;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  style,
  variant = 'pill',
  showLabel = true,
}) => {
  const { t } = useTranslation();
  const language = useUiStore((s) => s.language);
  const setLanguage = useUiStore((s) => s.setLanguage);
  const [open, setOpen] = useState(false);

  const current = OPTIONS.find((opt) => opt.code === language) ?? OPTIONS[1];

  const handleSelect = async (code: SupportedLanguage): Promise<void> => {
    setOpen(false);
    if (code !== language) {
      await setLanguage(code);
    }
  };

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={t('language.change')}
        style={({ pressed }) => [
          variant === 'pill' ? styles.pill : styles.inline,
          pressed ? { opacity: 0.75 } : null,
          style,
        ]}
      >
        <Text style={styles.flag}>{current.flag}</Text>
        {showLabel ? (
          <Text style={styles.triggerLabel}>{current.nativeLabel}</Text>
        ) : null}
      </Pressable>

      <Modal
        transparent
        visible={open}
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.sheetTitle}>{t('language.select')}</Text>
            <Text style={styles.sheetSubtitle}>{t('language.selectSubtitle')}</Text>

            <View style={styles.optionList}>
              {OPTIONS.map((opt) => {
                const selected = opt.code === language;
                return (
                  <Pressable
                    key={opt.code}
                    onPress={() => void handleSelect(opt.code)}
                    style={({ pressed }) => [
                      styles.option,
                      selected ? styles.optionSelected : null,
                      pressed ? { opacity: 0.75 } : null,
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                  >
                    <Text style={styles.optionFlag}>{opt.flag}</Text>
                    <View style={styles.optionTextWrap}>
                      <Text style={styles.optionNative}>{opt.nativeLabel}</Text>
                      <Text style={styles.optionTranslation}>
                        {t(opt.translationKey)}
                      </Text>
                    </View>
                    {selected ? <Text style={styles.optionCheck}>✓</Text> : null}
                  </Pressable>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.divider,
    alignSelf: 'center',
  },
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  flag: {
    fontSize: 18,
  },
  triggerLabel: {
    ...textStyles.label,
    color: colors.primaryDark,
    marginStart: spacing.xs,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    padding: spacing.xl,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    ...shadows.lg,
  },
  sheetTitle: {
    ...textStyles.h3,
    color: colors.textPrimary,
  },
  sheetSubtitle: {
    ...textStyles.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  optionList: {
    rowGap: spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    borderRadius: radius.base,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    columnGap: spacing.md,
  },
  optionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  optionFlag: {
    fontSize: 24,
  },
  optionTextWrap: {
    flex: 1,
  },
  optionNative: {
    ...textStyles.bodyMedium,
    color: colors.textPrimary,
  },
  optionTranslation: {
    ...textStyles.caption,
    color: colors.textMuted,
  },
  optionCheck: {
    ...textStyles.h4,
    color: colors.primary,
  },
});

export default LanguageSwitcher;
