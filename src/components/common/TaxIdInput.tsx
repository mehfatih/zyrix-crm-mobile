/**
 * TaxIdInput — input whose label changes per country (VAT / TRN / VKN /
 * Tax ID / etc.) and validates against the expected digit length.
 */

import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { Input, type InputProps } from './Input';
import { useCountryConfig } from '../../hooks/useCountryConfig';
import type { SupportedLanguage } from '../../i18n';
import { useUiStore } from '../../store/uiStore';

export interface TaxIdInputProps
  extends Omit<InputProps, 'value' | 'onChangeText' | 'label'> {
  value: string;
  onChangeText: (value: string) => void;
  error?: string;
  label?: string;
}

const onlyDigits = (s: string): string => s.replace(/\D+/g, '');

export const TaxIdInput: React.FC<TaxIdInputProps> = ({
  value,
  onChangeText,
  error,
  label,
  ...rest
}) => {
  const { t } = useTranslation();
  const { config, validateTaxId } = useCountryConfig();
  const language = useUiStore((s) => s.language) as SupportedLanguage;

  const handleChange = useCallback(
    (next: string) => {
      const maxLen = config.taxIdLength ?? 20;
      onChangeText(onlyDigits(next).slice(0, maxLen));
    },
    [onChangeText, config.taxIdLength]
  );

  const computedLabel =
    label ??
    config.taxIdLabel?.[language] ??
    config.taxIdLabel?.en ??
    'Tax ID';

  const invalid = value.length > 0 && !validateTaxId(value);
  const computedError =
    error ??
    (invalid
      ? t('forms.invalidTaxId', { length: config.taxIdLength ?? '' })
      : undefined);

  return (
    <Input
      {...rest}
      value={value}
      onChangeText={handleChange}
      keyboardType="number-pad"
      inputMode="numeric"
      label={computedLabel}
      error={computedError}
      maxLength={(config.taxIdLength ?? 20) + 2}
    />
  );
};

export default TaxIdInput;
