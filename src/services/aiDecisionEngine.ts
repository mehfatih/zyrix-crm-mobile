/**
 * aiDecisionEngine — AI Decision Engine (AI Sprint 2 §3).
 *
 * Pulls workspace data + memory, scores candidate actions across the
 * five priority types from the spec, and returns the top 10 ranked
 * actions for the dashboard / Command Center.
 *
 * Priority order (per spec):
 *   1. Risk
 *   2. Opportunity
 *   3. Follow-up
 *   4. Revenue growth
 *   5. Retention / upsell
 *
 * Every emitted action includes: title, reason, confidence,
 * recommendedAction, cta, signals (Trust Layer contract).
 *
 * Mobile note: Gemini lives behind the backend at /api/ai/decision/refine.
 * The mobile client never imports `@google/generative-ai` directly — the
 * 5 sacred rules say AI provider access stays server-side. When mocks
 * are on, we skip the refine round-trip and return the rule-based output
 * verbatim so the UI is exercisable offline.
 */

import { apiPost } from '../api/client';
import type { RankedAction } from '../types/ai';
import { aiMemoryService, type WorkspaceMemory } from './aiMemoryService';

const USE_MOCKS = true;

const REFINE_ENDPOINT = '/api/ai/decision/refine';

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export interface DecisionInput {
  workspaceId: string;
  userId: string;
  contextWindowDays?: number;
}

export interface DealRecord {
  id: string;
  customerName: string;
  stage: string;
  value: number;
  lastActivityAt: number | string | Date;
  closedAt?: number | string | Date | null;
  probability?: number;
}

export interface CustomerRecord {
  id: string;
  name: string;
  leadScore: number;
  avgReplyTimeHours: number;
  lastSentiment?: number;
  lifetimeValue: number;
  lastActivityAt: number | string | Date;
  segment?: string;
}

export interface TaskRecord {
  id: string;
  title: string;
  dueDate: number | string | Date;
  completed: boolean;
  ownerId?: string;
}

export interface MessageRecord {
  id: string;
  customerId: string;
  channel: string;
  sentiment?: number;
  receivedAt: number | string | Date;
}

export interface RawData {
  deals: DealRecord[];
  customers: CustomerRecord[];
  tasks: TaskRecord[];
  messages: MessageRecord[];
}

const toMs = (value: number | string | Date): number => new Date(value).getTime();

const daysSince = (value: number | string | Date): number =>
  Math.floor((Date.now() - toMs(value)) / (1000 * 60 * 60 * 24));

const daysOverdue = (value: number | string | Date): number =>
  Math.max(daysSince(value), 0);

const isIgnored = (id: string, memory: WorkspaceMemory): boolean =>
  memory.ignoredRecommendations.includes(id);

export class AIDecisionEngine {
  async generateDailyActions(input: DecisionInput): Promise<RankedAction[]> {
    const memory = await aiMemoryService.getWorkspaceMemory(input.workspaceId);
    const data = await this.loadData(
      input.workspaceId,
      input.contextWindowDays ?? 30
    );

    const candidates: RankedAction[] = [
      ...this.detectRisks(data, memory),
      ...this.detectOpportunities(data, memory),
      ...this.detectFollowups(data, memory),
      ...this.detectRevenueGrowth(data, memory),
      ...this.detectRetention(data, memory),
    ].filter((action) => !isIgnored(action.id, memory));

    const refined = await this.refineWithBackend(candidates, memory);
    return refined.sort((a, b) => b.priority - a.priority).slice(0, 10);
  }

  private async loadData(workspaceId: string, days: number): Promise<RawData> {
    if (USE_MOCKS) {
      await sleep(200);
      return buildMockRawData(workspaceId, days);
    }
    return apiPost<RawData>('/api/ai/decision-data', { workspaceId, days });
  }

