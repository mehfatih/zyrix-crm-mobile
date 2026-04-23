/**
 * Pure invoice arithmetic helpers. Kept independent of React/state so
 * we can unit-test totals and reuse the same math on screens, in
 * builders, and (eventually) in invariant checks before submitting to
 * ZATCA / e-Fatura.
 */

import { findCountry } from '../constants/countries';
import type { CountryCode } from '../types/country';

export interface CalculatorLineItem {
  quantity: number;
  unitPrice: number;
  discountPct?: number;
  taxRate?: number;
}

const positive = (value: number): number => (Number.isFinite(value) ? Math.max(value, 0) : 0);

export const calculateLineTotal = (
  qty: number,
  unitPrice: number,
  discountPercent = 0
): number => {
  const base = positive(qty) * positive(unitPrice);
  const discount = base * Math.min(Math.max(discountPercent, 0), 100) / 100;
  return positive(base - discount);
};

export const calculateSubtotal = (items: readonly CalculatorLineItem[]): number =>
  items.reduce(
    (acc, item) =>
      acc + calculateLineTotal(item.quantity, item.unitPrice, item.discountPct ?? 0),
    0
  );

export const calculateDiscount = (subtotal: number, discountPercent: number): number => {
  const pct = Math.min(Math.max(discountPercent, 0), 100);
  return positive(subtotal * (pct / 100));
};

export const calculateTax = (subtotalAfterDiscount: number, taxRate: number): number => {
  if (taxRate <= 0) return 0;
  return positive(subtotalAfterDiscount * (taxRate / 100));
};

export const calculateGrandTotal = (
  subtotal: number,
  discount: number,
  tax: number
): number => positive(subtotal - discount + tax);

export const roundToCountryDecimals = (
  amount: number,
  countryCode: CountryCode
): number => {
  const country = findCountry(countryCode);
  const factor = 10 ** country.currencyDecimals;
  return Math.round(amount * factor) / factor;
};

export interface InvoiceTotals {
  subtotal: number;
  discount: number;
  taxableBase: number;
  tax: number;
  grandTotal: number;
}

export const calculateInvoiceTotals = (
  items: readonly CalculatorLineItem[],
  globalDiscountPct: number,
  taxRate: number,
  countryCode?: CountryCode
): InvoiceTotals => {
  const subtotal = calculateSubtotal(items);
  const discount = calculateDiscount(subtotal, globalDiscountPct);
  const taxableBase = positive(subtotal - discount);
  const tax = calculateTax(taxableBase, taxRate);
  const grandTotal = calculateGrandTotal(subtotal, discount, tax);
  if (!countryCode) {
    return { subtotal, discount, taxableBase, tax, grandTotal };
  }
  return {
    subtotal: roundToCountryDecimals(subtotal, countryCode),
    discount: roundToCountryDecimals(discount, countryCode),
    taxableBase: roundToCountryDecimals(taxableBase, countryCode),
    tax: roundToCountryDecimals(tax, countryCode),
    grandTotal: roundToCountryDecimals(grandTotal, countryCode),
  };
};
