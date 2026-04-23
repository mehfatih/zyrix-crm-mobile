/**
 * Invoices resource module — CRUD plus tax-compliance helpers
 * (ZATCA for Saudi, e-Fatura for Turkey). The submit endpoints are
 * fire-and-forget from the mobile side: the backend handles the
 * actual ZATCA/e-Fatura webservice integration.
 */

import {
  MOCK_INVOICES,
  buildEFaturaSubmission,
  buildMockQRCodeBase64,
  buildZATCASubmission,
} from './paymentsMock';
import { ENDPOINTS } from './endpoints';
import { apiGet, apiPost } from './client';
import {
  calculateGrandTotal,
  calculateSubtotal,
  calculateTax,
} from '../utils/invoiceCalculator';
import type { ListParams, PaginatedResponse } from './types';
import type {
  EFaturaSubmission,
  Invoice,
  InvoiceItem,
  InvoiceStatus,
  InvoiceSummary,
  Payment,
  ZATCASubmission,
} from '../types/billing';
import type { CountryCode, Currency } from '../types/country';

const USE_MOCKS = true;

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export interface InvoiceCreateInput {
  customerId: string;
  customerName: string;
  customerCountry: CountryCode;
  currency: Currency;
  items: InvoiceItem[];
  dueDate: string;
  discount?: number;
  notes?: string;
}

export type InvoiceUpdateInput = Partial<InvoiceCreateInput> & {
  status?: InvoiceStatus;
};

