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
import { apiGetData, apiPatchData, apiPostData } from './client';
import type { ListParams, PaginatedResponse } from './types';

export type Deal = MockDeal;
export type { DealStage } from './mockData';
export { DEAL_PIPELINE } from './mockData';

// ── Backend shape + mapping ─────────────────────────────────────────────────
// Real /api/deals: money is `value`, customer/owner are nested objects, and
// there are no /stage or /close routes — stage changes are a PATCH on the deal.
interface BackendDeal {
  id: string;
  title: string;
  value?: number | string | null;
  stage?: string | null;
  probability?: number | null;
  expectedCloseDate?: string | null;
  description?: string | null;
  createdAt?: string | null;
  closedAt?: string | null;
  customerId?: string | null;
  customer?: { id: string; fullName?: string; companyName?: string | null } | null;
  owner?: { id: string; fullName?: string } | null;
}

interface BackendDealList {
  deals: BackendDeal[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

const VALID_STAGES: readonly DealStage[] = [
  'lead',
  'qualified',
  'proposal',
  'negotiation',
  'won',
  'lost',
];

const toStage = (s?: string | null): DealStage =>
  (VALID_STAGES as readonly string[]).includes(s ?? '')
    ? (s as DealStage)
    : 'lead';

const mapDeal = (b: BackendDeal): Deal => {
  const stage = toStage(b.stage);
  return {
    id: b.id,
    title: b.title,
    customerId: b.customer?.id ?? b.customerId ?? '',
    customerName: b.customer?.fullName ?? b.customer?.companyName ?? '',
    value: Number(b.value ?? 0) || 0,
    stage,
    probability: b.probability ?? 0,
    expectedCloseDate: b.expectedCloseDate ?? '',
    assignedTo: b.owner?.id ?? '',
    assignedToName: b.owner?.fullName ?? '',
    notes: b.description ?? undefined,
    createdAt: b.createdAt ?? '',
    closedAt: b.closedAt ?? undefined,
    closedStatus: stage === 'won' || stage === 'lost' ? stage : undefined,
  };
};

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

import { USE_MOCKS } from '../config/runtime';

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
  const status = params.filters?.stage;
  const res = await apiGetData<BackendDealList>(ENDPOINTS.deals.LIST, {
    params: {
      page: params.page ?? 1,
      limit: params.pageSize ?? 20,
      ...(typeof status === 'string' && status ? { stage: status } : {}),
    },
  });
  return {
    items: res.deals.map(mapDeal),
    total: res.pagination.total,
    page: res.pagination.page,
    pageSize: res.pagination.limit,
    hasMore: res.pagination.page < res.pagination.totalPages,
  };
};

export const getDeal = async (id: string): Promise<Deal> => {
  if (USE_MOCKS) {
    await simulateLatency();
    const found = getMockDeals().find((d) => d.id === id);
    if (!found) throw new Error(`Deal ${id} not found`);
    return found;
  }
  return mapDeal(await apiGetData<BackendDeal>(ENDPOINTS.deals.GET(id)));
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
  return mapDeal(
    await apiPostData<BackendDeal>(ENDPOINTS.deals.CREATE, {
      customerId: data.customerId,
      title: data.title,
      value: data.value,
      stage: data.stage,
      probability: data.probability,
      expectedCloseDate: data.expectedCloseDate,
      description: data.notes,
    })
  );
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
  const body: Record<string, unknown> = {};
  if (data.title !== undefined) body.title = data.title;
  if (data.value !== undefined) body.value = data.value;
  if (data.stage !== undefined) body.stage = data.stage;
  if (data.probability !== undefined) body.probability = data.probability;
  if (data.expectedCloseDate !== undefined)
    body.expectedCloseDate = data.expectedCloseDate;
  if (data.notes !== undefined) body.description = data.notes;
  if (data.customerId !== undefined) body.customerId = data.customerId;
  return mapDeal(await apiPatchData<BackendDeal>(ENDPOINTS.deals.UPDATE(id), body));
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
  // No /stage route — a stage change is a PATCH on the deal.
  return mapDeal(
    await apiPatchData<BackendDeal>(ENDPOINTS.deals.UPDATE(id), { stage })
  );
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
  // No /close route — closing is a PATCH that sets the won/lost stage.
  return mapDeal(
    await apiPatchData<BackendDeal>(ENDPOINTS.deals.UPDATE(id), { stage: status })
  );
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
