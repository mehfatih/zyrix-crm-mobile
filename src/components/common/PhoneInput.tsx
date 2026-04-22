/**
 * PhoneInput — country-code prefixed phone input. Reads the current
 * country from `useCountryConfig`; the prefix is non-editable. Validates
 * the digit count on blur and (optionally) surfaces a localized error.
 */

import React, { useCallback } from 'react';
import { StyleSheet, Text } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Input, type InputProps } from './Input';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';
import { useCountryConfig } from '../../hooks/useCountryConfig';

export interface PhoneInputProps
  extends Omit<InputProps, 'value' | 'onChangeText' | 'keyboardType' | 'leftIcon'> {
  value: string;
  onChangeText: (value: string) => void;
  error?: string;
  onValidationChange?: (valid: boolean) => void;
}

const onlyDigits = (s: string): string => s.replace(/\D+/g, '');

export const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChangeText,
  error,
  onBlur,
  onValidationChange,
  ...rest
}) => {
  const { t } = useTranslation();
  const { config, validatePhoneNumber } = useCountryConfig();

  const handleChange = useCallback(
    (next: string) => {
      onChangeText(onlyDigits(next).slice(0, config.phoneLength));
    },
    [onChangeText, config.phoneLength]
  );

  const handleBlur: NonNullable<InputProps['onBlur']> = useCallback(
    (event) => {
      const valid = value.length === 0 || validatePhoneNumber(value);
      onValidationChange?.(valid);
      onBlur?.(event);
    },
    [onBlur, onValidationChange, validatePhoneNumber, value]
  );

  const computedError =
    error ??
    (value.length > 0 && !validatePhoneNumber(value)
      ? t('forms.invalidPhone')
      : undefined);

  const prefix = <Text style={styles.prefix}>{config.phoneCode}</Text>;

  return (
    <Input
      {...rest}
      value={value}
      onChangeText={handleChange}
      onBlur={handleBlur}
      keyboardType="phone-pad"
      leftIcon={prefix}
      error={computedError}
      inputMode="tel"
      maxLength={config.phoneLength + 2}
    />
  );
};

const styles = StyleSheet.create({
  prefix: {
    ...textStyles.bodyMedium,
    color: colors.primaryDark,
    marginEnd: spacing.xs,
  },
});

export default PhoneInput;
