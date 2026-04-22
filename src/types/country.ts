/**
 * Country configuration types. A single `Country` object carries every
 * locale-sensitive piece of configuration the app needs (currency, tax,
 * payment rails, date format, phone code, regions, weekend, compliance).
 *
 * Sprint 3 ships 9 markets: SA, AE, KW, QA, EG, TR, BH, OM, JO.
 */

import type { SupportedLanguage } from '../i18n';

export type CountryCode =
  | 'SA'
  | 'AE'
  | 'KW'
  | 'QA'
  | 'EG'
  | 'TR'
  | 'BH'
  | 'OM'
  | 'JO';

export type Currency =
  | 'SAR'
  | 'AED'
  | 'KWD'
  | 'QAR'
  | 'EGP'
  | 'TRY'
  | 'BHD'
  | 'OMR'
  | 'JOD';

/**
 * Free-form string — region-specific values include:
 *   GCC: 'mada', 'stcpay', 'applepay', 'visa', 'mastercard', 'knet',
 *        'benefit', 'thawani', 'omannet', 'naps'
 *   EG:  'fawry', 'vodafone_cash', 'instapay'
 *   TR:  'iyzico', 'paytr', 'troy'
 *   Region-agnostic: 'bank_transfer', 'cash', 'tabby', 'tamara', 'cliq'
 */
export type PaymentMethod = string;

export type TaxSystem =
  | 'none'
  | 'ZATCA'
  | 'UAE_VAT'
  | 'Egypt_VAT'
  | 'Turkey_eFatura'
  | 'Bahrain_VAT'
  | 'Oman_VAT'
  | 'Jordan_GST';

export type ComplianceRequirement =
  | 'ZATCA_Phase2'
  | 'PDPL'
  | 'UAE_VAT'
  | 'PDPL_UAE'
  | 'Egypt_ETA'
  | 'eFatura_UBL_TR'
  | 'KVKK';

export type CalendarSystem = 'gregorian' | 'gregorian+hijri';

export type DayName =
  | 'Sunday'
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday';

export interface LocalizedText {
  ar: string;
  en: string;
  tr: string;
}

export interface Country {
  code: CountryCode;
  name: LocalizedText;
  flag: string;

  currency: Currency;
  currencySymbol: string;
  currencyDecimals: number;

  taxSystem: TaxSystem;
  taxRate: number;
  taxName: LocalizedText;
  taxIdLabel?: LocalizedText;
  taxIdLength?: number;
  commercialRegLabel?: LocalizedText;

  phoneCode: string;
  phoneLength: number;

  paymentMethods: readonly PaymentMethod[];

  dateFormat: string;
  weekStart: 0 | 1 | 6;
  calendar?: CalendarSystem;

  regions: readonly string[];

  language: SupportedLanguage;
  rtl: boolean;

  complianceRequirements?: readonly ComplianceRequirement[];
  weekend: readonly DayName[];
}
