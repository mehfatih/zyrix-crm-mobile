/**
 * Deals resource module — same split between live axios calls and
 * mock fallback as `customers.ts`.
 */

import {
  DEAL_PIPELINE,
  getMockDeals,
  type DealStage,
  type MockDeal,
} from './mockData';
import { ENDPOINTS } from './endpoints';
import { apiGet, apiPatch, apiPost } from './client';
import type { ListParams, PaginatedResponse } from './types';

export type Deal = MockDeal;
export type { DealStage } from './mockData';
export { DEAL_PIPELINE } from './mockData';

export interface DealCreateInput {
  title: string;
  customerId: string;
  customerName: string;
  value: number;
  stage?: DealStage;
  probability?: number;
  expectedCloseDate: string;
  assignedTo: string;
  assignedToName: string;
  notes?: string;
}

export type DealUpdateInput = Partial<DealCreateInput>;

const USE_MOCKS = true;

const simulateLatency = async (): Promise<void> => {
  if (!USE_MOCKS) return;
  await new Promise((resolve) => setTimeout(resolve, 200));
};

const applyFilters = (items: Deal[], params: ListParams): Deal[] => {
  let filtered = items;
  const needle = params.search?.trim().toLowerCase();
  if (needle) {
    filtered = filtered.filter(
      (d) =>
        d.title.toLowerCase().includes(needle) ||
        d.customerName.toLowerCase().includes(needle)
    );
  }
  const filters = params.filters ?? {};
  const stage = filters.stage;
  if (typeof stage === 'string' && stage) {
    filtered = filtered.filter((d) => d.stage === stage);
  }
  const minValue = filters.minValue;
  if (typeof minValue === 'number') {
    filtered = filtered.filter((d) => d.value >= minValue);
  }
  const maxValue = filters.maxValue;
  if (typeof maxValue === 'number') {
    filtered = filtered.filter((d) => d.value <= maxValue);
  }
  return filtered;
};

export const listDeals = async (
  params: ListParams = {}
): Promise<PaginatedResponse<Deal>> => {
  if (USE_MOCKS) {
    await simulateLatency();
    const all = applyFilters(getMockDeals(), params);
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
  return apiGet<PaginatedResponse<Deal>>(ENDPOINTS.deals.LIST, { params });
};

export const getDeal = async (id: string): Promise<Deal> => {
  if (USE_MOCKS) {
    await simulateLatency();
    const found = getMockDeals().find((d) => d.id === id);
    if (!found) throw new Error(`Deal ${id} not found`);
    return found;
  }
  return apiGet<Deal>(ENDPOINTS.deals.GET(id));
};

export const createDeal = async (data: DealCreateInput): Promise<Deal> => {
  if (USE_MOCKS) {
    await simulateLatency();
    const now = new Date().toISOString();
    return {
      id: `deal_${Math.random().toString(36).slice(2, 8)}`,
      title: data.title,
      customerId: data.customerId,
      customerName: data.customerName,
      value: data.value,
      stage: data.stage ?? 'lead',
      probability: data.probability ?? 15,
      expectedCloseDate: data.expectedCloseDate,
      assignedTo: data.assignedTo,
      assignedToName: data.assignedToName,
      notes: data.notes,
      createdAt: now,
    };
  }
  return apiPost<Deal>(ENDPOINTS.deals.CREATE, data);
};

export const updateDeal = async (
  id: string,
  data: DealUpdateInput
): Promise<Deal> => {
  if (USE_MOCKS) {
    await simulateLatency();
    const found = await getDeal(id);
    return { ...found, ...data };
  }
  return apiPatch<Deal>(ENDPOINTS.deals.UPDATE(id), data);
};

export const moveDealStage = async (
  id: string,
  stage: DealStage
): Promise<Deal> => {
  if (USE_MOCKS) {
    await simulateLatency();
    const found = await getDeal(id);
    return { ...found, stage };
  }
  return apiPost<Deal>(ENDPOINTS.deals.MOVE_STAGE(id), { stage });
};

export const closeDeal = async (
  id: string,
  status: 'won' | 'lost'
): Promise<Deal> => {
  if (USE_MOCKS) {
    await simulateLatency();
    const found = await getDeal(id);
    return {
      ...found,
      stage: status,
      closedAt: new Date().toISOString(),
      closedStatus: status,
      probability: status === 'won' ? 100 : 0,
    };
  }
  return apiPost<Deal>(ENDPOINTS.deals.CLOSE(id), { status });
};

export const groupDealsByStage = (
  deals: readonly Deal[]
): Record<DealStage, Deal[]> => {
  const base: Record<DealStage, Deal[]> = {
    lead: [],
    qualified: [],
    proposal: [],
    negotiation: [],
    won: [],
    lost: [],
  };
  for (const deal of deals) {
    base[deal.stage].push(deal);
  }
  return base;
};

export const PIPELINE_STAGES: readonly DealStage[] = DEAL_PIPELINE;
