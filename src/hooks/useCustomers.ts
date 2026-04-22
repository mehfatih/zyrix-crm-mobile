/**
 * React Query bindings for the customers resource module. Each hook
 * wraps a query or mutation and surfaces failures through the global
 * toast so screens don't repeat the same error handling boilerplate.
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
  createCustomer,
  deleteCustomer,
  getCustomer,
  listCustomers,
  updateCustomer,
  type Customer,
  type CustomerCreateInput,
  type CustomerUpdateInput,
} from '../api/customers';
import type { ListParams, PaginatedResponse } from '../api/types';
import { useToast } from './useToast';

export const CUSTOMERS_QUERY_KEY = ['customers'] as const;

export const useCustomers = (
  params: ListParams = {}
): UseQueryResult<PaginatedResponse<Customer>, Error> => {
  const toast = useToast();
  const { t } = useTranslation();

  return useQuery<PaginatedResponse<Customer>, Error>({
    queryKey: [...CUSTOMERS_QUERY_KEY, 'list', params],
    queryFn: () => listCustomers(params),
    staleTime: 30_000,
    retry: 1,
    throwOnError: (err) => {
      toast.error(t('common.error'), err.message);
      return false;
    },
  });
};

export const useCustomer = (id: string | null | undefined): UseQueryResult<Customer, Error> => {
  const toast = useToast();
  const { t } = useTranslation();

  return useQuery<Customer, Error>({
    queryKey: [...CUSTOMERS_QUERY_KEY, 'detail', id],
    queryFn: () => getCustomer(id as string),
    enabled: !!id,
    staleTime: 30_000,
    throwOnError: (err) => {
      toast.error(t('common.error'), err.message);
      return false;
    },
  });
};

export const useCreateCustomer = (): UseMutationResult<
  Customer,
  Error,
  CustomerCreateInput
> => {
  const qc = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();

  return useMutation<Customer, Error, CustomerCreateInput>({
    mutationFn: (data) => createCustomer(data),
    onSuccess: () => {
      toast.success(t('common.success'));
      void qc.invalidateQueries({ queryKey: CUSTOMERS_QUERY_KEY });
    },
    onError: (err) => {
      toast.error(t('common.error'), err.message);
    },
  });
};

export const useUpdateCustomer = (): UseMutationResult<
  Customer,
  Error,
  { id: string; data: CustomerUpdateInput }
> => {
  const qc = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();

  return useMutation<Customer, Error, { id: string; data: CustomerUpdateInput }>({
    mutationFn: ({ id, data }) => updateCustomer(id, data),
    onSuccess: (updated) => {
      toast.success(t('common.success'));
      void qc.invalidateQueries({ queryKey: CUSTOMERS_QUERY_KEY });
      qc.setQueryData(
        [...CUSTOMERS_QUERY_KEY, 'detail', updated.id],
        updated
      );
    },
    onError: (err) => {
      toast.error(t('common.error'), err.message);
    },
  });
};

export const useDeleteCustomer = (): UseMutationResult<void, Error, string> => {
  const qc = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();

  return useMutation<void, Error, string>({
    mutationFn: (id) => deleteCustomer(id),
    onSuccess: () => {
      toast.success(t('common.success'));
      void qc.invalidateQueries({ queryKey: CUSTOMERS_QUERY_KEY });
    },
    onError: (err) => {
      toast.error(t('common.error'), err.message);
    },
  });
};
