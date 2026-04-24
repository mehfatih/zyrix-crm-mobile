/**
 * LanguageSwitcher — circular, text-only trigger ("En" / "Ar" / "Tr")
 * that opens a bottom sheet with the 3 supported languages.
 *
 * Sprint 1 (app) rule: NO flags anywhere in the language UI. Each option
 * shows the two-letter code next to the native name — nothing else.
 * Selecting an option updates `uiStore.language`, persists it, reloads
 * i18n, and fires a short toast. It MUST NOT change currency, date
 * format, or any country-scoped business data.
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
import {
  SUPPORTED_LANGUAGES,
  type SupportedLanguage,
} from '../../i18n';
import { useToastStore } from '../../store/toastStore';
import { useUiStore } from '../../store/uiStore';

interface LanguageOption {
  code: SupportedLanguage;
  /** Two-letter badge text (title-cased: "En", "Ar", "Tr"). */
  short: string;
  /** Native-language display name for the list item. */
  nativeLabel: string;
  /** i18n key translated to the active UI language ("English"/…). */
  translationKey: 'language.english' | 'language.arabic' | 'language.turkish';
}

const OPTIONS: readonly LanguageOption[] = [
  { code: 'en', short: 'En', nativeLabel: 'English', translationKey: 'language.english' },
  { code: 'ar', short: 'Ar', nativeLabel: 'العربية', translationKey: 'language.arabic' },
  { code: 'tr', short: 'Tr', nativeLabel: 'Türkçe', translationKey: 'language.turkish' },
];

// Surface drift between the compile-time options and the runtime
// SUPPORTED_LANGUAGES list so we notice when a new language is added.
OPTIONS.forEach((opt) => {
  if (!(SUPPORTED_LANGUAGES as readonly string[]).includes(opt.code)) {
    console.warn('[LanguageSwitcher] unsupported language in options:', opt.code);
  }
});

export interface LanguageSwitcherProps {
  style?: StyleProp<ViewStyle>;
  /**
   * `icon` (default) — 40×40 circular trigger with the two-letter code.
   * `inline` — compact row with no border for use inside menus/drawers.
   */
  variant?: 'icon' | 'inline';
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  style,
  variant = 'icon',
}) => {
  const { t } = useTranslation();
  const language = useUiStore((s) => s.language);
  const setLanguage = useUiStore((s) => s.setLanguage);
  const pushToast = useToastStore((s) => s.show);
  const [open, setOpen] = useState(false);

  const current = OPTIONS.find((opt) => opt.code === language) ?? OPTIONS[0];

  const handleSelect = async (code: SupportedLanguage): Promise<void> => {
    setOpen(false);
    if (code === language) return;
    await setLanguage(code);
    pushToast({
      variant: 'success',
      title: t('language.changed'),
      description: OPTIONS.find((o) => o.code === code)?.nativeLabel,
      durationMs: 2000,
    });
  };

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={t('language.change')}
        style={({ pressed }) => [
          variant === 'icon' ? styles.iconTrigger : styles.inlineTrigger,
          pressed ? { opacity: 0.75 } : null,
          style,
        ]}
      >
        <Text
          style={variant === 'icon' ? styles.iconLabel : styles.inlineLabel}
        >
          {current.short}
        </Text>
      </Pressable>

      <Modal
        transparent
        visible={open}
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable
            style={styles.sheet}
            onPress={(e) => e.stopPropagation()}
            accessibilityViewIsModal
          >
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>{t('language.select')}</Text>
            <Text style={styles.sheetSubtitle}>
              {t('language.selectSubtitle')}
            </Text>

            <View style={styles.optionList}>
              {OPTIONS.map((opt) => {
                const selected = opt.code === language;
                return (
                  <Pressable
                    key={opt.code}
                    onPress={() => void handleSelect(opt.code)}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    style={({ pressed }) => [
                      styles.option,
                      selected ? styles.optionSelected : null,
                      pressed ? { opacity: 0.75 } : null,
                    ]}
                  >
                    <View
                      style={[
                        styles.optionBadge,
                        selected ? styles.optionBadgeSelected : null,
                      ]}
                    >
                      <Text
                        style={[
                          styles.optionBadgeText,
                          selected ? styles.optionBadgeTextSelected : null,
                        ]}
                      >
                        {opt.short}
                      </Text>
                    </View>
                    <View style={styles.optionTextWrap}>
                      <Text style={styles.optionNative}>{opt.nativeLabel}</Text>
                      <Text style={styles.optionTranslation}>
                        {t(opt.translationKey)}
                      </Text>
                    </View>
                    {selected ? (
                      <Text style={styles.optionCheck}>✓</Text>
                    ) : null}
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
  iconTrigger: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.xs,
  },
  iconLabel: {
    ...textStyles.label,
    color: colors.primary,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  inlineTrigger: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignSelf: 'flex-start',
  },
  inlineLabel: {
    ...textStyles.label,
    color: colors.primaryDark,
    fontWeight: '700',
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
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  sheetTitle: {
    ...textStyles.h3,
    color: colors.textHeading,
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
  optionBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
  },
  optionBadgeSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  optionBadgeText: {
    ...textStyles.label,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  optionBadgeTextSelected: {
    color: colors.textInverse,
  },
  optionTextWrap: {
    flex: 1,
  },
  optionNative: {
    ...textStyles.bodyMedium,
    color: colors.textHeading,
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
