/**
 * PDF generation is done server-side — the backend produces the
 * document, uploads it to object storage, and returns a URL we can
 * show to the user. These helpers are the thin client wrappers.
 *
 * While the backend lives behind a feature flag, we mock the URL so
 * the caller code works end-to-end.
 */

import { apiPost } from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import type { Contract } from '../api/contracts';
import type { Quote } from '../api/quotes';

const USE_MOCKS = true;

const mockUrl = (kind: string, id: string): string =>
  `https://api.crm.zyrix.co/generated/${kind}/${id}.pdf`;

export const generateQuotePDF = async (quote: Quote): Promise<string> => {
  if (USE_MOCKS) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return mockUrl('quote', quote.id);
  }
  const response = await apiPost<{ url: string }>(
    ENDPOINTS.quotes.DOWNLOAD(quote.id)
  );
  return response.url;
};

export const generateInvoicePDF = async (invoiceId: string): Promise<string> => {
  if (USE_MOCKS) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return mockUrl('invoice', invoiceId);
  }
  const response = await apiPost<{ url: string }>(
    ENDPOINTS.invoices.GET(invoiceId) + '/pdf'
  );
  return response.url;
};

export const generateContractPDF = async (
  contract: Contract
): Promise<string> => {
  if (USE_MOCKS) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return mockUrl('contract', contract.id);
  }
  const response = await apiPost<{ url: string }>(
    ENDPOINTS.contracts.GET(contract.id) + '/pdf'
  );
  return response.url;
};
