/**
 * Contracts resource module.
 */

import { getMockContracts, type MockContract } from './mockData';
import { ENDPOINTS } from './endpoints';
import { apiGetData, apiPatchData, apiPostData } from './client';
import type { ListParams, PaginatedResponse } from './types';

export type Contract = MockContract;

export interface ContractCreateInput {
  customerId: string;
  customerName: string;
  type: Contract['type'];
  amount: number;
  startDate: string;
  endDate: string;
  autoRenew?: boolean;
}

import { USE_MOCKS } from '../config/runtime';

// ── Backend shape + mapping ─────────────────────────────────────────────────
// Real /api/contracts: {items,pagination}; `value` is a Decimal string; status
// has more states than the mobile type. Renew/terminate are PATCHes (no
// dedicated routes exist on the backend).
interface BackendContract {
  id: string;
  contractNumber?: string | null;
  number?: string | null;
  title?: string | null;
  customerId?: string | null;
  customer?: { id: string; fullName?: string | null } | null;
  type?: string | null;
  value?: number | string | null;
  startDate?: string | null;
  endDate?: string | null;
  renewalDate?: string | null;
  autoRenew?: boolean | null;
  status?: string | null;
}
interface BackendContractList {
  items: BackendContract[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

const mapContractStatus = (s?: string | null): Contract['status'] => {
  switch (s) {
    case 'active':
    case 'signed':
      return 'active';
    case 'expired':
      return 'expired';
    case 'terminated':
      return 'terminated';
    default:
      return 'draft';
  }
};

const CONTRACT_TYPES: readonly Contract['type'][] = [
  'service',
  'subscription',
  'one_time',
];

const mapContract = (b: BackendContract): Contract => ({
  id: b.id,
  contractNumber: b.contractNumber ?? b.number ?? `C-${b.id.slice(0, 6)}`,
  customerId: b.customer?.id ?? b.customerId ?? '',
  customerName: b.customer?.fullName ?? b.title ?? '',
  type: (CONTRACT_TYPES as readonly string[]).includes(b.type ?? '')
    ? (b.type as Contract['type'])
    : 'service',
  amount: Number(b.value ?? 0) || 0,
  startDate: b.startDate ?? '',
  endDate: b.endDate ?? '',
  autoRenew: b.autoRenew ?? Boolean(b.renewalDate),
  status: mapContractStatus(b.status),
});

const sleep = async (): Promise<void> => {
  if (USE_MOCKS) await new Promise((r) => setTimeout(r, 200));
};

export const listContracts = async (
  params: ListParams = {}
): Promise<PaginatedResponse<Contract>> => {
  if (USE_MOCKS) {
    await sleep();
    const all = getMockContracts();
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
  const res = await apiGetData<BackendContractList>(ENDPOINTS.contracts.LIST, {
    params: {
      page: params.page ?? 1,
      limit: params.pageSize ?? 20,
      ...(params.search ? { search: params.search } : {}),
    },
  });
  return {
    items: res.items.map(mapContract),
    total: res.pagination.total,
    page: res.pagination.page,
    pageSize: res.pagination.limit,
    hasMore: res.pagination.page < res.pagination.totalPages,
  };
};

export const getContract = async (id: string): Promise<Contract> => {
  if (USE_MOCKS) {
    await sleep();
    const found = getMockContracts().find((c) => c.id === id);
    if (!found) throw new Error(`Contract ${id} not found`);
    return found;
  }
  return mapContract(
    await apiGetData<BackendContract>(ENDPOINTS.contracts.GET(id))
  );
};

export const createContract = async (
  data: ContractCreateInput
): Promise<Contract> => {
  if (USE_MOCKS) {
    await sleep();
    return {
      id: `con_${Math.random().toString(36).slice(2, 8)}`,
      contractNumber: `C-2026-${String(Date.now()).slice(-4)}`,
      customerId: data.customerId,
      customerName: data.customerName,
      type: data.type,
      amount: data.amount,
      startDate: data.startDate,
      endDate: data.endDate,
      autoRenew: data.autoRenew ?? false,
      status: 'draft',
    };
  }
  return mapContract(
    await apiPostData<BackendContract>(ENDPOINTS.contracts.CREATE, {
      customerId: data.customerId,
      title: data.customerName ? `Contract — ${data.customerName}` : 'Contract',
      value: data.amount,
      startDate: data.startDate,
      endDate: data.endDate,
    })
  );
};

export const renewContract = async (id: string): Promise<Contract> => {
  if (USE_MOCKS) {
    await sleep();
    const found = await getContract(id);
    return { ...found, status: 'active' };
  }
  // No /renew route — renewal is a PATCH setting the active status.
  return mapContract(
    await apiPatchData<BackendContract>(ENDPOINTS.contracts.GET(id), {
      status: 'active',
    })
  );
};

export const terminateContract = async (id: string): Promise<Contract> => {
  if (USE_MOCKS) {
    await sleep();
    const found = await getContract(id);
    return { ...found, status: 'terminated' };
  }
  // No /terminate route — termination is a PATCH setting the terminated status.
  return mapContract(
    await apiPatchData<BackendContract>(ENDPOINTS.contracts.GET(id), {
      status: 'terminated',
    })
  );
};
