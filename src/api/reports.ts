/**
 * Reports resource module — the "read" side that powers the dashboard
 * and the forecast screens. Returns aggregated numbers derived from
 * the same deterministic mocks so the UI stays coherent with the raw
 * customer/deal lists.
 */

import {
  DEALS_BY_STAGE_COLORS,
  REVENUE_BY_MONTH,
  getMockActivities,
  getMockCustomers,
  getMockDeals,
  type DealStage,
  type MockActivity,
} from './mockData';
import { ENDPOINTS } from './endpoints';
import { apiGet } from './client';

export interface DashboardStats {
  customersCount: number;
  activeDealsCount: number;
  monthRevenue: number;
  pendingTasksCount: number;
  revenueByMonth: { month: string; amount: number }[];
  dealsByStage: { stage: DealStage; count: number; value: number; color: string }[];
  recentActivities: MockActivity[];
  growth: {
    deals: number;
    revenue: number;
  };
}

export interface SalesReport {
  totalRevenue: number;
  dealsWon: number;
  averageDealSize: number;
  winRate: number;
  byRep: { rep: string; revenue: number; deals: number }[];
}

export interface CustomerReport {
  totalCustomers: number;
  newCustomers: number;
  churnedCustomers: number;
  averageHealthScore: number;
  topCustomers: { name: string; revenue: number }[];
}

export interface CashFlowReport {
  inflow: number;
  outflow: number;
  net: number;
  byMonth: { month: string; inflow: number; outflow: number }[];
}

export interface DateRange {
  from: string;
  to: string;
}

const USE_MOCKS = true;

const sleep = async (): Promise<void> => {
  if (USE_MOCKS) await new Promise((r) => setTimeout(r, 220));
};

export const getDashboardStats = async (): Promise<DashboardStats> => {
  if (USE_MOCKS) {
    await sleep();
    const customers = getMockCustomers();
    const deals = getMockDeals();

    const activeDeals = deals.filter(
      (d) => d.stage !== 'won' && d.stage !== 'lost'
    );

    const byStageMap = new Map<
      DealStage,
      { stage: DealStage; count: number; value: number; color: string }
    >();
    for (const deal of deals) {
      const prev = byStageMap.get(deal.stage);
      if (prev) {
        prev.count += 1;
        prev.value += deal.value;
      } else {
        byStageMap.set(deal.stage, {
          stage: deal.stage,
          count: 1,
          value: deal.value,
          color: DEALS_BY_STAGE_COLORS[deal.stage],
        });
      }
    }

    const months = [...REVENUE_BY_MONTH];
    const last = months[months.length - 1]?.amount ?? 0;
    const prev = months[months.length - 2]?.amount ?? 0;
    const revenueGrowth = prev > 0 ? Math.round(((last - prev) / prev) * 100) : 0;

    return {
      customersCount: customers.length,
      activeDealsCount: activeDeals.length,
      monthRevenue: last,
      pendingTasksCount: 7,
      revenueByMonth: months,
      dealsByStage: Array.from(byStageMap.values()),
      recentActivities: getMockActivities().slice(0, 10),
      growth: {
        deals: 12,
        revenue: revenueGrowth,
      },
    };
  }
  return apiGet<DashboardStats>(ENDPOINTS.reports.DASHBOARD);
};

export const getSalesReport = async (
  dateRange?: DateRange
): Promise<SalesReport> => {
  if (USE_MOCKS) {
    await sleep();
    const deals = getMockDeals().filter((d) => d.closedStatus === 'won');
    const totalRevenue = deals.reduce((sum, d) => sum + d.value, 0);
    return {
      totalRevenue,
      dealsWon: deals.length,
      averageDealSize: deals.length ? Math.round(totalRevenue / deals.length) : 0,
      winRate: 62,
      byRep: [
        { rep: 'Fatima H.', revenue: 187500, deals: 12 },
        { rep: 'Omar K.', revenue: 142200, deals: 9 },
        { rep: 'Selin A.', revenue: 210800, deals: 14 },
      ],
    };
  }
  return apiGet<SalesReport>(ENDPOINTS.reports.SALES, { params: dateRange });
};

export const getCustomerReport = async (
  dateRange?: DateRange
): Promise<CustomerReport> => {
  if (USE_MOCKS) {
    await sleep();
    const customers = getMockCustomers();
    const avg = Math.round(
      customers.reduce((sum, c) => sum + c.healthScore, 0) / customers.length
    );
    return {
      totalCustomers: customers.length,
      newCustomers: 3,
      churnedCustomers: 1,
      averageHealthScore: avg,
      topCustomers: customers
        .slice()
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, 5)
        .map((c) => ({ name: c.name, revenue: c.totalRevenue })),
    };
  }
  return apiGet<CustomerReport>(ENDPOINTS.reports.CUSTOMERS, {
    params: dateRange,
  });
};

export const getCashFlowReport = async (
  dateRange?: DateRange
): Promise<CashFlowReport> => {
  if (USE_MOCKS) {
    await sleep();
    const months = REVENUE_BY_MONTH.map((m) => ({
      month: m.month,
      inflow: m.amount,
      outflow: Math.round(m.amount * 0.62),
    }));
    const inflow = months.reduce((sum, m) => sum + m.inflow, 0);
    const outflow = months.reduce((sum, m) => sum + m.outflow, 0);
    return { inflow, outflow, net: inflow - outflow, byMonth: months };
  }
  return apiGet<CashFlowReport>(ENDPOINTS.reports.CASH_FLOW, {
    params: dateRange,
  });
};
