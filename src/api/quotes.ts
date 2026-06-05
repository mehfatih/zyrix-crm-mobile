/**
 * Quotes resource module.
 */

import { getMockQuotes, type MockQuote, type MockQuoteItem } from './mockData';
import { ENDPOINTS } from './endpoints';
import { apiGet, apiGetData, apiPatchData, apiPost, apiPostData } from './client';
import type { ListParams, PaginatedResponse } from './types';

export type Quote = MockQuote;
export type QuoteItem = MockQuoteItem;

export interface QuoteCreateInput {
  customerId: string;
  customerName: string;
  items: QuoteItem[];
  expiresAt: string;
  notes?: string;
}

import { USE_MOCKS } from '../config/runtime';

// ── Backend shape + mapping ─────────────────────────────────────────────────
// Real /api/quotes returns a {items,pagination} wrapper; monetary + line
// numerics are Prisma Decimals serialised as strings.
interface BackendQuoteItem {
  description?: string | null;
  name?: string | null;
  quantity?: number | string | null;
  unitPrice?: number | string | null;
}
interface BackendQuote {
  id: string;
  quoteNumber?: string | null;
  number?: string | null;
  title?: string | null;
  customerId?: string | null;
  customer?: { id: string; fullName?: string | null } | null;
  subtotal?: number | string | null;
  taxAmount?: number | string | null;
  total?: number | string | null;
  status?: string | null;
  validUntil?: string | null;
  sentAt?: string | null;
  viewedAt?: string | null;
  acceptedAt?: string | null;
  items?: BackendQuoteItem[] | null;
}
interface BackendQuoteList {
  items: BackendQuote[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

const QUOTE_STATUSES: readonly Quote['status'][] = [
  'draft',
  'sent',
  'viewed',
  'accepted',
  'expired',
];

const mapQuoteStatus = (s?: string | null): Quote['status'] => {
  if (s === 'rejected') return 'expired';
  return (QUOTE_STATUSES as readonly string[]).includes(s ?? '')
    ? (s as Quote['status'])
    : 'draft';
};

const mapQuote = (b: BackendQuote): Quote => ({
  id: b.id,
  quoteNumber: b.quoteNumber ?? b.number ?? `Q-${b.id.slice(0, 6)}`,
  customerId: b.customer?.id ?? b.customerId ?? '',
  customerName: b.customer?.fullName ?? b.title ?? '',
  subtotal: Number(b.subtotal ?? 0) || 0,
  tax: Number(b.taxAmount ?? 0) || 0,
  total: Number(b.total ?? 0) || 0,
  status: mapQuoteStatus(b.status),
  sentAt: b.sentAt ?? undefined,
  viewedAt: b.viewedAt ?? undefined,
  acceptedAt: b.acceptedAt ?? undefined,
  expiresAt: b.validUntil ?? '',
  items: (b.items ?? []).map((i) => ({
    description: i.description ?? i.name ?? '',
    quantity: Number(i.quantity ?? 0) || 0,
    unitPrice: Number(i.unitPrice ?? 0) || 0,
  })),
});

const sleep = async (): Promise<void> => {
  if (USE_MOCKS) await new Promise((r) => setTimeout(r, 200));
};

export const listQuotes = async (
  params: ListParams = {}
): Promise<PaginatedResponse<Quote>> => {
  if (USE_MOCKS) {
    await sleep();
    const all = getMockQuotes();
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;
    const start = (page - 1) * pageSize;
    return {
      items: all.slice(start, start + pageSize),
      total: all.length,
      page,
      pageSize,
      hasMore: start + pageSize < all.length,
    };
  }
  const res = await apiGetData<BackendQuoteList>(ENDPOINTS.quotes.LIST, {
    params: {
      page: params.page ?? 1,
      limit: params.pageSize ?? 20,
      ...(params.search ? { search: params.search } : {}),
    },
  });
  return {
    items: res.items.map(mapQuote),
    total: res.pagination.total,
    page: res.pagination.page,
    pageSize: res.pagination.limit,
    hasMore: res.pagination.page < res.pagination.totalPages,
  };
};

export const getQuote = async (id: string): Promise<Quote> => {
  if (USE_MOCKS) {
    await sleep();
    const found = getMockQuotes().find((q) => q.id === id);
    if (!found) throw new Error(`Quote ${id} not found`);
    return found;
  }
  return mapQuote(await apiGetData<BackendQuote>(ENDPOINTS.quotes.GET(id)));
};

export const createQuote = async (data: QuoteCreateInput): Promise<Quote> => {
  if (USE_MOCKS) {
    await sleep();
    const subtotal = data.items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    );
    const tax = +(subtotal * 0.15).toFixed(2);
    return {
      id: `quo_${Math.random().toString(36).slice(2, 8)}`,
      quoteNumber: `Q-2026-${String(Date.now()).slice(-4)}`,
      customerId: data.customerId,
      customerName: data.customerName,
      subtotal,
      tax,
      total: subtotal + tax,
      status: 'draft',
      items: data.items,
      expiresAt: data.expiresAt,
    };
  }
  return mapQuote(
    await apiPostData<BackendQuote>(ENDPOINTS.quotes.CREATE, {
      customerId: data.customerId,
      title: data.customerName ? `Quote — ${data.customerName}` : 'Quote',
      validUntil: data.expiresAt,
      notes: data.notes,
      items: data.items.map((i) => ({
        description: i.description,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      })),
    })
  );
};

export const updateQuote = async (
  id: string,
  data: Partial<QuoteCreateInput>
): Promise<Quote> => {
  if (USE_MOCKS) {
    await sleep();
    const found = await getQuote(id);
    return { ...found, ...data } as Quote;
  }
  const body: Record<string, unknown> = {};
  if (data.expiresAt !== undefined) body.validUntil = data.expiresAt;
  if (data.notes !== undefined) body.notes = data.notes;
  if (data.items !== undefined) {
    body.items = data.items.map((i) => ({
      description: i.description,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
    }));
  }
  return mapQuote(await apiPatchData<BackendQuote>(ENDPOINTS.quotes.UPDATE(id), body));
};

export const sendQuote = async (id: string): Promise<Quote> => {
  if (USE_MOCKS) {
    await sleep();
    const found = await getQuote(id);
    return { ...found, status: 'sent', sentAt: new Date().toISOString() };
  }
  return mapQuote(await apiPostData<BackendQuote>(ENDPOINTS.quotes.SEND(id)));
};

export const convertToInvoice = async (id: string): Promise<{ invoiceId: string }> => {
  if (USE_MOCKS) {
    await sleep();
    return { invoiceId: `inv_${id.slice(-4)}` };
  }
  return apiPost<{ invoiceId: string }>(ENDPOINTS.quotes.CONVERT(id));
};

export const downloadPDF = async (id: string): Promise<{ url: string }> => {
  if (USE_MOCKS) {
    await sleep();
    return { url: `https://api.crm.zyrix.co/quotes/${id}.pdf` };
  }
  return apiGet<{ url: string }>(ENDPOINTS.quotes.DOWNLOAD(id));
};
