/**
 * CustomerProfileAgent — AI Sprint 4 §11, agent 4.
 *
 * Triggers: on-demand only (called from a customer detail screen).
 * Permission: L1 (suggest-only — surfaces a one-line profile summary
 * and a recommended next action).
 *
 * The agent loads a dossier (deals + lifetime value + sentiment +
 * activity) for one customer and asks the backend Gemini bridge to
 * compress it into a sentence + a single best next move.
 */

import { BaseAgent } from './baseAgent';
import type {
  AgentOutput,
  AgentPermissionLevel,
  AgentRole,
} from '../../types/ai';

export interface CustomerProfileContext {
  customerId: string;
}

interface CustomerProfile {
  customerId: string;
  name: string;
  behaviorPattern: string;
  deals: { id: string; value: number; outcome: 'open' | 'won' | 'lost' }[];
  lifetimeValue: number;
  daysActive: number;
  avgReplyHours: number;
  sentiment: 'positive' | 'neutral' | 'negative';
}

export class CustomerProfileAgent extends BaseAgent {
  role: AgentRole = 'customer-profile';
  defaultPermission: AgentPermissionLevel = 1;

  async evaluate(
    _workspaceId: string,
    context?: unknown
  ): Promise<AgentOutput[]> {
    const ctx = context as CustomerProfileContext | undefined;
    if (!ctx?.customerId) return [];

    const profile = await this.buildProfile(ctx.customerId);
    const summary = await this.generateSummary(profile);
    const nextAction = await this.suggestNextAction(profile);

    return [
      this.createOutput({
        insight: summary,
        reason: `Behavior: ${profile.behaviorPattern}. ${profile.deals.length} deals, $${profile.lifetimeValue} LTV.`,
        confidence: 80,
        signals: [
          `${profile.deals.length} total deals`,
          `${profile.daysActive} days active`,
          `Avg reply time: ${profile.avgReplyHours}h`,
          `Sentiment: ${profile.sentiment}`,
        ],
        recommendedAction: nextAction,
        cta: { label: 'Take action', action: 'open-customer' },
        entityType: 'customer',
        entityId: ctx.customerId,
      }),
    ];
  }

  private async buildProfile(customerId: string): Promise<CustomerProfile> {
    // Backend: /api/ai/agents/customer-profile/:customerId — fetches the
    // full dossier. Mocked deterministically until the route ships.
    return {
      customerId,
      name: 'Al-Faisal Trading',
      behaviorPattern: 'Replies fast, prefers WhatsApp, high-value',
      deals: [
        { id: 'd1', value: 24_000, outcome: 'open' },
        { id: 'd2', value: 18_000, outcome: 'won' },
        { id: 'd3', value: 9_500, outcome: 'won' },
      ],
      lifetimeValue: 51_500,
      daysActive: 312,
      avgReplyHours: 6,
      sentiment: 'positive',
    };
  }

  private async generateSummary(profile: CustomerProfile): Promise<string> {
    const prompt = `Summarize this customer in one sentence (max 20 words):
${JSON.stringify(profile)}
Output: just the summary.`;
    const draft = await this.generateDraft(prompt);
    return draft || `${profile.name}: ${profile.behaviorPattern}`;
  }

  private async suggestNextAction(profile: CustomerProfile): Promise<string> {
    const prompt = `Based on this customer profile, what is the single best next action?
${JSON.stringify(profile)}
Output: one specific action (max 15 words).`;
    const draft = await this.generateDraft(prompt);
    return draft || 'Schedule a 15-minute success call to deepen the relationship';
  }
}

export const customerProfileAgent = new CustomerProfileAgent();

export default customerProfileAgent;
