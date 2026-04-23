/**
 * Admin resource module — wraps the platform-level endpoints used by
 * the super-admin and admin roles. All requests are mock-backed until
 * the backend admin API ships; flip `USE_MOCKS` to route to live
 * endpoints once available.
 */

import {
  MOCK_ADMIN_USERS,
  MOCK_AUDIT_LOG,
  MOCK_COMPANIES,
  MOCK_COMPLIANCE_EXPORTS,
  MOCK_FEATURE_FLAGS,
  MOCK_IP_RULES,
  MOCK_PLANS,
  MOCK_RETENTION_POLICIES,
  MOCK_SCIM_TOKENS,
  MOCK_SYSTEM_STATS,
  buildAdminSummary,
} from './adminMock';
import { ENDPOINTS } from './endpoints';
import { apiDelete, apiGet, apiPatch, apiPost } from './client';
import type { ListParams, PaginatedResponse } from './types';
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

const USE_MOCKS = true;

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const paginate = <T>(items: readonly T[], params: ListParams): PaginatedResponse<T> => {
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
};

export interface CompanyCreateInput {
  name: string;
  ownerEmail: string;
  ownerName: string;
  country: Company['country'];
  plan: Company['plan'];
}

export const listCompanies = async (
  params: ListParams = {}
): Promise<PaginatedResponse<Company>> => {
  if (USE_MOCKS) {
    await sleep(220);
    let items = [...MOCK_COMPANIES];
    const search = params.search?.trim().toLowerCase();
    if (search) {
      items = items.filter(
        (company) =>
          company.name.toLowerCase().includes(search) ||
          company.ownerEmail.toLowerCase().includes(search)
      );
    }
    const status = params.filters?.status;
    if (typeof status === 'string') {
      items = items.filter((company) => company.status === status);
    }
    const plan = params.filters?.plan;
    if (typeof plan === 'string') {
      items = items.filter((company) => company.plan === plan);
    }
    return paginate(items, params);
  }
  return apiGet<PaginatedResponse<Company>>(ENDPOINTS.admin.COMPANIES, {
    params,
  });
};

export const getCompany = async (id: string): Promise<Company> => {
  if (USE_MOCKS) {
    await sleep(180);
    const found = MOCK_COMPANIES.find((company) => company.id === id);
    if (!found) throw new Error(`Company ${id} not found`);
    return found;
  }
  return apiGet<Company>(`${ENDPOINTS.admin.COMPANIES}/${id}`);
};

export const createCompany = async (
  data: CompanyCreateInput
): Promise<Company> => {
  if (USE_MOCKS) {
    await sleep(320);
    const id = `comp_${Math.random().toString(36).slice(2, 8)}`;
    return {
      id,
      name: data.name,
      ownerId: `user_${id}`,
      ownerName: data.ownerName,
      ownerEmail: data.ownerEmail,
      country: data.country,
      plan: data.plan,
      planId: `plan_${data.plan}`,
      status: 'pending',
      usersCount: 1,
      customersCount: 0,
      mrr: 0,
      createdAt: new Date().toISOString(),
    };
  }
  return apiPost<Company>(ENDPOINTS.admin.COMPANIES, data);
};

export const updateCompany = async (
  id: string,
  data: Partial<CompanyCreateInput & { plan: Company['plan'] }>
): Promise<Company> => {
  if (USE_MOCKS) {
    await sleep(220);
    const found = await getCompany(id);
    return { ...found, ...data };
  }
  return apiPatch<Company>(`${ENDPOINTS.admin.COMPANIES}/${id}`, data);
};

export const suspendCompany = async (id: string, reason: string): Promise<void> => {
  if (USE_MOCKS) {
    await sleep(220);
    return;
  }
  await apiPost(`${ENDPOINTS.admin.COMPANIES}/${id}/suspend`, { reason });
};

export const reactivateCompany = async (id: string): Promise<void> => {
  if (USE_MOCKS) {
    await sleep(220);
    return;
  }
  await apiPost(`${ENDPOINTS.admin.COMPANIES}/${id}/reactivate`);
};

export const deleteCompany = async (id: string): Promise<void> => {
  if (USE_MOCKS) {
    await sleep(220);
    return;
  }
  await apiDelete(`${ENDPOINTS.admin.COMPANIES}/${id}`);
};

export const impersonateUser = async (
  userId: string
): Promise<ImpersonationToken> => {
  if (USE_MOCKS) {
    await sleep(220);
    return {
      token: `imp_${Math.random().toString(36).slice(2)}`,
      userId,
      expiresAt: new Date(Date.now() + 30 * 60_000).toISOString(),
    };
  }
  return apiPost<ImpersonationToken>(
    `${ENDPOINTS.admin.USERS}/${userId}/impersonate`
  );
};

