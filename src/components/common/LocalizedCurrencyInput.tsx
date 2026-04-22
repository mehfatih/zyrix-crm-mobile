/**
 * LocalizedCurrencyInput — numeric input that:
 *  - prefixes the input with the active country's currency symbol
 *  - accepts digits + a single decimal point only
 *  - respects `currencyDecimals` (2 for SAR/AED/EGP, 3 for KWD/BHD/OMR/JOD)
 *  - reformats on blur ("1234.5" → "1,234.50" in en-US style)
 *
 * Wraps the shared `Input` so error/helper styling stays consistent.
 */

import React, { useCallback } from 'react';
import { StyleSheet, Text } from 'react-native';

import { Input, type InputProps } from './Input';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';
import { useCountryConfig } from '../../hooks/useCountryConfig';

export interface LocalizedCurrencyInputProps
  extends Omit<InputProps, 'value' | 'onChangeText' | 'keyboardType' | 'leftIcon'> {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  error?: string;
}

const sanitize = (raw: string, decimals: number): string => {
  const cleaned = raw.replace(/[^0-9.]/g, '');
  const [head, ...rest] = cleaned.split('.');
  if (rest.length === 0) return head ?? '';
  const tail = rest.join('').slice(0, decimals);
  return `${head}.${tail}`;
};

const formatOnBlur = (raw: string, decimals: number): string => {
  if (!raw) return '';
  const asNumber = Number(raw);
  if (!Number.isFinite(asNumber)) return raw;
  const [int, dec = ''] = asNumber.toFixed(decimals).split('.');
  const withSeparators = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return decimals > 0 ? `${withSeparators}.${dec}` : withSeparators;
};

export const LocalizedCurrencyInput: React.FC<LocalizedCurrencyInputProps> = ({
  value,
  onChangeText,
  placeholder,
  error,
  onBlur,
  ...rest
}) => {
  const { config } = useCountryConfig();

  const handleChange = useCallback(
    (next: string) => {
      onChangeText(sanitize(next, config.currencyDecimals));
    },
    [onChangeText, config.currencyDecimals]
  );

  const handleBlur: NonNullable<InputProps['onBlur']> = useCallback(
    (event) => {
      const normalized = value.replace(/,/g, '');
      onChangeText(formatOnBlur(normalized, config.currencyDecimals));
      onBlur?.(event);
    },
    [onBlur, onChangeText, value, config.currencyDecimals]
  );

  const prefix = <Text style={styles.prefix}>{config.currencySymbol}</Text>;

  return (
    <Input
      {...rest}
      value={value}
      onChangeText={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder ?? '0.00'}
      keyboardType="decimal-pad"
      leftIcon={prefix}
      error={error}
      inputMode="decimal"
    />
  );
};

const styles = StyleSheet.create({
  prefix: {
    ...textStyles.bodyMedium,
    color: colors.primaryDark,
    marginEnd: spacing.xs,
    minWidth: 32,
  },
});

export default LocalizedCurrencyInput;