  private detectRisks(data: RawData, memory: WorkspaceMemory): RankedAction[] {
    return data.deals
      .filter((deal) => {
        const days = daysSince(deal.lastActivityAt);
        const baseline = memory.responseBaseline?.[deal.stage] ?? 5;
        return deal.value >= 5000 && days > baseline * 1.5;
      })
      .map((deal) => {
        const days = daysSince(deal.lastActivityAt);
        const baseline = memory.responseBaseline?.[deal.stage] ?? 5;
        const overshootPct = Math.round((days / baseline - 1) * 100);
        return {
          id: `risk-${deal.id}`,
          type: 'risk' as const,
          priority: this.calculateRiskPriority(deal),
          title: `${deal.customerName} deal is cooling down`,
          reason: `No reply for ${days} days. Workspace baseline for ${deal.stage}: ${baseline} days. Deal value: $${deal.value.toLocaleString()}.`,
          confidence: this.calculateConfidence(deal, memory),
          recommendedAction: 'Send a short follow-up message today',
          cta: { label: 'Send follow-up', action: 'compose-followup' },
          signals: [
            `${days} days since last activity`,
            `Stage: ${deal.stage}`,
            `Value: $${deal.value.toLocaleString()}`,
            `Above workspace baseline by ${overshootPct}%`,
          ],
          entityType: 'deal',
          entityId: deal.id,
          estimatedImpact: { type: 'revenue' as const, value: deal.value },
        };
      });
  }

  private detectOpportunities(
    data: RawData,
    memory: WorkspaceMemory
  ): RankedAction[] {
    const baselineReply = memory.avgReplyTime ?? 24;
    return data.customers
      .filter(
        (c) =>
          c.leadScore >= 80 &&
          c.avgReplyTimeHours < baselineReply &&
          (c.lastSentiment ?? 0) > 0.6
      )
      .map((c) => ({
        id: `opp-${c.id}`,
        type: 'opportunity' as const,
        priority: c.leadScore,
        title: `${c.name} shows strong buying signals`,
        reason: `Lead score ${c.leadScore}/100, replies within ${c.avgReplyTimeHours}h, positive sentiment.`,
        confidence: 85,
        recommendedAction: 'Send a proposal now while engagement is high',
        cta: { label: 'Send proposal', action: 'create-proposal' },
        signals: [
          `Lead score: ${c.leadScore}/100`,
          `Reply time: ${c.avgReplyTimeHours}h (faster than ${baselineReply}h baseline)`,
          'Recent sentiment: positive',
        ],
        entityType: 'customer',
        entityId: c.id,
      }));
  }

  private detectFollowups(
    data: RawData,
    _memory: WorkspaceMemory
  ): RankedAction[] {
    return data.tasks
      .filter((t) => toMs(t.dueDate) < Date.now() && !t.completed)
      .map((t) => {
        const overdue = daysOverdue(t.dueDate);
        return {
          id: `followup-${t.id}`,
          type: 'followup' as const,
          priority: 60 + Math.min(overdue * 2, 30),
          title: `Task "${t.title}" is overdue`,
          reason: `Due ${overdue} day${overdue === 1 ? '' : 's'} ago.`,
          confidence: 95,
          recommendedAction: 'Complete or reschedule this task',
          cta: { label: 'Open task', action: 'open-task' },
          signals: [`Overdue by ${overdue} day${overdue === 1 ? '' : 's'}`],
          entityType: 'task',
          entityId: t.id,
        };
      });
  }

  private detectRevenueGrowth(
    data: RawData,
    _memory: WorkspaceMemory
  ): RankedAction[] {
    return data.deals
      .filter(
        (d) =>
          (d.stage === 'negotiation' || d.stage === 'closing') &&
          (d.probability ?? 0) >= 0.6 &&
          d.value >= 10_000
      )
      .map((d) => ({
        id: `growth-${d.id}`,
        type: 'revenue' as const,
        priority: Math.min(
          55 + Math.floor(d.value / 2000) + Math.round((d.probability ?? 0) * 20),
          92
        ),
        title: `Push ${d.customerName} to close this week`,
        reason: `Deal in ${d.stage} with ${Math.round(
          (d.probability ?? 0) * 100
        )}% probability. Value $${d.value.toLocaleString()}.`,
        confidence: 80,
        recommendedAction: 'Schedule a closing call today',
        cta: { label: 'Schedule call', action: 'schedule-call' },
        signals: [
          `Stage: ${d.stage}`,
          `Probability: ${Math.round((d.probability ?? 0) * 100)}%`,
          `Value: $${d.value.toLocaleString()}`,
        ],
        entityType: 'deal',
        entityId: d.id,
        estimatedImpact: { type: 'revenue' as const, value: d.value },
      }));
  }