export const listAllUsers = async (
  params: ListParams = {}
): Promise<PaginatedResponse<AdminUser>> => {
  if (USE_MOCKS) {
    await sleep(220);
    let items = [...MOCK_ADMIN_USERS];
    const role = params.filters?.role;
    if (typeof role === 'string') {
      items = items.filter((user) => user.role === role);
    }
    const status = params.filters?.status;
    if (typeof status === 'string') {
      items = items.filter((user) => user.status === status);
    }
    const search = params.search?.trim().toLowerCase();
    if (search) {
      items = items.filter(
        (user) =>
          user.name.toLowerCase().includes(search) ||
          user.email.toLowerCase().includes(search)
      );
    }
    return paginate(items, params);
  }
  return apiGet<PaginatedResponse<AdminUser>>(ENDPOINTS.admin.USERS, {
    params,
  });
};

export const getAdminUser = async (id: string): Promise<AdminUser> => {
  if (USE_MOCKS) {
    await sleep(180);
    const found = MOCK_ADMIN_USERS.find((user) => user.id === id);
    if (!found) throw new Error(`User ${id} not found`);
    return found;
  }
  return apiGet<AdminUser>(`${ENDPOINTS.admin.USERS}/${id}`);
};

export interface AdminUserCreateInput {
  name: string;
  email: string;
  role: AdminUser['role'];
  companyId: string | null;
}

export const createAdminUser = async (
  data: AdminUserCreateInput
): Promise<AdminUser> => {
  if (USE_MOCKS) {
    await sleep(280);
    const id = `user_${Math.random().toString(36).slice(2, 8)}`;
    return {
      id,
      name: data.name,
      email: data.email,
      role: data.role,
      companyId: data.companyId,
      companyName: null,
      status: 'active',
      createdAt: new Date().toISOString(),
      avatarInitials: data.name
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join(''),
    };
  }
  return apiPost<AdminUser>(ENDPOINTS.admin.USERS, data);
};

export const resetUserPassword = async (id: string): Promise<void> => {
  if (USE_MOCKS) {
    await sleep(220);
    return;
  }
  await apiPost(`${ENDPOINTS.admin.USERS}/${id}/reset-password`);
};

export const deactivateUser = async (id: string): Promise<void> => {
  if (USE_MOCKS) {
    await sleep(220);
    return;
  }
  await apiPost(`${ENDPOINTS.admin.USERS}/${id}/deactivate`);
};

export const getFeatureFlags = async (
  _companyId?: string
): Promise<FeatureFlag[]> => {
  if (USE_MOCKS) {
    await sleep(180);
    return MOCK_FEATURE_FLAGS.map((flag) => ({ ...flag }));
  }
  return apiGet<FeatureFlag[]>(ENDPOINTS.admin.FEATURE_FLAGS);
};

export const updateFeatureFlag = async (
  _companyId: string | null,
  _flagKey: string,
  _enabled: boolean
): Promise<void> => {
  if (USE_MOCKS) {
    await sleep(180);
    return;
  }
  await apiPatch(`${ENDPOINTS.admin.FEATURE_FLAGS}/${_flagKey}`, {
    enabled: _enabled,
    companyId: _companyId,
  });
};

export const getPlans = async (): Promise<Plan[]> => {
  if (USE_MOCKS) {
    await sleep(160);
    return MOCK_PLANS.map((plan) => ({ ...plan }));
  }
  return apiGet<Plan[]>(ENDPOINTS.admin.PLANS);
};

export const createPlan = async (
  data: Omit<Plan, 'id' | 'companiesCount'>
): Promise<Plan> => {
  if (USE_MOCKS) {
    await sleep(280);
    return {
      id: `plan_${Math.random().toString(36).slice(2, 8)}`,
      companiesCount: 0,
      ...data,
    };
  }
  return apiPost<Plan>(ENDPOINTS.admin.PLANS, data);
};

export const updatePlan = async (
  id: string,
  data: Partial<Plan>
): Promise<Plan> => {
  if (USE_MOCKS) {
    await sleep(220);
    const existing = MOCK_PLANS.find((plan) => plan.id === id);
    if (!existing) throw new Error(`Plan ${id} not found`);
    return { ...existing, ...data };
  }
  return apiPatch<Plan>(`${ENDPOINTS.admin.PLANS}/${id}`, data);
};

export const getPlatformAuditLog = async (
  params: ListParams = {}
): Promise<PaginatedResponse<AuditLogEntry>> => {
  if (USE_MOCKS) {
    await sleep(220);
    let items = [...MOCK_AUDIT_LOG];
    const severity = params.filters?.severity;
    if (typeof severity === 'string') {
      items = items.filter((entry) => entry.severity === severity);
    }
    return paginate(items, params);
  }
  return apiGet<PaginatedResponse<AuditLogEntry>>(ENDPOINTS.admin.AUDIT_LOG, {
    params,
  });
};

export const getSystemStats = async (): Promise<SystemStats> => {
  if (USE_MOCKS) {
    await sleep(220);
    return MOCK_SYSTEM_STATS;
  }
  return apiGet<SystemStats>(`${ENDPOINTS.admin.AUDIT_LOG}/stats`);
};

