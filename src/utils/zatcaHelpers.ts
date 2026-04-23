/**
 * Client-side ZATCA helpers.
 *
 * The actual QR generation and submission happen on the backend
 * (signed XML, B2C / B2B variants, simplified TLV vs UBL). The
 * mobile side only needs:
 *   - a TLV-formatted base64 string (for offline QR if the backend
 *     hasn't responded yet)
 *   - validators that catch obvious gaps before submitting.
 */

import type { Invoice } from '../types/billing';

const utf8Bytes = (input: string): number[] =>
  Array.from(unescape(encodeURIComponent(input))).map((char) => char.charCodeAt(0));

const toBase64 = (bytes: number[]): string => {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let output = '';
  let i = 0;
  while (i < bytes.length) {
    const byte1 = bytes[i++] ?? 0;
    const byte2 = bytes[i++] ?? 0;
    const byte3 = bytes[i++] ?? 0;
    const triplet = (byte1 << 16) + (byte2 << 8) + byte3;
    output += chars.charAt((triplet >> 18) & 0x3f);
    output += chars.charAt((triplet >> 12) & 0x3f);
    output +=
      i - 2 > bytes.length ? '=' : chars.charAt((triplet >> 6) & 0x3f);
    output += i - 1 > bytes.length ? '=' : chars.charAt(triplet & 0x3f);
  }
  return output;
};

const buildTLV = (tag: number, value: string): number[] => {
  const valueBytes = utf8Bytes(value);
  return [tag, valueBytes.length, ...valueBytes];
};

export interface ZATCAQRInput {
  sellerName: string;
  vatNumber: string;
  timestamp: string; // ISO8601
  total: string;
  vat: string;
}

export const formatTLVQRData = (input: ZATCAQRInput): string => {
  const bytes = [
    ...buildTLV(1, input.sellerName),
    ...buildTLV(2, input.vatNumber),
    ...buildTLV(3, input.timestamp),
    ...buildTLV(4, input.total),
    ...buildTLV(5, input.vat),
  ];
  return toBase64(bytes);
};

export interface ZATCAValidation {
  valid: boolean;
  errors: string[];
}

export const validateZATCAInvoice = (invoice: Invoice): ZATCAValidation => {
  const errors: string[] = [];
  if (invoice.customerCountry !== 'SA') {
    errors.push('ZATCA only applies to invoices issued in Saudi Arabia.');
  }
  if (!invoice.invoiceNumber) errors.push('Invoice number is required.');
  if (!invoice.issuedAt) errors.push('Invoice issue date is required.');
  if (invoice.items.length === 0) errors.push('At least one line item is required.');
  if (invoice.tax <= 0) errors.push('VAT must be greater than zero for tax invoices.');
  if (invoice.total <= 0) errors.push('Total amount must be greater than zero.');
  if (!invoice.customerName) errors.push('Buyer name is required.');
  return { valid: errors.length === 0, errors };
};

const sha256Stub = (input: string): string => {
  // Real cryptographic hashing happens on the backend (UBL XML). The
  // mobile side surfaces a deterministic hex placeholder so the UI
  // can show "verification pending — final hash will be issued by ZATCA".
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = ((hash << 5) - hash + input.charCodeAt(i)) >>> 0;
  }
  return `pending-${hash.toString(16).padStart(8, '0')}`;
};

export const generateZATCAInvoiceHash = (invoice: Invoice): string =>
  sha256Stub(
    [
      invoice.invoiceNumber,
      invoice.customerId,
      invoice.issuedAt,
      invoice.subtotal.toFixed(2),
      invoice.tax.toFixed(2),
      invoice.total.toFixed(2),
    ].join('|')
  );
