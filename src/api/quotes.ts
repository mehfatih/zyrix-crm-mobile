/**
 * Quotes resource module.
 */

import { getMockQuotes, type MockQuote, type MockQuoteItem } from './mockData';
import { ENDPOINTS } from './endpoints';
import { apiGet, apiPatch, apiPost } from './client';
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

const USE_MOCKS = true;

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
  return apiGet<PaginatedResponse<Quote>>(ENDPOINTS.quotes.LIST, { params });
};

export const getQuote = async (id: string): Promise<Quote> => {
  if (USE_MOCKS) {
    await sleep();
    const found = getMockQuotes().find((q) => q.id === id);
    if (!found) throw new Error(`Quote ${id} not found`);
    return found;
  }
  return apiGet<Quote>(ENDPOINTS.quotes.GET(id));
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
  return apiPost<Quote>(ENDPOINTS.quotes.CREATE, data);
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
  return apiPatch<Quote>(ENDPOINTS.quotes.UPDATE(id), data);
};

export const sendQuote = async (id: string): Promise<Quote> => {
  if (USE_MOCKS) {
    await sleep();
    const found = await getQuote(id);
    return { ...found, status: 'sent', sentAt: new Date().toISOString() };
  }
  return apiPost<Quote>(ENDPOINTS.quotes.SEND(id));
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