export const listRetentionPolicies = async (): Promise<RetentionPolicy[]> => {
  if (USE_MOCKS) {
    await sleep(180);
    return MOCK_RETENTION_POLICIES.map((policy) => ({ ...policy }));
  }
  return apiGet<RetentionPolicy[]>(`${ENDPOINTS.admin.AUDIT_LOG}/retention`);
};

export const createRetentionPolicy = async (
  data: RetentionPolicyInput
): Promise<RetentionPolicy> => {
  if (USE_MOCKS) {
    await sleep(220);
    return {
      id: `rp_${Math.random().toString(36).slice(2, 8)}`,
      ...data,
      createdAt: new Date().toISOString(),
    };
  }
  return apiPost<RetentionPolicy>(
    `${ENDPOINTS.admin.AUDIT_LOG}/retention`,
    data
  );
};

export const listIPAllowlistRules = async (
  companyId?: string
): Promise<IPRule[]> => {
  if (USE_MOCKS) {
    await sleep(180);
    if (!companyId) return MOCK_IP_RULES.map((rule) => ({ ...rule }));
    return MOCK_IP_RULES.filter((rule) => rule.companyId === companyId);
  }
  return apiGet<IPRule[]>(`${ENDPOINTS.admin.AUDIT_LOG}/ip-rules`, {
    params: { companyId },
  });
};

export const createIPRule = async (data: IPRuleInput): Promise<IPRule> => {
  if (USE_MOCKS) {
    await sleep(220);
    return {
      id: `ip_${Math.random().toString(36).slice(2, 8)}`,
      ...data,
      createdAt: new Date().toISOString(),
    };
  }
  return apiPost<IPRule>(`${ENDPOINTS.admin.AUDIT_LOG}/ip-rules`, data);
};

export const listSCIMTokens = async (
  companyId?: string
): Promise<SCIMToken[]> => {
  if (USE_MOCKS) {
    await sleep(180);
    if (!companyId) return MOCK_SCIM_TOKENS.map((token) => ({ ...token }));
    return MOCK_SCIM_TOKENS.filter((token) => token.companyId === companyId);
  }
  return apiGet<SCIMToken[]>(`${ENDPOINTS.admin.AUDIT_LOG}/scim`);
};

export const createSCIMToken = async (
  data: SCIMTokenInput
): Promise<SCIMToken & { fullToken: string }> => {
  if (USE_MOCKS) {
    await sleep(280);
    const expiresMs =
      data.expiresInDays === -1
        ? 100 * 365 * 24 * 60 * 60 * 1000
        : data.expiresInDays * 24 * 60 * 60 * 1000;
    return {
      id: `sc_${Math.random().toString(36).slice(2, 8)}`,
      companyId: data.companyId,
      companyName: 'Selected company',
      tokenPreview: 'scim_••••••••' + Math.random().toString(36).slice(2, 6),
      scope: data.scope,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + expiresMs).toISOString(),
      fullToken: `scim_${Math.random().toString(36).slice(2)}_${Date.now()}`,
    };
  }
  return apiPost<SCIMToken & { fullToken: string }>(
    `${ENDPOINTS.admin.AUDIT_LOG}/scim`,
    data
  );
};

export const revokeSCIMToken = async (tokenId: string): Promise<void> => {
  if (USE_MOCKS) {
    await sleep(180);
    return;
  }
  await apiDelete(`${ENDPOINTS.admin.AUDIT_LOG}/scim/${tokenId}`);
};

export const getComplianceExports = async (): Promise<ComplianceExport[]> => {
  if (USE_MOCKS) {
    await sleep(220);
    return MOCK_COMPLIANCE_EXPORTS.map((entry) => ({ ...entry }));
  }
  return apiGet<ComplianceExport[]>(`${ENDPOINTS.admin.AUDIT_LOG}/compliance`);
};

export const createComplianceExport = async (
  data: ComplianceExportInput
): Promise<ComplianceExport> => {
  if (USE_MOCKS) {
    await sleep(280);
    return {
      id: `ce_${Math.random().toString(36).slice(2, 8)}`,
      customerId: data.customerId,
      customerName: 'Selected customer',
      companyId: 'comp_unknown',
      companyName: 'Selected company',
      type: data.type,
      status: 'pending',
      requestedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60_000).toISOString(),
      urgency: data.urgency,
    };
  }
  return apiPost<ComplianceExport>(
    `${ENDPOINTS.admin.AUDIT_LOG}/compliance`,
    data
  );
};

export const getAdminSummary = async (): Promise<AdminSummary> => {
  if (USE_MOCKS) {
    await sleep(260);
    return buildAdminSummary();
  }
  return apiGet<AdminSummary>(`${ENDPOINTS.admin.AUDIT_LOG}/summary`);
};

export const sendSystemNotification = async (
  data: SystemNotificationInput
): Promise<{ id: string; deliveredCount: number }> => {
  if (USE_MOCKS) {
    await sleep(320);
    return { id: `notif_${Date.now()}`, deliveredCount: 1248 };
  }
  return apiPost<{ id: string; deliveredCount: number }>(
    `${ENDPOINTS.admin.AUDIT_LOG}/announcements`,
    data
  );
};
