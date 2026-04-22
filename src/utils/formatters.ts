/**
 * Country-aware formatters. All helpers accept an explicit `countryCode`
 * so they can be used outside of React (utility layer, tests, migrations)
 * without pulling in `useCountryConfig`.
 *
 * The hook version in `src/hooks/useCountryConfig.ts` is the preferred
 * call-site inside React components; it reads the same helpers and
 * removes the need to thread the country code through props.
 */

import { format as formatDateFns, parseISO, isValid } from 'date-fns';

import { findCountry } from '../constants/countries';
import type { Country, CountryCode, DayName } from '../types/country';

const localeForCountry = (country: Country): string => {
  switch (country.code) {
    case 'SA':
      return 'ar-SA';
    case 'AE':
      return 'ar-AE';
    case 'KW':
      return 'ar-KW';
    case 'QA':
      return 'ar-QA';
    case 'EG':
      return 'ar-EG';
    case 'TR':
      return 'tr-TR';
    case 'BH':
      return 'ar-BH';
    case 'OM':
      return 'ar-OM';
    case 'JO':
      return 'ar-JO';
    default:
      return country.language;
  }
};

const toDate = (value: Date | string): Date | null => {
  if (value instanceof Date) {
    return isValid(value) ? value : null;
  }
  const parsed = parseISO(value);
  if (isValid(parsed)) return parsed;
  const fallback = new Date(value);
  return isValid(fallback) ? fallback : null;
};

export type DateFormatStyle = 'short' | 'long';

export const formatCurrency = (amount: number, countryCode: CountryCode): string => {
  const country = findCountry(countryCode);
  const locale = localeForCountry(country);

  try {
    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: country.currency,
      minimumFractionDigits: country.currencyDecimals,
      maximumFractionDigits: country.currencyDecimals,
    });
    return formatter.format(amount);
  } catch {
    const rounded = amount.toFixed(country.currencyDecimals);
    return country.rtl
      ? `${rounded} ${country.currencySymbol}`
      : `${country.currencySymbol} ${rounded}`;
  }
};

export const formatNumber = (num: number, countryCode: CountryCode): string => {
  const country = findCountry(countryCode);
  const locale = localeForCountry(country);
  try {
    return new Intl.NumberFormat(locale).format(num);
  } catch {
    return String(num);
  }
};

export const formatDate = (
  date: Date | string,
  countryCode: CountryCode,
  style: DateFormatStyle = 'short'
): string => {
  const country = findCountry(countryCode);
  const parsed = toDate(date);
  if (!parsed) return '';

  if (style === 'long') {
    try {
      return new Intl.DateTimeFormat(localeForCountry(country), {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(parsed);
    } catch {
      // fall through to short
    }
  }

  try {
    return formatDateFns(parsed, country.dateFormat);
  } catch {
    return parsed.toISOString().slice(0, 10);
  }
};

export const formatPhone = (phone: string, countryCode: CountryCode): string => {
  const country = findCountry(countryCode);
  const digits = phone.replace(/\D+/g, '');
  if (!digits) return country.phoneCode;

  // Split digits into groups of 3 (last group may be 2–3). Works well for
  // the 8–10 digit national numbers we target.
  const groups: string[] = [];
  let remaining = digits;
  while (remaining.length > 3) {
    groups.push(remaining.slice(0, 3));
    remaining = remaining.slice(3);
  }
  if (remaining) groups.push(remaining);
  return `${country.phoneCode} ${groups.join(' ')}`.trim();
};

export interface AddressParts {
  line1?: string;
  line2?: string;
  city?: string;
  region?: string;
  postalCode?: string;
}

export const formatAddress = (
  address: AddressParts,
  countryCode: CountryCode
): string => {
  const country = findCountry(countryCode);
  const parts = [
    address.line1,
    address.line2,
    address.city,
    address.region,
    address.postalCode,
    country.name[country.language],
  ].filter((part): part is string => Boolean(part && part.trim()));
  const separator = country.rtl ? '، ' : ', ';
  return parts.join(separator);
};

export const calculateTax = (subtotal: number, countryCode: CountryCode): number => {
  const country = findCountry(countryCode);
  return +((subtotal * country.taxRate) / 100).toFixed(country.currencyDecimals);
};

const DAY_INDEX: Record<DayName, number> = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

export const isWeekend = (date: Date, countryCode: CountryCode): boolean => {
  const country = findCountry(countryCode);
  const dow = date.getDay();
  return country.weekend.some((d) => DAY_INDEX[d] === dow);
};

export const validatePhoneNumber = (
  phone: string,
  countryCode: CountryCode
): boolean => {
  const country = findCountry(countryCode);
  const digits = phone.replace(/\D+/g, '');
  return digits.length === country.phoneLength;
};

export const validateTaxId = (taxId: string, countryCode: CountryCode): boolean => {
  const country = findCountry(countryCode);
  if (country.taxIdLength == null) return taxId.trim().length > 0;
  const digits = taxId.replace(/\D+/g, '');
  return digits.length === country.taxIdLength;
};
