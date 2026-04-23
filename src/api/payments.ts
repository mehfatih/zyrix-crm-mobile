/**
 * Payments resource module — list/get/create payment links, record
 * manual payments, issue refunds. Mocks live in `paymentsMock.ts`
 * until the backend gateway endpoints land.
 */

import {
  MOCK_PAYMENTS,
  MOCK_PAYMENT_LINKS,
  MOCK_REFUNDS,
} from './paymentsMock';
import { ENDPOINTS } from './endpoints';
import { apiGet, apiPost } from './client';
import type { ListParams, PaginatedResponse } from './types';
import type {
  Payment,
  PaymentLink,
  PaymentMethodKey,
  PaymentStatus,
  PaymentSummary,
  Refund,
} from '../types/billing';
import type { Currency } from '../types/country';

const USE_MOCKS = true;

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export interface PaymentLinkInput {
  amount: number;
  currency: Currency;
  description: string;
  customerId?: string;
  invoiceId?: string;
  expiresAt: string;
  paymentMethods: PaymentMethodKey[];
  allowPartial?: boolean;
  customerNotes?: string;
}

export interface RecordPaymentInput {
  amount: number;
  currency: Currency;
  method: PaymentMethodKey;
  customerId?: string;
  invoiceId?: string;
  paidAt?: string;
  notes?: string;
}

export interface RefundInput {
  paymentId: string;
  amount?: number;
  reason: string;
  method?: 'original' | 'bank_transfer';
  notes?: string;
}

export const listPayments = async (
  params: ListParams = {}
): Promise<PaginatedResponse<Payment>> => {
  if (USE_MOCKS) {
    await sleep(220);
    let items = [...MOCK_PAYMENTS];
    const status = params.filters?.status;
    if (typeof status === 'string') {
      items = items.filter((payment) => payment.status === status);
    }
    const method = params.filters?.method;
    if (typeof method === 'string') {
      items = items.filter((payment) => payment.method === method);
    }
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;
    const start = (page - 1) * pageSize;
    return {
      items: items.slice(start, start + pageSize),
      total: items.length,
      page,
      pageSize,
      hasMore: start + pageSize < items.length,
    };
  }
  return apiGet<PaginatedResponse<Payment>>(ENDPOINTS.payments.LIST, {
    params,
  });
};

export const getPayment = async (id: string): Promise<Payment> => {
  if (USE_MOCKS) {
    await sleep(180);
    const found = MOCK_PAYMENTS.find((payment) => payment.id === id);
    if (!found) throw new Error(`Payment ${id} not found`);
    return found;
  }
  return apiGet<Payment>(ENDPOINTS.payments.GET(id));
};

export const createPaymentLink = async (
  data: PaymentLinkInput
): Promise<PaymentLink> => {
  if (USE_MOCKS) {
    await sleep(360);
    const id = `pl_${Math.random().toString(36).slice(2, 8)}`;
    return {
      id,
      url: `https://pay.zyrix.co/l/${id}`,
      amount: data.amount,
      currency: data.currency,
      description: data.description,
      status: 'active',
      expiresAt: data.expiresAt,
      customerId: data.customerId,
      invoiceId: data.invoiceId,
      allowPartial: data.allowPartial,
    };
  }
  return apiPost<PaymentLink>(ENDPOINTS.payments.RECORD + '/link', data);
};

export const recordPayment = async (
  data: RecordPaymentInput
): Promise<Payment> => {
  if (USE_MOCKS) {
    await sleep(280);
    return {
      id: `pay_${Math.random().toString(36).slice(2, 8)}`,
      amount: data.amount,
      currency: data.currency,
      method: data.method,
      status: 'paid',
      customerId: data.customerId,
      invoiceId: data.invoiceId,
      transactionId: `TXN-${Date.now().toString().slice(-6)}`,
      createdAt: new Date().toISOString(),
      paidAt: data.paidAt ?? new Date().toISOString(),
    };
  }
  return apiPost<Payment>(ENDPOINTS.payments.RECORD, data);
};

export const refundPayment = async (input: RefundInput): Promise<Refund> => {
  if (USE_MOCKS) {
    await sleep(320);
    const original = MOCK_PAYMENTS.find(
      (payment) => payment.id === input.paymentId
    );
    return {
      id: `rf_${Math.random().toString(36).slice(2, 8)}`,
      paymentId: input.paymentId,
      amount: input.amount ?? original?.amount ?? 0,
      reason: input.reason,
      status: 'processing',
      processedAt: new Date().toISOString(),
      method: input.method ?? 'original',
      customerName: original?.customerName,
      currency: original?.currency ?? 'SAR',
    };
  }
  return apiPost<Refund>(ENDPOINTS.payments.REFUND(input.paymentId), input);
};

export const listRefunds = async (): Promise<Refund[]> => {
  if (USE_MOCKS) {
    await sleep(220);
    return [...MOCK_REFUNDS];
  }
  return apiGet<Refund[]>(ENDPOINTS.payments.LIST + '/refunds');
};

export const listPaymentLinks = async (): Promise<PaymentLink[]> => {
  if (USE_MOCKS) {
    await sleep(180);
    return [...MOCK_PAYMENT_LINKS];
  }
  return apiGet<PaymentLink[]>(ENDPOINTS.payments.RECORD + '/links');
};

const sumByStatus = (payments: readonly Payment[], status: PaymentStatus): number =>
  payments
    .filter((payment) => payment.status === status)
    .reduce((acc, payment) => acc + payment.amount, 0);

export const getPaymentsSummary = async (
  currency: Currency = 'SAR'
): Promise<PaymentSummary> => {
  if (USE_MOCKS) {
    await sleep(160);
    const matching = MOCK_PAYMENTS.filter(
      (payment) => payment.currency === currency
    );
    return {
      totalReceived: sumByStatus(matching, 'paid'),
      pending: sumByStatus(matching, 'pending'),
      refunded: sumByStatus(matching, 'refunded'),
      failed: sumByStatus(matching, 'failed'),
      currency,
    };
  }
  return apiGet<PaymentSummary>(ENDPOINTS.payments.LIST + '/summary');
};
