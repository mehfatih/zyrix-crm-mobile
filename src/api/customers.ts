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
import { apiDelete, apiGet, apiPatch, apiPost } from './client';
import type { ListParams, PaginatedResponse } from './types';
import type { CountryCode } from '../types/country';

export type Customer = MockCustomer;

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

const USE_MOCKS = true;

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
  return apiGet<PaginatedResponse<Customer>>(ENDPOINTS.customers.LIST, {
    params,
  });
};

export const getCustomer = async (id: string): Promise<Customer> => {
  if (USE_MOCKS) {
    await simulateLatency();
    const found = getMockCustomers().find((c) => c.id === id);
    if (!found) throw new Error(`Customer ${id} not found`);
    return found;
  }
  return apiGet<Customer>(ENDPOINTS.customers.GET(id));
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
  return apiPost<Customer>(ENDPOINTS.customers.CREATE, data);
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
  return apiPatch<Customer>(ENDPOINTS.customers.UPDATE(id), data);
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
  return apiGet<Customer[]>(ENDPOINTS.customers.SEARCH, {
    params: { q: query },
  });
};
