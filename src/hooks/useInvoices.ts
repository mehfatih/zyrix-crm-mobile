/**
 * React Query bindings for the invoices resource module. Includes
 * ZATCA / e-Fatura submission mutations and a small `useDownloadInvoicePDF`
 * helper that exposes the latest URL via state.
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import {
  cancelInvoice,
  createInvoice,
  downloadInvoicePDF,
  getInvoice,
  getInvoiceSummary,
  listInvoices,
  markAsPaid,
  sendInvoice,
  submitToEFatura,
  submitToZATCA,
  updateInvoice,
  type InvoiceCreateInput,
  type InvoiceUpdateInput,
} from '../api/invoices';
import type { ListParams, PaginatedResponse } from '../api/types';
import { useToast } from './useToast';
import type {
  EFaturaSubmission,
  Invoice,
  InvoiceSummary,
  Payment,
  ZATCASubmission,
} from '../types/billing';
import type { Currency } from '../types/country';

export const INVOICES_QUERY_KEY = ['invoices'] as const;

export const useInvoices = (
  params: ListParams = {}
): UseQueryResult<PaginatedResponse<Invoice>, Error> =>
  useQuery<PaginatedResponse<Invoice>, Error>({
    queryKey: [...INVOICES_QUERY_KEY, 'list', params],
    queryFn: () => listInvoices(params),
    staleTime: 30_000,
  });

export const useInvoice = (
  id: string | null | undefined
): UseQueryResult<Invoice, Error> =>
  useQuery<Invoice, Error>({
    queryKey: [...INVOICES_QUERY_KEY, 'detail', id],
    queryFn: () => getInvoice(id as string),
    enabled: !!id,
    staleTime: 30_000,
  });

export const useInvoiceSummary = (
  currency: Currency
): UseQueryResult<InvoiceSummary, Error> =>
  useQuery<InvoiceSummary, Error>({
    queryKey: [...INVOICES_QUERY_KEY, 'summary', currency],
    queryFn: () => getInvoiceSummary(currency),
    staleTime: 60_000,
  });

export const useCreateInvoice = (): UseMutationResult<
  Invoice,
  Error,
  InvoiceCreateInput
> => {
  const qc = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation<Invoice, Error, InvoiceCreateInput>({
    mutationFn: (data) => createInvoice(data),
    onSuccess: () => {
      toast.success(t('invoices.title'));
      void qc.invalidateQueries({ queryKey: INVOICES_QUERY_KEY });
    },
    onError: (error) => toast.error(t('common.error'), error.message),
  });
};

export const useUpdateInvoice = (): UseMutationResult<
  Invoice,
  Error,
  { id: string; data: InvoiceUpdateInput }
> => {
  const qc = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation<Invoice, Error, { id: string; data: InvoiceUpdateInput }>({
    mutationFn: ({ id, data }) => updateInvoice(id, data),
    onSuccess: () => {
      toast.success(t('common.success'));
      void qc.invalidateQueries({ queryKey: INVOICES_QUERY_KEY });
    },
    onError: (error) => toast.error(t('common.error'), error.message),
  });
};

export const useSendInvoice = (): UseMutationResult<
  void,
  Error,
  { id: string; channel: 'email' | 'whatsapp' | 'sms' }
> => {
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation<void, Error, { id: string; channel: 'email' | 'whatsapp' | 'sms' }>({
    mutationFn: ({ id, channel }) => sendInvoice(id, channel),
    onSuccess: () => toast.success(t('common.success')),
    onError: (error) => toast.error(t('common.error'), error.message),
  });
};

export const useMarkPaid = (): UseMutationResult<
  Invoice,
  Error,
  { id: string; method: Payment['method']; amount: number; paidAt?: string }
> => {
  const qc = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation<
    Invoice,
    Error,
    { id: string; method: Payment['method']; amount: number; paidAt?: string }
  >({
    mutationFn: ({ id, ...data }) => markAsPaid(id, data),
    onSuccess: () => {
      toast.success(t('payments.paymentReceived'));
      void qc.invalidateQueries({ queryKey: INVOICES_QUERY_KEY });
    },
    onError: (error) => toast.error(t('common.error'), error.message),
  });
};

export const useCancelInvoice = (): UseMutationResult<
  Invoice,
  Error,
  { id: string; reason: string }
> => {
  const qc = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation<Invoice, Error, { id: string; reason: string }>({
    mutationFn: ({ id, reason }) => cancelInvoice(id, reason),
    onSuccess: () => {
      toast.info(t('invoices.cancelled'));
      void qc.invalidateQueries({ queryKey: INVOICES_QUERY_KEY });
    },
    onError: (error) => toast.error(t('common.error'), error.message),
  });
};

export const useSubmitZATCA = (): UseMutationResult<
  ZATCASubmission,
  Error,
  string
> => {
  const qc = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation<ZATCASubmission, Error, string>({
    mutationFn: (invoiceId) => submitToZATCA(invoiceId),
    onSuccess: () => {
      toast.success(t('zatca.submittedToZATCA'));
      void qc.invalidateQueries({ queryKey: INVOICES_QUERY_KEY });
    },
    onError: (error) => toast.error(t('common.error'), error.message),
  });
};

export const useSubmitEFatura = (): UseMutationResult<
  EFaturaSubmission,
  Error,
  string
> => {
  const qc = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation<EFaturaSubmission, Error, string>({
    mutationFn: (invoiceId) => submitToEFatura(invoiceId),
    onSuccess: () => {
      toast.success(t('efatura.submittedToEFatura'));
      void qc.invalidateQueries({ queryKey: INVOICES_QUERY_KEY });
    },
    onError: (error) => toast.error(t('common.error'), error.message),
  });
};

export const useDownloadInvoicePDF = (): UseMutationResult<
  string,
  Error,
  string
> => {
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation<string, Error, string>({
    mutationFn: (invoiceId) => downloadInvoicePDF(invoiceId),
    onError: (error) => toast.error(t('common.error'), error.message),
  });
};
