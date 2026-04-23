/**
 * React Query bindings for the admin resource module. Each hook
 * surfaces failures via the global toast so screens don't repeat
 * boilerplate, and mutations invalidate the relevant list cache.
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
  createAdminUser,
  createCompany,
  createComplianceExport,
  createIPRule,
  createPlan,
  createRetentionPolicy,
  createSCIMToken,
  deactivateUser,
  getAdminSummary,
  getAdminUser,
  getCompany,
  getComplianceExports,
  getFeatureFlags,
  getPlans,
  getPlatformAuditLog,
  getSystemStats,
  impersonateUser,
  listAllUsers,
  listCompanies,
  listIPAllowlistRules,
  listRetentionPolicies,
  listSCIMTokens,
  reactivateCompany,
  resetUserPassword,
  revokeSCIMToken,
  sendSystemNotification,
  suspendCompany,
  updateCompany,
  updateFeatureFlag,
  updatePlan,
  type AdminUserCreateInput,
  type CompanyCreateInput,
} from '../api/admin';
import type { ListParams, PaginatedResponse } from '../api/types';
import { useToast } from './useToast';
import type {
  AdminSummary,
  AdminUser,
  AuditLogEntry,
  Company,
  ComplianceExport,
  ComplianceExportInput,
  FeatureFlag,
  IPRule,
  IPRuleInput,
  ImpersonationToken,
  Plan,
  RetentionPolicy,
  RetentionPolicyInput,
  SCIMToken,
  SCIMTokenInput,
  SystemNotificationInput,
  SystemStats,
} from '../types/admin';

const ADMIN_KEY = ['admin'] as const;

export const useAdminSummary = (): UseQueryResult<AdminSummary, Error> =>
  useQuery<AdminSummary, Error>({
    queryKey: [...ADMIN_KEY, 'summary'],
    queryFn: () => getAdminSummary(),
    staleTime: 60_000,
  });

export const useCompanies = (
  params: ListParams = {}
): UseQueryResult<PaginatedResponse<Company>, Error> =>
  useQuery<PaginatedResponse<Company>, Error>({
    queryKey: [...ADMIN_KEY, 'companies', params],
    queryFn: () => listCompanies(params),
    staleTime: 60_000,
  });

export const useCompany = (
  id: string | null | undefined
): UseQueryResult<Company, Error> =>
  useQuery<Company, Error>({
    queryKey: [...ADMIN_KEY, 'company', id],
    queryFn: () => getCompany(id as string),
    enabled: !!id,
    staleTime: 60_000,
  });

export const useCreateCompany = (): UseMutationResult<
  Company,
  Error,
  CompanyCreateInput
> => {
  const qc = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation<Company, Error, CompanyCreateInput>({
    mutationFn: (data) => createCompany(data),
    onSuccess: () => {
      toast.success(t('common.success'));
      void qc.invalidateQueries({ queryKey: [...ADMIN_KEY, 'companies'] });
    },
    onError: (error) => toast.error(t('common.error'), error.message),
  });
};

export const useUpdateCompany = (): UseMutationResult<
  Company,
  Error,
  { id: string; data: Partial<CompanyCreateInput> }
> => {
  const qc = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation<
    Company,
    Error,
    { id: string; data: Partial<CompanyCreateInput> }
  >({
    mutationFn: ({ id, data }) => updateCompany(id, data),
    onSuccess: () => {
      toast.success(t('common.success'));
      void qc.invalidateQueries({ queryKey: [...ADMIN_KEY, 'companies'] });
    },
    onError: (error) => toast.error(t('common.error'), error.message),
  });
};

export const useSuspendCompany = (): UseMutationResult<
  void,
  Error,
  { id: string; reason: string }
> => {
  const qc = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation<void, Error, { id: string; reason: string }>({
    mutationFn: ({ id, reason }) => suspendCompany(id, reason),
    onSuccess: () => {
      toast.info(t('companies.suspended'));
      void qc.invalidateQueries({ queryKey: [...ADMIN_KEY, 'companies'] });
    },
    onError: (error) => toast.error(t('common.error'), error.message),
  });
};

export const useReactivateCompany = (): UseMutationResult<void, Error, string> => {
  const qc = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation<void, Error, string>({
    mutationFn: (id) => reactivateCompany(id),
    onSuccess: () => {
      toast.success(t('common.success'));
      void qc.invalidateQueries({ queryKey: [...ADMIN_KEY, 'companies'] });
    },
    onError: (error) => toast.error(t('common.error'), error.message),
  });
};

export const useImpersonateUser = (): UseMutationResult<
  ImpersonationToken,
  Error,
  string
> => {
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation<ImpersonationToken, Error, string>({
    mutationFn: (userId) => impersonateUser(userId),
    onSuccess: () => toast.info(t('usersAdmin.impersonate')),
    onError: (error) => toast.error(t('common.error'), error.message),
  });
};

export const useAllUsers = (
  params: ListParams = {}
): UseQueryResult<PaginatedResponse<AdminUser>, Error> =>
  useQuery<PaginatedResponse<AdminUser>, Error>({
    queryKey: [...ADMIN_KEY, 'users', params],
    queryFn: () => listAllUsers(params),
    staleTime: 60_000,
  });

export const useAdminUserDetail = (
  id: string | null | undefined
): UseQueryResult<AdminUser, Error> =>
  useQuery<AdminUser, Error>({
    queryKey: [...ADMIN_KEY, 'user', id],
    queryFn: () => getAdminUser(id as string),
    enabled: !!id,
    staleTime: 60_000,
  });

export const useCreateAdminUser = (): UseMutationResult<
  AdminUser,
  Error,
  AdminUserCreateInput
> => {
  const qc = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation<AdminUser, Error, AdminUserCreateInput>({
    mutationFn: (data) => createAdminUser(data),
    onSuccess: () => {
      toast.success(t('common.success'));
      void qc.invalidateQueries({ queryKey: [...ADMIN_KEY, 'users'] });
    },
    onError: (error) => toast.error(t('common.error'), error.message),
  });
};

export const useResetPassword = (): UseMutationResult<void, Error, string> => {
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation<void, Error, string>({
    mutationFn: (id) => resetUserPassword(id),
    onSuccess: () => toast.success(t('usersAdmin.resetPassword')),
    onError: (error) => toast.error(t('common.error'), error.message),
  });
};

export const useDeactivateUser = (): UseMutationResult<void, Error, string> => {
  const qc = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation<void, Error, string>({
    mutationFn: (id) => deactivateUser(id),
    onSuccess: () => {
      toast.info(t('usersAdmin.deactivate'));
      void qc.invalidateQueries({ queryKey: [...ADMIN_KEY, 'users'] });
    },
    onError: (error) => toast.error(t('common.error'), error.message),
  });
};

export const useFeatureFlags = (
  companyId: string | null = null
): UseQueryResult<FeatureFlag[], Error> =>
  useQuery<FeatureFlag[], Error>({
    queryKey: [...ADMIN_KEY, 'flags', companyId],
    queryFn: () => getFeatureFlags(companyId ?? undefined),
    staleTime: 60_000,
  });

export const useUpdateFeatureFlag = (): UseMutationResult<
  void,
  Error,
  { companyId: string | null; flagKey: string; enabled: boolean }
> => {
  const qc = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation<
    void,
    Error,
    { companyId: string | null; flagKey: string; enabled: boolean }
  >({
    mutationFn: ({ companyId, flagKey, enabled }) =>
      updateFeatureFlag(companyId, flagKey, enabled),
    onSuccess: () => {
      toast.success(t('featureFlags.saveChanges'));
      void qc.invalidateQueries({ queryKey: [...ADMIN_KEY, 'flags'] });
    },
    onError: (error) => toast.error(t('common.error'), error.message),
  });
};

export const usePlans = (): UseQueryResult<Plan[], Error> =>
  useQuery<Plan[], Error>({
    queryKey: [...ADMIN_KEY, 'plans'],
    queryFn: () => getPlans(),
    staleTime: 60_000,
  });

export const useCreatePlan = (): UseMutationResult<
  Plan,
  Error,
  Omit<Plan, 'id' | 'companiesCount'>
> => {
  const qc = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation<Plan, Error, Omit<Plan, 'id' | 'companiesCount'>>({
    mutationFn: (data) => createPlan(data),
    onSuccess: () => {
      toast.success(t('common.success'));
      void qc.invalidateQueries({ queryKey: [...ADMIN_KEY, 'plans'] });
    },
    onError: (error) => toast.error(t('common.error'), error.message),
  });
};

export const useUpdatePlan = (): UseMutationResult<
  Plan,
  Error,
  { id: string; data: Partial<Plan> }
> => {
  const qc = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation<Plan, Error, { id: string; data: Partial<Plan> }>({
    mutationFn: ({ id, data }) => updatePlan(id, data),
    onSuccess: () => {
      toast.success(t('common.success'));
      void qc.invalidateQueries({ queryKey: [...ADMIN_KEY, 'plans'] });
    },
    onError: (error) => toast.error(t('common.error'), error.message),
  });
};

export const useAuditLog = (
  params: ListParams = {}
): UseQueryResult<PaginatedResponse<AuditLogEntry>, Error> =>
  useQuery<PaginatedResponse<AuditLogEntry>, Error>({
    queryKey: [...ADMIN_KEY, 'audit', params],
    queryFn: () => getPlatformAuditLog(params),
    staleTime: 30_000,
  });

export const useSystemStats = (): UseQueryResult<SystemStats, Error> =>
  useQuery<SystemStats, Error>({
    queryKey: [...ADMIN_KEY, 'stats'],
    queryFn: () => getSystemStats(),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

export const useRetentionPolicies = (): UseQueryResult<RetentionPolicy[], Error> =>
  useQuery<RetentionPolicy[], Error>({
    queryKey: [...ADMIN_KEY, 'retention'],
    queryFn: () => listRetentionPolicies(),
    staleTime: 60_000,
  });

export const useCreateRetentionPolicy = (): UseMutationResult<
  RetentionPolicy,
  Error,
  RetentionPolicyInput
> => {
  const qc = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation<RetentionPolicy, Error, RetentionPolicyInput>({
    mutationFn: (data) => createRetentionPolicy(data),
    onSuccess: () => {
      toast.success(t('common.success'));
      void qc.invalidateQueries({ queryKey: [...ADMIN_KEY, 'retention'] });
    },
    onError: (error) => toast.error(t('common.error'), error.message),
  });
};

export const useIPRules = (
  companyId: string | null = null
): UseQueryResult<IPRule[], Error> =>
  useQuery<IPRule[], Error>({
    queryKey: [...ADMIN_KEY, 'ipRules', companyId],
    queryFn: () => listIPAllowlistRules(companyId ?? undefined),
    staleTime: 60_000,
  });

export const useCreateIPRule = (): UseMutationResult<IPRule, Error, IPRuleInput> => {
  const qc = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation<IPRule, Error, IPRuleInput>({
    mutationFn: (data) => createIPRule(data),
    onSuccess: () => {
      toast.success(t('common.success'));
      void qc.invalidateQueries({ queryKey: [...ADMIN_KEY, 'ipRules'] });
    },
    onError: (error) => toast.error(t('common.error'), error.message),
  });
};

export const useSCIMTokens = (
  companyId: string | null = null
): UseQueryResult<SCIMToken[], Error> =>
  useQuery<SCIMToken[], Error>({
    queryKey: [...ADMIN_KEY, 'scim', companyId],
    queryFn: () => listSCIMTokens(companyId ?? undefined),
    staleTime: 60_000,
  });

export const useCreateSCIMToken = (): UseMutationResult<
  SCIMToken & { fullToken: string },
  Error,
  SCIMTokenInput
> => {
  const qc = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation<
    SCIMToken & { fullToken: string },
    Error,
    SCIMTokenInput
  >({
    mutationFn: (data) => createSCIMToken(data),
    onSuccess: () => {
      toast.success(t('common.success'));
      void qc.invalidateQueries({ queryKey: [...ADMIN_KEY, 'scim'] });
    },
    onError: (error) => toast.error(t('common.error'), error.message),
  });
};

export const useRevokeSCIMToken = (): UseMutationResult<void, Error, string> => {
  const qc = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation<void, Error, string>({
    mutationFn: (id) => revokeSCIMToken(id),
    onSuccess: () => {
      toast.info(t('common.success'));
      void qc.invalidateQueries({ queryKey: [...ADMIN_KEY, 'scim'] });
    },
    onError: (error) => toast.error(t('common.error'), error.message),
  });
};

export const useComplianceExports = (): UseQueryResult<ComplianceExport[], Error> =>
  useQuery<ComplianceExport[], Error>({
    queryKey: [...ADMIN_KEY, 'compliance'],
    queryFn: () => getComplianceExports(),
    staleTime: 60_000,
  });

export const useCreateComplianceExport = (): UseMutationResult<
  ComplianceExport,
  Error,
  ComplianceExportInput
> => {
  const qc = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation<ComplianceExport, Error, ComplianceExportInput>({
    mutationFn: (data) => createComplianceExport(data),
    onSuccess: () => {
      toast.success(t('common.success'));
      void qc.invalidateQueries({ queryKey: [...ADMIN_KEY, 'compliance'] });
    },
    onError: (error) => toast.error(t('common.error'), error.message),
  });
};

export const useSendSystemNotification = (): UseMutationResult<
  { id: string; deliveredCount: number },
  Error,
  SystemNotificationInput
> => {
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation<
    { id: string; deliveredCount: number },
    Error,
    SystemNotificationInput
  >({
    mutationFn: (data) => sendSystemNotification(data),
    onSuccess: () => toast.success(t('common.success')),
    onError: (error) => toast.error(t('common.error'), error.message),
  });
};