  private detectRetention(
    data: RawData,
    _memory: WorkspaceMemory
  ): RankedAction[] {
    return data.customers
      .filter(
        (c) => c.lifetimeValue > 10_000 && daysSince(c.lastActivityAt) > 60
      )
      .map((c) => ({
        id: `retention-${c.id}`,
        type: 'retention' as const,
        priority: Math.min(70 + Math.floor(c.lifetimeValue / 1000), 95),
        title: `${c.name} has gone quiet`,
        reason: `LTV $${c.lifetimeValue.toLocaleString()}. No activity for ${daysSince(
          c.lastActivityAt
        )} days.`,
        confidence: 78,
        recommendedAction: 'Reach out with a personalized check-in',
        cta: { label: 'Send check-in', action: 'compose-checkin' },
        signals: [
          `LTV: $${c.lifetimeValue.toLocaleString()}`,
          `Inactive: ${daysSince(c.lastActivityAt)} days`,
        ],
        entityType: 'customer',
        entityId: c.id,
        estimatedImpact: { type: 'retention' as const, value: c.lifetimeValue },
      }));
  }

  private async refineWithBackend(
    actions: RankedAction[],
    memory: WorkspaceMemory
  ): Promise<RankedAction[]> {
    if (actions.length === 0) return [];
    if (USE_MOCKS) {
      // Boost recommendations whose siblings the user has accepted before.
      const acceptedTypes = new Set(
        memory.acceptedRecommendations
          .map((id) => id.split('-')[0])
          .filter(Boolean)
      );
      return actions.map((a) =>
        acceptedTypes.has(a.type)
          ? { ...a, priority: Math.min(a.priority + 5, 100) }
          : a
      );
    }
    try {
      return await apiPost<RankedAction[]>(REFINE_ENDPOINT, {
        actions,
        memory,
      });
    } catch (err) {
      console.warn(
        '[aiDecisionEngine] backend refinement failed, using rule-based output',
        err
      );
      return actions;
    }
  }

  private calculateRiskPriority(deal: DealRecord): number {
    const valueScore = Math.min(deal.value / 1000, 50);
    const delayScore = Math.min(daysSince(deal.lastActivityAt) * 2, 50);
    return Math.round(valueScore + delayScore);
  }

  private calculateConfidence(
    deal: DealRecord,
    memory: WorkspaceMemory
  ): number {
    const baseline = memory.responseBaseline?.[deal.stage];
    if (!baseline) return 65;
    const ratio = daysSince(deal.lastActivityAt) / baseline;
    if (ratio > 3) return 92;
    if (ratio > 2) return 85;
    if (ratio > 1.5) return 75;
    return 65;
  }
}

const buildMockRawData = (workspaceId: string, _days: number): RawData => {
  const now = Date.now();
  const day = 1000 * 60 * 60 * 24;
  return {
    deals: [
      {
        id: `${workspaceId}-d1`,
        customerName: 'Al-Faisal Trading',
        stage: 'proposal',
        value: 24_000,
        lastActivityAt: now - 9 * day,
        probability: 0.55,
      },
      {
        id: `${workspaceId}-d2`,
        customerName: 'Anatolia Logistics',
        stage: 'negotiation',
        value: 38_500,
        lastActivityAt: now - 4 * day,
        probability: 0.72,
      },
      {
        id: `${workspaceId}-d3`,
        customerName: 'Gulf Builders',
        stage: 'closing',
        value: 65_000,
        lastActivityAt: now - 2 * day,
        probability: 0.81,
      },
    ],
    customers: [
      {
        id: `${workspaceId}-c1`,
        name: 'Sara Khalid (Riyadh Boutique)',
        leadScore: 88,
        avgReplyTimeHours: 6,
        lastSentiment: 0.72,
        lifetimeValue: 4_500,
        lastActivityAt: now - 1 * day,
        segment: 'retail-saudi',
      },
      {
        id: `${workspaceId}-c2`,
        name: 'Ozkan Holdings',
        leadScore: 65,
        avgReplyTimeHours: 30,
        lastSentiment: 0.4,
        lifetimeValue: 22_500,
        lastActivityAt: now - 75 * day,
        segment: 'wholesale-turkey',
      },
    ],
    tasks: [
      {
        id: `${workspaceId}-t1`,
        title: 'Call Mansour about renewal',
        dueDate: now - 3 * day,
        completed: false,
      },
      {
        id: `${workspaceId}-t2`,
        title: 'Send updated quote to Anatolia',
        dueDate: now + 1 * day,
        completed: false,
      },
    ],
    messages: [],
  };
};

export const aiDecisionEngine = new AIDecisionEngine();

export default aiDecisionEngine;
