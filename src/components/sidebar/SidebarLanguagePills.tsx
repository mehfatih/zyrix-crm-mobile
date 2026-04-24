/**
 * SidebarLanguagePills — three-pill language switcher pinned to the
 * bottom of the SmartSidebar. Tapping a pill switches the language
 * instantly via the existing uiStore (no menu, no modal).
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { colors } from '../../constants/colors';
import { radius, spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';
import {
  SUPPORTED_LANGUAGES,
  type SupportedLanguage,
} from '../../i18n';
import { useUiStore } from '../../store/uiStore';
import { useToastStore } from '../../store/toastStore';

interface PillOption {
  code: SupportedLanguage;
  short: string;
  nativeLabel: string;
}

const OPTIONS: readonly PillOption[] = [
  { code: 'en', short: 'En', nativeLabel: 'English' },
  { code: 'ar', short: 'Ar', nativeLabel: 'العربية' },
  { code: 'tr', short: 'Tr', nativeLabel: 'Türkçe' },
];

OPTIONS.forEach((opt) => {
  if (!(SUPPORTED_LANGUAGES as readonly string[]).includes(opt.code)) {
    console.warn('[SidebarLanguagePills] unsupported language:', opt.code);
  }
});

export const SidebarLanguagePills: React.FC = () => {
  const { t } = useTranslation();
  const language = useUiStore((s) => s.language);
  const setLanguage = useUiStore((s) => s.setLanguage);
  const pushToast = useToastStore((s) => s.show);

  const handleSelect = async (code: SupportedLanguage): Promise<void> => {
    if (code === language) return;
    await setLanguage(code);
    pushToast({
      variant: 'success',
      title: t('language.changed'),
      description: OPTIONS.find((o) => o.code === code)?.nativeLabel,
      durationMs: 1800,
    });
  };

  return (
    <View style={styles.row}>
      {OPTIONS.map((opt) => {
        const selected = opt.code === language;
        return (
          <Pressable
            key={opt.code}
            onPress={() => void handleSelect(opt.code)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={opt.nativeLabel}
            style={({ pressed }) => [
              styles.pill,
              selected ? styles.pillActive : styles.pillInactive,
              pressed ? { opacity: 0.85 } : null,
            ]}
          >
            <Text
              style={[
                styles.label,
                selected ? styles.labelActive : styles.labelInactive,
              ]}
            >
              {opt.short}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    columnGap: spacing.sm,
  },
  pill: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  pillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pillInactive: {
    backgroundColor: colors.surface,
    borderColor: colors.primary,
  },
  label: {
    ...textStyles.label,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  labelActive: {
    color: colors.white,
  },
  labelInactive: {
    color: colors.primary,
  },
});

export default SidebarLanguagePills;
