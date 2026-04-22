/**
 * TaxBadge — amber pill showing the localized tax name, rate and amount.
 * Skips render entirely when the active country has no tax system
 * (`isTaxRequired()` returns false — e.g. Kuwait, Qatar).
 */

import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors } from '../../constants/colors';
import { radius, spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';
import { useCountryConfig } from '../../hooks/useCountryConfig';
import type { SupportedLanguage } from '../../i18n';
import { useUiStore } from '../../store/uiStore';

export interface TaxBadgeProps {
  amount: number;
  label?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export const TaxBadge: React.FC<TaxBadgeProps> = ({ amount, label, style, testID }) => {
  const { config, isTaxRequired, calculateTax, formatCurrency } = useCountryConfig();
  const language = useUiStore((s) => s.language) as SupportedLanguage;

  if (!isTaxRequired()) return null;

  const taxLabel =
    label ?? (config.taxName[language] || config.taxName.en);
  const calculated = calculateTax(amount);

  return (
    <View testID={testID} style={[styles.badge, style]}>
      <Text style={styles.label} numberOfLines={1}>
        {`${taxLabel} (${config.taxRate}%)`}
      </Text>
      <Text style={styles.amount} numberOfLines={1}>
        {formatCurrency(calculated)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    columnGap: spacing.sm,
    backgroundColor: colors.warningSoft,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  label: {
    ...textStyles.label,
    color: colors.warning,
  },
  amount: {
    ...textStyles.label,
    color: colors.warning,
    fontWeight: '700',
  },
});

export default TaxBadge;
