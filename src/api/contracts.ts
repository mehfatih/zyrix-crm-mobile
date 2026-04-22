/**
 * Contracts resource module.
 */

import { getMockContracts, type MockContract } from './mockData';
import { ENDPOINTS } from './endpoints';
import { apiGet, apiPost } from './client';
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

const USE_MOCKS = true;

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
  return apiGet<PaginatedResponse<Contract>>(ENDPOINTS.contracts.LIST, {
    params,
  });
};

export const getContract = async (id: string): Promise<Contract> => {
  if (USE_MOCKS) {
    await sleep();
    const found = getMockContracts().find((c) => c.id === id);
    if (!found) throw new Error(`Contract ${id} not found`);
    return found;
  }
  return apiGet<Contract>(ENDPOINTS.contracts.GET(id));
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
  return apiPost<Contract>(ENDPOINTS.contracts.CREATE, data);
};

export const renewContract = async (id: string): Promise<Contract> => {
  if (USE_MOCKS) {
    await sleep();
    const found = await getContract(id);
    return { ...found, status: 'active' };
  }
  return apiPost<Contract>(ENDPOINTS.contracts.RENEW(id));
};

export const terminateContract = async (id: string): Promise<Contract> => {
  if (USE_MOCKS) {
    await sleep();
    const found = await getContract(id);
    return { ...found, status: 'terminated' };
  }
  return apiPost<Contract>(ENDPOINTS.contracts.TERMINATE(id));
};