export const listInvoices = async (
  params: ListParams = {}
): Promise<PaginatedResponse<Invoice>> => {
  if (USE_MOCKS) {
    await sleep(220);
    let items = [...MOCK_INVOICES];
    const status = params.filters?.status;
    if (typeof status === 'string') {
      items = items.filter((invoice) => invoice.status === status);
    }
    const customerId = params.filters?.customerId;
    if (typeof customerId === 'string') {
      items = items.filter((invoice) => invoice.customerId === customerId);
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
  return apiGet<PaginatedResponse<Invoice>>(ENDPOINTS.invoices.LIST, {
    params,
  });
};

export const getInvoice = async (id: string): Promise<Invoice> => {
  if (USE_MOCKS) {
    await sleep(180);
    const found = MOCK_INVOICES.find((invoice) => invoice.id === id);
    if (!found) throw new Error(`Invoice ${id} not found`);
    return found;
  }
  return apiGet<Invoice>(ENDPOINTS.invoices.GET(id));
};

export const createInvoice = async (
  data: InvoiceCreateInput
): Promise<Invoice> => {
  if (USE_MOCKS) {
    await sleep(420);
    const subtotal = calculateSubtotal(
      data.items.map((item) => ({ ...item, discountPct: item.discountPct ?? 0 }))
    );
    const taxRate = data.items[0]?.taxRate ?? 0;
    const tax = calculateTax(subtotal, taxRate);
    const total = calculateGrandTotal(subtotal, data.discount ?? 0, tax);
    const id = `inv_${Math.random().toString(36).slice(2, 8)}`;
    const invoice: Invoice = {
      id,
      invoiceNumber: `INV-2026-${Date.now().toString().slice(-4)}`,
      customerId: data.customerId,
      customerName: data.customerName,
      customerCountry: data.customerCountry,
      items: data.items,
      subtotal,
      discount: data.discount ?? 0,
      tax,
      total,
      currency: data.currency,
      status: 'draft',
      issuedAt: new Date().toISOString(),
      dueDate: data.dueDate,
    };
    if (data.customerCountry === 'SA') {
      invoice.zatca = {
        invoiceId: id,
        status: 'pending',
        qrCodeBase64: buildMockQRCodeBase64(),
        submittedAt: new Date().toISOString(),
      };
    }
    if (data.customerCountry === 'TR') {
      invoice.efatura = {
        invoiceId: id,
        status: 'pending',
        uuid: `tr-uuid-${id}`,
        submittedAt: new Date().toISOString(),
      };
    }
    return invoice;
  }
  return apiPost<Invoice>(ENDPOINTS.invoices.CREATE, data);
};

export const updateInvoice = async (
  id: string,
  data: InvoiceUpdateInput
): Promise<Invoice> => {
  if (USE_MOCKS) {
    await sleep(220);
    const existing = await getInvoice(id);
    return { ...existing, ...data } as Invoice;
  }
  return apiPost<Invoice>(ENDPOINTS.invoices.GET(id), data);
};

export const sendInvoice = async (
  id: string,
  channel: 'email' | 'whatsapp' | 'sms'
): Promise<void> => {
  if (USE_MOCKS) {
    await sleep(220);
    return;
  }
  await apiPost(ENDPOINTS.invoices.SEND(id), { channel });
};

export const markAsPaid = async (
  id: string,
  paymentData: { method: Payment['method']; amount: number; paidAt?: string }
): Promise<Invoice> => {
  if (USE_MOCKS) {
    await sleep(260);
    const existing = await getInvoice(id);
    return {
      ...existing,
      status: 'paid',
      paidAt: paymentData.paidAt ?? new Date().toISOString(),
    };
  }
  return apiPost<Invoice>(`${ENDPOINTS.invoices.GET(id)}/pay`, paymentData);
};

export const cancelInvoice = async (
  id: string,
  reason: string
): Promise<Invoice> => {
  if (USE_MOCKS) {
    await sleep(220);
    const existing = await getInvoice(id);
    return {
      ...existing,
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
      cancelReason: reason,
    };
  }
  return apiPost<Invoice>(ENDPOINTS.invoices.VOID(id), { reason });
};

export const downloadInvoicePDF = async (id: string): Promise<string> => {
  if (USE_MOCKS) {
    await sleep(280);
    return `https://api.crm.zyrix.co/generated/invoice/${id}.pdf`;
  }
  return apiPost<{ url: string }>(`${ENDPOINTS.invoices.GET(id)}/pdf`).then(
    (res) => res.url
  );
};

export const submitToZATCA = async (
  invoiceId: string
): Promise<ZATCASubmission> => {
  if (USE_MOCKS) {
    await sleep(420);
    return buildZATCASubmission(invoiceId);
  }
  return apiPost<ZATCASubmission>(`${ENDPOINTS.invoices.GET(invoiceId)}/zatca`);
};

export const submitToEFatura = async (
  invoiceId: string
): Promise<EFaturaSubmission> => {
  if (USE_MOCKS) {
    await sleep(420);
    return buildEFaturaSubmission(invoiceId);
  }
  return apiPost<EFaturaSubmission>(
    `${ENDPOINTS.invoices.GET(invoiceId)}/efatura`
  );
};

export const getZATCAQRCode = async (invoiceId: string): Promise<string> => {
  if (USE_MOCKS) {
    await sleep(160);
    return buildMockQRCodeBase64();
  }
  return apiGet<{ base64: string }>(
    `${ENDPOINTS.invoices.GET(invoiceId)}/zatca/qr`
  ).then((res) => res.base64);
};

const sumOutstanding = (invoices: readonly Invoice[]): number =>
  invoices
    .filter((invoice) => invoice.status === 'overdue' || invoice.status === 'sent')
    .reduce((acc, invoice) => acc + invoice.total, 0);

export const getInvoiceSummary = async (
  currency: Currency = 'SAR'
): Promise<InvoiceSummary> => {
  if (USE_MOCKS) {
    await sleep(160);
    const matching = MOCK_INVOICES.filter(
      (invoice) => invoice.currency === currency
    );
    return {
      outstanding: sumOutstanding(matching),
      thisMonthIssued: matching.filter((invoice) =>
        invoice.issuedAt.startsWith('2026-04')
      ).length,
      thisMonthPaid: matching.filter(
        (invoice) =>
          invoice.status === 'paid' &&
          invoice.paidAt &&
          invoice.paidAt.startsWith('2026-04')
      ).length,
      overdueCount: matching.filter((invoice) => invoice.status === 'overdue').length,
      currency,
    };
  }
  return apiGet<InvoiceSummary>(ENDPOINTS.invoices.LIST + '/summary');
};
