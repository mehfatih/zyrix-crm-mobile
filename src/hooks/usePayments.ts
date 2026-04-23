/**
 * React Query bindings for the payments resource module. Mutations
 * invalidate the payments list so the UI refreshes after recording a
 * new payment, generating a link, or issuing a refund.
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
  createPaymentLink,
  getPayment,
  getPaymentsSummary,
  listPaymentLinks,
  listPayments,
  listRefunds,
  recordPayment,
  refundPayment,
  type PaymentLinkInput,
  type RecordPaymentInput,
  type RefundInput,
} from '../api/payments';
import type { ListParams, PaginatedResponse } from '../api/types';
import { useToast } from './useToast';
import type {
  Payment,
  PaymentLink,
  PaymentSummary,
  Refund,
} from '../types/billing';
import type { Currency } from '../types/country';

export const PAYMENTS_QUERY_KEY = ['payments'] as const;

export const usePayments = (
  params: ListParams = {}
): UseQueryResult<PaginatedResponse<Payment>, Error> => {
  const toast = useToast();
  const { t } = useTranslation();
  return useQuery<PaginatedResponse<Payment>, Error>({
    queryKey: [...PAYMENTS_QUERY_KEY, 'list', params],
    queryFn: () => listPayments(params),
    staleTime: 30_000,
    throwOnError: (error) => {
      toast.error(t('common.error'), error.message);
      return false;
    },
  });
};

export const usePayment = (
  id: string | null | undefined
): UseQueryResult<Payment, Error> =>
  useQuery<Payment, Error>({
    queryKey: [...PAYMENTS_QUERY_KEY, 'detail', id],
    queryFn: () => getPayment(id as string),
    enabled: !!id,
    staleTime: 30_000,
  });

export const usePaymentSummary = (
  currency: Currency
): UseQueryResult<PaymentSummary, Error> =>
  useQuery<PaymentSummary, Error>({
    queryKey: [...PAYMENTS_QUERY_KEY, 'summary', currency],
    queryFn: () => getPaymentsSummary(currency),
    staleTime: 60_000,
  });

export const useCreatePaymentLink = (): UseMutationResult<
  PaymentLink,
  Error,
  PaymentLinkInput
> => {
  const qc = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation<PaymentLink, Error, PaymentLinkInput>({
    mutationFn: (data) => createPaymentLink(data),
    onSuccess: () => {
      toast.success(t('paymentLinks.linkGenerated'));
      void qc.invalidateQueries({ queryKey: PAYMENTS_QUERY_KEY });
    },
    onError: (error) => toast.error(t('common.error'), error.message),
  });
};

export const useRecordPayment = (): UseMutationResult<
  Payment,
  Error,
  RecordPaymentInput
> => {
  const qc = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation<Payment, Error, RecordPaymentInput>({
    mutationFn: (data) => recordPayment(data),
    onSuccess: () => {
      toast.success(t('payments.paymentReceived'));
      void qc.invalidateQueries({ queryKey: PAYMENTS_QUERY_KEY });
    },
    onError: (error) => toast.error(t('common.error'), error.message),
  });
};

export const useRefund = (): UseMutationResult<Refund, Error, RefundInput> => {
  const qc = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation<Refund, Error, RefundInput>({
    mutationFn: (data) => refundPayment(data),
    onSuccess: () => {
      toast.success(t('refunds.refundProcessed'));
      void qc.invalidateQueries({ queryKey: PAYMENTS_QUERY_KEY });
      void qc.invalidateQueries({ queryKey: [...PAYMENTS_QUERY_KEY, 'refunds'] });
    },
    onError: (error) => toast.error(t('common.error'), error.message),
  });
};

export const useRefundsList = (): UseQueryResult<Refund[], Error> =>
  useQuery<Refund[], Error>({
    queryKey: [...PAYMENTS_QUERY_KEY, 'refunds'],
    queryFn: () => listRefunds(),
    staleTime: 30_000,
  });

export const usePaymentLinks = (): UseQueryResult<PaymentLink[], Error> =>
  useQuery<PaymentLink[], Error>({
    queryKey: [...PAYMENTS_QUERY_KEY, 'links'],
    queryFn: () => listPaymentLinks(),
    staleTime: 30_000,
  });
