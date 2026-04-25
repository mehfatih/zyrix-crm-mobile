/**
 * aiRevenueBrain — Revenue Brain forecasting + leakage detection
 * (AI Sprint 3 §10 / Task 6).
 *
 * Pulls active deals + closed history + workspace memory, then derives:
 *   - Expected monthly revenue (probability-weighted pipeline).
 *   - Best / likely / risk scenarios.
 *   - Deals that can close this month (≥60% probability).
 *   - Revenue leakage (deals stuck > 2× workspace baseline for stage).
 *   - Next best revenue actions ranked by impact.
 *   - Target progress (gap vs monthly target).
 *   - Forecast confidence (50 / 65 / 80 based on closed-deal sample size).
 *
 * Following the 5 sacred rules: Gemini access stays server-side. The
 * mobile client mocks the data when `USE_MOCKS` is true (the app
 * flag matches `aiDecisionEngine` so the dashboard works offline).
 */

import { apiPost } from '../api/client';
import { aiMemoryService, type WorkspaceMemory } from './aiMemoryService';

const USE_MOCKS = true;

const FORECAST_ENDPOINT = '/api/ai/revenue/forecast';

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export interface ClosingDeal {
  dealId: string;
  customerName: string;
  value: number;
  probability: number;
}

export interface LeakageItem {
  reason: string;
  valueAtRisk: number;
  dealIds: string[];
}

export interface NextBestRevenueAction {
  action: string;
  impact: number;
}

export interface RevenueBrainOutput {
  expectedMonthly: number;
  bestCase: number;
  likely: number;
  riskCase: number;
  closingThisMonth: ClosingDeal[];
  leakage: LeakageItem[];
  nextBestActions: NextBestRevenueAction[];
  targetProgress: { target: number; current: number; gap: number };
  confidence: number;
  currency: string;
  generatedAt: string;
}

interface RevenueDeal {
  id: string;
  customerName: string;
  stage: string;
  value: number;
  probability: number;
  lastActivityAt: number;
}

interface ClosedDeal {
  id: string;
  value: number;
  closedAt: number;
  outcome: 'won' | 'lost';
}

export interface RevenueForecastInput {
  workspaceId: string;
  currency?: string;
}

class AIRevenueBrain {
  async forecast(input: RevenueForecastInput): Promise<RevenueBrainOutput> {
    const currency = input.currency ?? 'USD';

    if (!USE_MOCKS) {
      try {
        return await apiPost<RevenueBrainOutput>(FORECAST_ENDPOINT, input);
      } catch (err) {
        console.warn('[aiRevenueBrain] backend forecast failed, falling back', err);
      }
    }

    const memory = await aiMemoryService.getWorkspaceMemory(input.workspaceId);
    const deals = await this.loadActiveDeals(input.workspaceId);
    const history = await this.loadClosedDeals(input.workspaceId, 90);

    const expectedMonthly = this.calculateExpected(deals);
    const closing: ClosingDeal[] = deals
      .filter((d) => d.probability >= 0.6)
      .map((d) => ({
        dealId: d.id,
        customerName: d.customerName,
        value: d.value,
        probability: Math.round(d.probability * 100),
      }));

    const leakage = this.detectLeakage(deals, memory);
    const target = await this.getMonthlyTarget(input.workspaceId);
    const nextBestActions = this.computeBestActions(deals, leakage);

    return {
      expectedMonthly,
      bestCase: Math.round(expectedMonthly * 1.25),
      likely: expectedMonthly,
      riskCase: Math.round(expectedMonthly * 0.7),
      closingThisMonth: closing,
      leakage,
      nextBestActions,
      targetProgress: {
        target,
        current: expectedMonthly,
        gap: target - expectedMonthly,
      },
      confidence: this.calculateForecastConfidence(deals, history),
      currency,
      generatedAt: new Date().toISOString(),
    };
  }

  // ── Calculations ────────────────────────────────────────────────────

  private calculateExpected(deals: RevenueDeal[]): number {
    return Math.round(deals.reduce((sum, d) => sum + d.value * d.probability, 0));
  }

  private detectLeakage(
    deals: RevenueDeal[],
    memory: WorkspaceMemory
  ): LeakageItem[] {
    const stuck = deals.filter((d) => {
      const days = this.daysSince(d.lastActivityAt);
      const baseline = memory.responseBaseline?.[d.stage] ?? 5;
      return days > baseline * 2;
    });
    if (stuck.length === 0) return [];
    return [
      {
        reason: `${stuck.length} deals stalled past stage baseline`,
        valueAtRisk: stuck.reduce((sum, d) => sum + d.value, 0),
        dealIds: stuck.map((d) => d.id),
      },
    ];
  }

