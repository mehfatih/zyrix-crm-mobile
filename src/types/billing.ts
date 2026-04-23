/**
 * Shared billing-domain types: Payment, PaymentLink, Refund, Invoice,
 * ZATCASubmission, EFaturaSubmission. Country-aware compliance fields
 * stay on `Invoice` so the same record can drive ZATCA / e-Fatura /
 * generic preview UIs without forking shapes.
 */

import type { CountryCode, Currency } from './country';

export type PaymentMethodKey =
  | 'mada'
  | 'stcpay'
  | 'applepay'
  | 'visa'
  | 'mastercard'
  | 'iyzico'
  | 'paytr'
  | 'troy'
  | 'knet'
  | 'benefit'
  | 'thawani'
  | 'omannet'
  | 'naps'
  | 'fawry'
  | 'vodafone_cash'
  | 'instapay'
  | 'tabby'
  | 'tamara'
  | 'cliq'
  | 'bank_transfer'
  | 'cash'
  | 'stripe';

export type PaymentStatus =
  | 'paid'
  | 'pending'
  | 'failed'
  | 'refunded'
  | 'partial_refund';

export interface Payment {
  id: string;
  amount: number;
  currency: Currency;
  method: PaymentMethodKey;
  status: PaymentStatus;
  customerId?: string;
  customerName?: string;
  invoiceId?: string;
  transactionId?: string;
  createdAt: string;
  paidAt?: string;
  refundedAt?: string;
  gatewayFee?: number;
  failureReason?: string;
}

export type PaymentLinkStatus = 'active' | 'paid' | 'expired' | 'cancelled';

export interface PaymentLink {
  id: string;
  url: string;
  amount: number;
  currency: Currency;
  description: string;
  status: PaymentLinkStatus;
  expiresAt: string;
  paidAt?: string;
  customerId?: string;
  invoiceId?: string;
  allowPartial?: boolean;
}

export type RefundStatus =
  | 'pending'
  | 'processing'
  | 'processed'
  | 'failed';

export interface Refund {
  id: string;
  paymentId: string;
  amount: number;
  reason: string;
  status: RefundStatus;
  processedAt: string;
  method: 'original' | 'bank_transfer';
  customerName?: string;
  currency: Currency;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  discountPct?: number;
}

export type InvoiceStatus =
  | 'draft'
  | 'issued'
  | 'sent'
  | 'viewed'
  | 'paid'
  | 'overdue'
  | 'cancelled';

export type ComplianceStatus =
  | 'pending'
  | 'submitted'
  | 'accepted'
  | 'rejected';

export interface ZATCASubmission {
  invoiceId: string;
  status: ComplianceStatus;
  qrCodeBase64: string;
  submittedAt: string;
  uuid?: string;
  errorMessage?: string;
}

export interface EFaturaSubmission {
  invoiceId: string;
  status: ComplianceStatus;
  uuid: string;
  submittedAt: string;
  errorMessage?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  customerCountry: CountryCode;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  currency: Currency;
  status: InvoiceStatus;
  issuedAt: string;
  dueDate: string;
  paidAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
  zatca?: ZATCASubmission;
  efatura?: EFaturaSubmission;
}

export interface PaymentSummary {
  totalReceived: number;
  pending: number;
  refunded: number;
  failed: number;
  currency: Currency;
}

export interface InvoiceSummary {
  outstanding: number;
  thisMonthIssued: number;
  thisMonthPaid: number;
  overdueCount: number;
  currency: Currency;
}
