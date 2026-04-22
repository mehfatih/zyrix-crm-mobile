/**
 * CountryPicker — modal bottom sheet listing the 9 supported countries.
 *
 * Tapping a country card closes the sheet and fires `onSelect(code)`. The
 * search box filters by localized name in the user's current language and
 * falls back to matching the English name / ISO code for power users.
 */

import React, { useMemo, useState } from 'react';
import {
  FlatList,
  I18nManager,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Icon } from '../common/Icon';
import { colors } from '../../constants/colors';
import { SUPPORTED_COUNTRIES } from '../../constants/countries';
import { radius, shadows, spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';
import type { SupportedLanguage } from '../../i18n';
import { useUiStore } from '../../store/uiStore';
import type { Country, CountryCode } from '../../types/country';

export interface CountryPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (code: CountryCode) => void;
  currentCountry?: CountryCode | null;
}

const TABLET_BREAKPOINT = 720;

const matches = (country: Country, needle: string, lang: SupportedLanguage): boolean => {
  if (!needle) return true;
  const q = needle.trim().toLowerCase();
  if (!q) return true;
  const candidates = [
    country.name[lang],
    country.name.en,
    country.name.ar,
    country.name.tr,
    country.code,
  ];
  return candidates.some((c) => c.toLowerCase().includes(q));
};

export const CountryPicker: React.FC<CountryPickerProps> = ({
  visible,
  onClose,
  onSelect,
  currentCountry,
}) => {
  const { t } = useTranslation();
  const language = useUiStore((s) => s.language);
  const [query, setQuery] = useState('');
  const { width } = useWindowDimensions();
  const numColumns = width >= TABLET_BREAKPOINT ? 3 : 2;

  const data = useMemo(
    () => SUPPORTED_COUNTRIES.filter((c) => matches(c, query, language)),
    [query, language]
  );

  const handleSelect = (code: CountryCode): void => {
    onSelect(code);
    onClose();
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={styles.sheet}
          onPress={(e) => e.stopPropagation()}
          accessibilityViewIsModal
        >
          <SafeAreaView edges={['bottom']} style={styles.safe}>
            <View style={styles.handle} />
            <Text style={styles.title}>{t('onboarding.selectCountry')}</Text>

            <View style={styles.searchRow}>
              <Icon name="search-outline" size={18} color={colors.textMuted} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder={t('forms.searchCountry')}
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                style={[
                  styles.searchInput,
                  {
                    textAlign: I18nManager.isRTL ? 'right' : 'left',
                  },
                ]}
              />
            </View>

            <FlatList
              key={`cols-${numColumns}`}
              data={data}
              keyExtractor={(item) => item.code}
              numColumns={numColumns}
              columnWrapperStyle={styles.row}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const selected = item.code === currentCountry;
                return (
                  <Pressable
                    onPress={() => handleSelect(item.code)}
                    style={({ pressed }) => [
                      styles.card,
                      selected ? styles.cardSelected : null,
                      pressed ? { opacity: 0.75 } : null,
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                  >
                    <Text style={styles.flag}>{item.flag}</Text>
                    <Text style={styles.cardLabel} numberOfLines={2}>
                      {item.name[language]}
                    </Text>
                    {selected ? (
                      <View style={styles.checkBubble}>
                        <Icon
                          name="checkmark"
                          size={14}
                          color={colors.textInverse}
                        />
                      </View>
                    ) : null}
                  </Pressable>
                );
              }}
            />
          </SafeAreaView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(12, 74, 110, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '85%',
    ...shadows.lg,
  },
  safe: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  title: {
    ...textStyles.h3,
    color: colors.textPrimary,
    marginBottom: spacing.base,
    textAlign: 'center',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.base,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    columnGap: spacing.sm,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    ...textStyles.body,
    color: colors.textPrimary,
    paddingVertical: spacing.sm,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  row: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    rowGap: spacing.xs,
    minHeight: 120,
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  flag: {
    fontSize: 36,
  },
  cardLabel: {
    ...textStyles.label,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  checkBubble: {
    position: 'absolute',
    top: spacing.xs,
    insetInlineEnd: spacing.xs,
    backgroundColor: colors.primary,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default CountryPicker;
