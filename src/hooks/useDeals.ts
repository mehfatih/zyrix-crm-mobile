/**
 * React Query bindings for deals. Mirrors `useCustomers` — query/mutation
 * hooks that invalidate the list cache on writes and surface errors via
 * the global toast.
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
  closeDeal,
  createDeal,
  getDeal,
  listDeals,
  moveDealStage,
  updateDeal,
  type Deal,
  type DealCreateInput,
  type DealStage,
  type DealUpdateInput,
} from '../api/deals';
import type { ListParams, PaginatedResponse } from '../api/types';
import { useToast } from './useToast';

export const DEALS_QUERY_KEY = ['deals'] as const;

export const useDeals = (
  params: ListParams = {}
): UseQueryResult<PaginatedResponse<Deal>, Error> => {
  const toast = useToast();
  const { t } = useTranslation();

  return useQuery<PaginatedResponse<Deal>, Error>({
    queryKey: [...DEALS_QUERY_KEY, 'list', params],
    queryFn: () => listDeals(params),
    staleTime: 20_000,
    throwOnError: (err) => {
      toast.error(t('common.error'), err.message);
      return false;
    },
  });
};

export const useDeal = (id: string | null | undefined): UseQueryResult<Deal, Error> => {
  const toast = useToast();
  const { t } = useTranslation();

  return useQuery<Deal, Error>({
    queryKey: [...DEALS_QUERY_KEY, 'detail', id],
    queryFn: () => getDeal(id as string),
    enabled: !!id,
    staleTime: 20_000,
    throwOnError: (err) => {
      toast.error(t('common.error'), err.message);
      return false;
    },
  });
};

export const useCreateDeal = (): UseMutationResult<Deal, Error, DealCreateInput> => {
  const qc = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();

  return useMutation<Deal, Error, DealCreateInput>({
    mutationFn: (data) => createDeal(data),
    onSuccess: () => {
      toast.success(t('common.success'));
      void qc.invalidateQueries({ queryKey: DEALS_QUERY_KEY });
    },
    onError: (err) => {
      toast.error(t('common.error'), err.message);
    },
  });
};

export const useUpdateDeal = (): UseMutationResult<
  Deal,
  Error,
  { id: string; data: DealUpdateInput }
> => {
  const qc = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();

  return useMutation<Deal, Error, { id: string; data: DealUpdateInput }>({
    mutationFn: ({ id, data }) => updateDeal(id, data),
    onSuccess: () => {
      toast.success(t('common.success'));
      void qc.invalidateQueries({ queryKey: DEALS_QUERY_KEY });
    },
    onError: (err) => {
      toast.error(t('common.error'), err.message);
    },
  });
};

export const useMoveDealStage = (): UseMutationResult<
  Deal,
  Error,
  { id: string; stage: DealStage }
> => {
  const qc = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();

  return useMutation<Deal, Error, { id: string; stage: DealStage }>({
    mutationFn: ({ id, stage }) => moveDealStage(id, stage),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: DEALS_QUERY_KEY });
    },
    onError: (err) => {
      toast.error(t('common.error'), err.message);
    },
  });
};

export const useCloseDeal = (): UseMutationResult<
  Deal,
  Error,
  { id: string; status: 'won' | 'lost' }
> => {
  const qc = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();

  return useMutation<Deal, Error, { id: string; status: 'won' | 'lost' }>({
    mutationFn: ({ id, status }) => closeDeal(id, status),
    onSuccess: () => {
      toast.success(t('common.success'));
      void qc.invalidateQueries({ queryKey: DEALS_QUERY_KEY });
    },
    onError: (err) => {
      toast.error(t('common.error'), err.message);
    },
  });
};
