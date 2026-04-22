/**
 * useCountryConfig — ergonomic React hook over `countryConfigStore` and
 * `utils/formatters`. Returns the currently selected `Country` plus
 * pre-bound helpers so call sites don't have to thread the code through.
 *
 * When no country is selected yet, the hook falls back to Saudi Arabia
 * (matching the spec's default). Call `setCountry()` from the store to
 * switch it.
 */

import { useMemo } from 'react';

import { DEFAULT_COUNTRY_CODE, findCountry } from '../constants/countries';
import { useCountryConfigStore } from '../store/countryConfigStore';
import type { Country, PaymentMethod } from '../types/country';
import {
  calculateTax as calculateTaxUtil,
  formatCurrency as formatCurrencyUtil,
  formatDate as formatDateUtil,
  formatNumber as formatNumberUtil,
  formatPhone as formatPhoneUtil,
  isWeekend as isWeekendUtil,
  validatePhoneNumber as validatePhoneNumberUtil,
  validateTaxId as validateTaxIdUtil,
  type DateFormatStyle,
} from '../utils/formatters';

export interface UseCountryConfigResult {
  config: Country;

  formatCurrency: (amount: number) => string;
  formatDate: (date: Date | string, style?: DateFormatStyle) => string;
  formatNumber: (num: number) => string;
  formatPhone: (phone: string) => string;

  calculateTax: (subtotal: number) => number;
  isTaxRequired: () => boolean;

  availablePaymentMethods: () => readonly PaymentMethod[];

  requiresZATCA: () => boolean;
  requiresEFatura: () => boolean;

  getPhoneCode: () => string;
  validatePhoneNumber: (phone: string) => boolean;
  validateTaxId: (taxId: string) => boolean;

  isWeekend: (date: Date) => boolean;
}

export const useCountryConfig = (): UseCountryConfigResult => {
  const stored = useCountryConfigStore((s) => s.countryConfig);

  const config = useMemo<Country>(
    () => stored ?? findCountry(DEFAULT_COUNTRY_CODE),
    [stored]
  );

  return useMemo<UseCountryConfigResult>(() => {
    const compliance = config.complianceRequirements ?? [];
    return {
      config,

      formatCurrency: (amount) => formatCurrencyUtil(amount, config.code),
      formatDate: (date, style = 'short') =>
        formatDateUtil(date, config.code, style),
      formatNumber: (num) => formatNumberUtil(num, config.code),
      formatPhone: (phone) => formatPhoneUtil(phone, config.code),

      calculateTax: (subtotal) => calculateTaxUtil(subtotal, config.code),
      isTaxRequired: () => config.taxSystem !== 'none',

      availablePaymentMethods: () => config.paymentMethods,

      requiresZATCA: () => compliance.includes('ZATCA_Phase2'),
      requiresEFatura: () => compliance.includes('eFatura_UBL_TR'),

      getPhoneCode: () => config.phoneCode,
      validatePhoneNumber: (phone) => validatePhoneNumberUtil(phone, config.code),
      validateTaxId: (taxId) => validateTaxIdUtil(taxId, config.code),

      isWeekend: (date) => isWeekendUtil(date, config.code),
    };
  }, [config]);
};

export default useCountryConfig;
