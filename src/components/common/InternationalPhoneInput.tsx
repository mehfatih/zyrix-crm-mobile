/**
 * InternationalPhoneInput — standalone phone input with a selectable
 * country code (spec §14.4).
 *
 * Different from `PhoneInput`: that component locks the code to the
 * merchant's active company country. This one lets a user choose ANY
 * country code independently — for signup, profile phone number,
 * contact records, etc. The default code is seeded from the device
 * locale but freely changeable.
 *
 * Kept dependency-free (no `react-native-phone-number-input`) so we
 * don't add native modules mid-sprint; the country catalogue already
 * lives in `constants/countries.ts`.
 */

import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Localization from 'expo-localization';
import { useTranslation } from 'react-i18next';

import { Icon } from './Icon';
import { colors } from '../../constants/colors';
import { SUPPORTED_COUNTRIES } from '../../constants/countries';
import { radius, spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';
import type { Country, CountryCode } from '../../types/country';

export interface InternationalPhoneValue {
  countryCode: CountryCode;
  dialCode: string;
  nationalNumber: string;
}

export interface InternationalPhoneInputProps {
  value?: InternationalPhoneValue;
  onChange: (value: InternationalPhoneValue) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
}

const ALL_COUNTRIES = SUPPORTED_COUNTRIES;

const guessDefaultCountry = (): Country => {
  const region =
    (Localization.getLocales()?.[0]?.regionCode as CountryCode | undefined) ??
    null;
  if (region) {
    const match = ALL_COUNTRIES.find((c) => c.code === region);
    if (match) return match;
  }
  return ALL_COUNTRIES[0];
};

const onlyDigits = (s: string): string => s.replace(/\D+/g, '');

export const InternationalPhoneInput: React.FC<InternationalPhoneInputProps> = ({
  value,
  onChange,
  placeholder,
  label,
  error,
  disabled = false,
}) => {
  const { t } = useTranslation();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState('');

  const active = useMemo<Country>(() => {
    if (value) {
      const match = ALL_COUNTRIES.find((c) => c.code === value.countryCode);
      if (match) return match;
    }
    return guessDefaultCountry();
  }, [value]);

  const filtered = useMemo<readonly Country[]>(() => {
    if (!query.trim()) return ALL_COUNTRIES;
    const needle = query.trim().toLowerCase();
    return ALL_COUNTRIES.filter(
      (c) =>
        c.name.en.toLowerCase().includes(needle) ||
        c.name.ar.includes(needle) ||
        c.name.tr.toLowerCase().includes(needle) ||
        c.phoneCode.includes(needle) ||
        c.code.toLowerCase().includes(needle)
    );
  }, [query]);

  const handleNumberChange = (raw: string): void => {
    const digits = onlyDigits(raw).slice(0, 15);
    onChange({
      countryCode: active.code,
      dialCode: active.phoneCode,
      nationalNumber: digits,
    });
  };

  const handleCountryPick = (country: Country): void => {
    setPickerOpen(false);
    setQuery('');
    onChange({
      countryCode: country.code,
      dialCode: country.phoneCode,
      nationalNumber: value?.nationalNumber ?? '',
    });
  };

  return (
    <View>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View
        style={[
          styles.row,
          error ? styles.rowError : null,
          disabled ? styles.rowDisabled : null,
        ]}
      >
        <Pressable
          onPress={() => !disabled && setPickerOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={t('forms.phone')}
          style={({ pressed }) => [
            styles.codeBtn,
            pressed ? { opacity: 0.85 } : null,
          ]}
        >
          <Text style={styles.flag}>{active.flag}</Text>
          <Text style={styles.code}>{active.phoneCode}</Text>
          <Icon
            name="chevron-down"
            size={16}
            color={colors.textMuted}
          />
        </Pressable>
        <View style={styles.divider} />
        <TextInput
          style={styles.input}
          keyboardType="phone-pad"
          inputMode="tel"
          value={value?.nationalNumber ?? ''}
          onChangeText={handleNumberChange}
          placeholder={placeholder ?? t('auth.emailPlaceholder')}
          placeholderTextColor={colors.textMuted}
          editable={!disabled}
        />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Modal
        visible={pickerOpen}
        animationType="slide"
        onRequestClose={() => setPickerOpen(false)}
      >
        <SafeAreaView edges={['top', 'bottom']} style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>
              {t('forms.phone')} · {t('common.continue')}
            </Text>
            <Pressable
              onPress={() => setPickerOpen(false)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={t('common.cancel')}
            >
              <Icon name="close" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          <View style={styles.searchRow}>
            <Icon name="search" size={18} color={colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder="Search country or code"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <FlatList
            data={filtered}
            keyExtractor={(c) => c.code}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => handleCountryPick(item)}
                style={({ pressed }) => [
                  styles.countryRow,
                  pressed ? { backgroundColor: colors.primarySoft } : null,
                ]}
                accessibilityRole="button"
              >
                <Text style={styles.countryFlag}>{item.flag}</Text>
                <Text style={styles.countryName} numberOfLines={1}>
                  {item.name.en}
                </Text>
                <Text style={styles.countryDial}>{item.phoneCode}</Text>
              </Pressable>
            )}
            ItemSeparatorComponent={() => <View style={styles.rowSep} />}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  label: {
    ...textStyles.label,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    height: 48,
  },
  rowError: {
    borderColor: colors.error,
  },
  rowDisabled: {
    opacity: 0.6,
  },
  codeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 6,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
  },
  flag: { fontSize: 20 },
  code: {
    ...textStyles.bodyMedium,
    color: colors.primaryDark,
    fontWeight: '600',
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
    marginHorizontal: spacing.xs,
  },
  input: {
    flex: 1,
    ...textStyles.body,
    color: colors.textPrimary,
    paddingHorizontal: spacing.xs,
    height: '100%',
  },
  error: {
    ...textStyles.caption,
    color: colors.error,
    marginTop: 4,
  },
  sheet: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  sheetTitle: {
    ...textStyles.h4,
    color: colors.textHeading,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.sm,
    marginHorizontal: spacing.base,
    marginVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    height: 44,
    backgroundColor: colors.surfaceAlt,
  },
  searchInput: {
    flex: 1,
    ...textStyles.body,
    color: colors.textPrimary,
  },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  countryFlag: { fontSize: 24 },
  countryName: {
    flex: 1,
    ...textStyles.bodyMedium,
    color: colors.textPrimary,
  },
  countryDial: {
    ...textStyles.body,
    color: colors.textMuted,
    fontWeight: '600',
  },
  rowSep: {
    height: 1,
    backgroundColor: colors.divider,
    marginStart: spacing.xxxl,
  },
});

export default InternationalPhoneInput;
