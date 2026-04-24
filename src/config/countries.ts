/**
 * Country regulatory config — the currency / tax-system / date-format map
 * that drives formatters and compliance switches. This file is the
 * authoritative source for the *simple* key/value shape used across
 * business logic (invoices, phone validation, date pickers).
 *
 * The richer catalogue (localized names, regions, payment methods)
 * lives in `src/constants/countries.ts`. `COUNTRY_CONFIGS` here is the
 * minimal slice screens import when they only need currency + tax rules.
 *
 * Sprint 1 rule: language (AR/EN/TR) is UI-only. Currency, VAT/KDV,
 * ZATCA/e-Fatura flags and date format are ALWAYS derived from the
 * user's selected country — never from their UI language.
 */

import type { CountryCode } from '../types/country';

export interface CountryRegulatoryConfig {
  /** ISO currency code used by Intl.NumberFormat. */
  currency: string;
  /** Human-readable tax label for UI ("VAT-15%", "KDV-20%", "none", …). */
  tax: string;
  /** Numeric tax rate as a percent (0 when taxSystem is "none"). */
  taxRate: number;
  /** date-fns format string for the country's preferred short date. */
  dateFormat: string;
  /** Whether ZATCA Phase-2 e-invoicing applies (Saudi Arabia only). */
  zatca?: boolean;
  /** Whether Turkish e-Fatura applies (Turkey only). */
  eFatura?: boolean;
}

export const COUNTRY_CONFIGS: Record<CountryCode, CountryRegulatoryConfig> = {
  SA: {
    currency: 'SAR',
    tax: 'VAT-15%',
    taxRate: 15,
    dateFormat: 'dd/MM/yyyy',
    zatca: true,
  },
  AE: {
    currency: 'AED',
    tax: 'VAT-5%',
    taxRate: 5,
    dateFormat: 'dd/MM/yyyy',
  },
  TR: {
    currency: 'TRY',
    tax: 'KDV-20%',
    taxRate: 20,
    dateFormat: 'dd.MM.yyyy',
    eFatura: true,
  },
  EG: {
    currency: 'EGP',
    tax: 'VAT-14%',
    taxRate: 14,
    dateFormat: 'dd/MM/yyyy',
  },
  KW: {
    currency: 'KWD',
    tax: 'none',
    taxRate: 0,
    dateFormat: 'dd/MM/yyyy',
  },
  QA: {
    currency: 'QAR',
    tax: 'none',
    taxRate: 0,
    dateFormat: 'dd/MM/yyyy',
  },
  BH: {
    currency: 'BHD',
    tax: 'VAT-10%',
    taxRate: 10,
    dateFormat: 'dd/MM/yyyy',
  },
  OM: {
    currency: 'OMR',
    tax: 'VAT-5%',
    taxRate: 5,
    dateFormat: 'dd/MM/yyyy',
  },
  JO: {
    currency: 'JOD',
    tax: 'GST-16%',
    taxRate: 16,
    dateFormat: 'dd/MM/yyyy',
  },
};

export const getCountryConfig = (code: CountryCode): CountryRegulatoryConfig =>
  COUNTRY_CONFIGS[code];

/**
 * Default country chosen for new accounts based on the UI language the
 * user picked on first launch. Matches the sprint spec:
 *   Arabic-app users → SA, Turkish-app users → TR, English-app users → AE.
 * Keeping it here (not in uiStore) means the mapping is reusable from
 * onboarding, profile setup, and any future migration jobs.
 */
export const defaultCountryForLanguage = (
  language: 'ar' | 'en' | 'tr'
): CountryCode => {
  switch (language) {
    case 'ar':
      return 'SA';
    case 'tr':
      return 'TR';
    case 'en':
    default:
      return 'AE';
  }
};
