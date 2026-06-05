/**
 * Customer resource module. Talks to the backend via the shared axios
 * client when `EXPO_PUBLIC_API_URL` is reachable; until Sprint 4's
 * backend is live we fall back to the deterministic mock dataset in
 * `mockData.ts` so the UI can be exercised end-to-end.
 */

import {
  getMockCustomers,
  type MockCustomer,
} from './mockData';
import { ENDPOINTS } from './endpoints';
import { apiDelete, apiGetData, apiPatchData, apiPostData } from './client';
import type { ListParams, PaginatedResponse } from './types';
import type { CountryCode } from '../types/country';

export type Customer = MockCustomer;

// ── Backend shape + mapping ─────────────────────────────────────────────────
// The real /api/customers payload differs from the mock shape: `fullName` (not
// `name`), `companyName`, `lifetimeValue`, and no health/tags/avatar fields.
// We map to the mobile `Customer` type, defaulting fields the backend doesn't
// provide (healthScore, tags) rather than inventing values.
interface BackendCustomer {
  id: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  companyName?: string | null;
  country?: string | null;
  taxId?: string | null;
  address?: string | null;
  lifetimeValue?: number | string | null;
  createdAt?: string | null;
  lastContactAt?: string | null;
}

interface BackendList {
  customers: BackendCustomer[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

const initialsOf = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('') || 'NA';

const mapCustomer = (b: BackendCustomer): Customer => ({
  id: b.id,
  name: b.fullName,
  email: b.email ?? '',
  phone: b.phone ?? '',
  company: b.companyName ?? '',
  country: (b.country ?? 'SA') as CountryCode,
  taxId: b.taxId ?? undefined,
  address: b.address ?? undefined,
  totalRevenue: Number(b.lifetimeValue ?? 0) || 0,
  healthScore: 0,
  tags: [],
  createdAt: b.createdAt ?? '',
  lastContactAt: b.lastContactAt ?? b.createdAt ?? '',
  avatarInitials: initialsOf(b.fullName),
});

const toQuery = (params: ListParams): Record<string, unknown> => {
  const status = params.filters?.status;
  return {
    page: params.page ?? 1,
    limit: params.pageSize ?? 20,
    ...(params.search ? { search: params.search } : {}),
    ...(typeof status === 'string' && status ? { status } : {}),
  };
};

const toCreateBody = (data: CustomerCreateInput): Record<string, unknown> => ({
  fullName: data.name,
  email: data.email || undefined,
  phone: data.phone || undefined,
  companyName: data.company || undefined,
  country: data.country,
  address: data.address || undefined,
});

export interface CustomerCreateInput {
  name: string;
  email: string;
  phone: string;
  company?: string;
  country: CountryCode;
  taxId?: string;
  address?: string;
  tags?: string[];
}

export type CustomerUpdateInput = Partial<CustomerCreateInput>;

import { USE_MOCKS } from '../config/runtime';

const simulateLatency = async (): Promise<void> => {
  if (!USE_MOCKS) return;
  await new Promise((resolve) => setTimeout(resolve, 200));
};

const applyListFilters = (
  items: Customer[],
  params: ListParams
): Customer[] => {
  const needle = params.search?.trim().toLowerCase();
  let filtered = items;
  if (needle) {
    filtered = filtered.filter(
      (c) =>
        c.name.toLowerCase().includes(needle) ||
        c.email.toLowerCase().includes(needle) ||
        c.company.toLowerCase().includes(needle)
    );
  }
  const filters = params.filters ?? {};
  const country = filters.country;
  if (typeof country === 'string' && country) {
    filtered = filtered.filter((c) => c.country === country);
  }
  const tag = filters.tag;
  if (typeof tag === 'string' && tag) {
    filtered = filtered.filter((c) => c.tags.includes(tag));
  }
  const healthMin = filters.healthMin;
  if (typeof healthMin === 'number') {
    filtered = filtered.filter((c) => c.healthScore >= healthMin);
  }
  return filtered;
};

export const listCustomers = async (
  params: ListParams = {}
): Promise<PaginatedResponse<Customer>> => {
  if (USE_MOCKS) {
    await simulateLatency();
    const all = applyListFilters(getMockCustomers(), params);
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;
    const start = (page - 1) * pageSize;
    const items = all.slice(start, start + pageSize);
    return {
      items,
      total: all.length,
      page,
      pageSize,
      hasMore: start + pageSize < all.length,
    };
  }
  const res = await apiGetData<BackendList>(ENDPOINTS.customers.LIST, {
    params: toQuery(params),
  });
  return {
    items: res.customers.map(mapCustomer),
    total: res.pagination.total,
    page: res.pagination.page,
    pageSize: res.pagination.limit,
    hasMore: res.pagination.page < res.pagination.totalPages,
  };
};

export const getCustomer = async (id: string): Promise<Customer> => {
  if (USE_MOCKS) {
    await simulateLatency();
    const found = getMockCustomers().find((c) => c.id === id);
    if (!found) throw new Error(`Customer ${id} not found`);
    return found;
  }
  return mapCustomer(
    await apiGetData<BackendCustomer>(ENDPOINTS.customers.GET(id))
  );
};

export const createCustomer = async (
  data: CustomerCreateInput
): Promise<Customer> => {
  if (USE_MOCKS) {
    await simulateLatency();
    const now = new Date().toISOString();
    const initials = data.name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w.charAt(0).toUpperCase())
      .join('');
    const created: Customer = {
      id: `cus_${Math.random().toString(36).slice(2, 8)}`,
      name: data.name,
      email: data.email,
      phone: data.phone,
      company: data.company ?? data.name,
      country: data.country,
      taxId: data.taxId,
      address: data.address,
      totalRevenue: 0,
      healthScore: 70,
      tags: data.tags ?? [],
      createdAt: now,
      lastContactAt: now,
      avatarInitials: initials || 'NA',
    };
    return created;
  }
  return mapCustomer(
    await apiPostData<BackendCustomer>(
      ENDPOINTS.customers.CREATE,
      toCreateBody(data)
    )
  );
};

export const updateCustomer = async (
  id: string,
  data: CustomerUpdateInput
): Promise<Customer> => {
  if (USE_MOCKS) {
    await simulateLatency();
    const found = await getCustomer(id);
    return { ...found, ...data };
  }
  const body: Record<string, unknown> = {};
  if (data.name !== undefined) body.fullName = data.name;
  if (data.email !== undefined) body.email = data.email;
  if (data.phone !== undefined) body.phone = data.phone;
  if (data.company !== undefined) body.companyName = data.company;
  if (data.country !== undefined) body.country = data.country;
  if (data.address !== undefined) body.address = data.address;
  return mapCustomer(
    await apiPatchData<BackendCustomer>(ENDPOINTS.customers.UPDATE(id), body)
  );
};

export const deleteCustomer = async (id: string): Promise<void> => {
  if (USE_MOCKS) {
    await simulateLatency();
    return;
  }
  await apiDelete<void>(ENDPOINTS.customers.DELETE(id));
};

export const searchCustomers = async (query: string): Promise<Customer[]> => {
  if (USE_MOCKS) {
    await simulateLatency();
    const needle = query.trim().toLowerCase();
    if (!needle) return getMockCustomers();
    return getMockCustomers().filter(
      (c) =>
        c.name.toLowerCase().includes(needle) ||
        c.email.toLowerCase().includes(needle) ||
        c.company.toLowerCase().includes(needle)
    );
  }
  // The backend has no dedicated search route — the list endpoint takes a
  // `search` query param.
  const res = await apiGetData<BackendList>(ENDPOINTS.customers.LIST, {
    params: { search: query, limit: 20 },
  });
  return res.customers.map(mapCustomer);
};