  private computeBestActions(
    deals: RevenueDeal[],
    leakage: LeakageItem[]
  ): NextBestRevenueAction[] {
    const actions: NextBestRevenueAction[] = [];
    if (leakage.length > 0) {
      actions.push({
        action: 'Resolve stalled deals to recover leakage',
        impact: leakage.reduce((sum, l) => sum + l.valueAtRisk, 0),
      });
    }
    const closingSoon = deals.filter((d) => d.probability >= 0.7);
    if (closingSoon.length > 0) {
      actions.push({
        action: `Close ${closingSoon.length} high-probability deals this week`,
        impact: closingSoon.reduce((sum, d) => sum + d.value, 0),
      });
    }
    const dormant = deals.filter((d) => this.daysSince(d.lastActivityAt) > 14);
    if (dormant.length > 0) {
      actions.push({
        action: `Re-engage ${dormant.length} dormant deals`,
        impact: Math.round(
          dormant.reduce((sum, d) => sum + d.value * d.probability, 0)
        ),
      });
    }
    return actions.sort((a, b) => b.impact - a.impact).slice(0, 3);
  }

  private calculateForecastConfidence(
    active: RevenueDeal[],
    history: ClosedDeal[]
  ): number {
    if (history.length < 3) return 50;
    if (history.length < 10) return 65;
    if (active.length < 5) return 70;
    return 80;
  }

  private daysSince(timestamp: number): number {
    return Math.floor((Date.now() - timestamp) / (1000 * 60 * 60 * 24));
  }

  // ── Data loaders (mock-first) ──────────────────────────────────────

  private async loadActiveDeals(workspaceId: string): Promise<RevenueDeal[]> {
    if (USE_MOCKS) {
      await sleep(120);
      return buildMockActiveDeals(workspaceId);
    }
    return apiPost<RevenueDeal[]>('/api/ai/revenue/active-deals', { workspaceId });
  }

  private async loadClosedDeals(
    workspaceId: string,
    days: number
  ): Promise<ClosedDeal[]> {
    if (USE_MOCKS) {
      await sleep(80);
      return buildMockClosedDeals(workspaceId, days);
    }
    return apiPost<ClosedDeal[]>('/api/ai/revenue/closed-deals', {
      workspaceId,
      days,
    });
  }

  private async getMonthlyTarget(workspaceId: string): Promise<number> {
    if (USE_MOCKS) {
      await sleep(40);
      return buildMockTarget(workspaceId);
    }
    return apiPost<number>('/api/ai/revenue/target', { workspaceId });
  }
}

const day = 1000 * 60 * 60 * 24;

const buildMockActiveDeals = (workspaceId: string): RevenueDeal[] => {
  const now = Date.now();
  return [
    {
      id: `${workspaceId}-d1`,
      customerName: 'Al-Faisal Trading',
      stage: 'proposal',
      value: 24_000,
      probability: 0.55,
      lastActivityAt: now - 9 * day,
    },
    {
      id: `${workspaceId}-d2`,
      customerName: 'Anatolia Logistics',
      stage: 'negotiation',
      value: 38_500,
      probability: 0.72,
      lastActivityAt: now - 4 * day,
    },
    {
      id: `${workspaceId}-d3`,
      customerName: 'Gulf Builders',
      stage: 'closing',
      value: 65_000,
      probability: 0.81,
      lastActivityAt: now - 2 * day,
    },
    {
      id: `${workspaceId}-d4`,
      customerName: 'Levant Foods',
      stage: 'qualified',
      value: 12_500,
      probability: 0.42,
      lastActivityAt: now - 18 * day,
    },
  ];
};

const buildMockClosedDeals = (
  workspaceId: string,
  days: number
): ClosedDeal[] => {
  const now = Date.now();
  const closed: ClosedDeal[] = [
    { id: `${workspaceId}-c1`, value: 18_000, closedAt: now - 12 * day, outcome: 'won' },
    { id: `${workspaceId}-c2`, value: 9_500, closedAt: now - 30 * day, outcome: 'won' },
    { id: `${workspaceId}-c3`, value: 22_000, closedAt: now - 45 * day, outcome: 'lost' },
    { id: `${workspaceId}-c4`, value: 14_500, closedAt: now - 60 * day, outcome: 'won' },
  ];
  return closed.filter((d) => now - d.closedAt <= days * day);
};

const buildMockTarget = (_workspaceId: string): number => 60_000;

export const aiRevenueBrain = new AIRevenueBrain();

export default aiRevenueBrain;