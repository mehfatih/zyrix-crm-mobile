/**
 * Client-side e-Fatura helpers.
 *
 * Turkey's e-Fatura submission produces UBL 2.1 XML that the backend
 * signs and sends to GIB. The mobile side only validates the basics
 * before submitting and formats Turkish tax numbers (VKN) for display.
 */

import type { Invoice } from '../types/billing';

export interface EFaturaValidation {
  valid: boolean;
  errors: string[];
}

const VKN_LENGTH = 10;
const TCKN_LENGTH = 11;

export const formatTurkishTaxNumber = (vkn: string): string => {
  const digits = vkn.replace(/\D+/g, '');
  if (digits.length === VKN_LENGTH) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === TCKN_LENGTH) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return vkn;
};

export const isValidVKN = (value: string): boolean =>
  value.replace(/\D+/g, '').length === VKN_LENGTH;

export const validateEFaturaInvoice = (invoice: Invoice): EFaturaValidation => {
  const errors: string[] = [];
  if (invoice.customerCountry !== 'TR') {
    errors.push('e-Fatura only applies to invoices issued in Turkey.');
  }
  if (!invoice.invoiceNumber) errors.push('Fatura numarası boş olamaz.');
  if (!invoice.issuedAt) errors.push('Fatura tarihi gereklidir.');
  if (invoice.items.length === 0) errors.push('En az bir satır gereklidir.');
  if (invoice.tax <= 0) errors.push('KDV tutarı sıfırdan büyük olmalıdır.');
  if (invoice.total <= 0) errors.push('Toplam tutar sıfırdan büyük olmalıdır.');
  if (!invoice.customerName) errors.push('Alıcı adı gereklidir.');
  return { valid: errors.length === 0, errors };
};
