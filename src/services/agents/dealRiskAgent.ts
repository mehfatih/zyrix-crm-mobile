/**
 * DealRiskAgent — AI Sprint 4 §11, agent 2.
 *
 * Triggers: deal-stuck, negative-sentiment, response-delay,
 * decision-maker-inactive.
 * Permission: L1 (suggest-only — never sends or edits anything).
 *
 * The agent surfaces deals that drift past the workspace stage
 * baseline AND show one or more risk signals (silence, sentiment
 * dip, key contact going dark). It returns recovery plans the user
 * can act on; the actual outreach is owned by the messaging /
 * sales-followup agents.
 */

import { BaseAgent } from './baseAgent';
import type {
  AgentOutput,
  AgentPermissionLevel,
  AgentRole,
} from '../../types/ai';
import { aiMemoryService, type WorkspaceMemory } from '../aiMemoryService';

interface DealRisk {
  dealId: string;
  dealName: string;
  reasonText: string;
  confidence: number;
  signals: string[];
  recoveryPlan: string;
}

const MOCK_RISKS: DealRisk[] = [
  {
    dealId: 'deal-001',
    dealName: 'Al-Faisal Trading',
    reasonText:
      'Stuck in proposal for 14 days vs. 5-day baseline, decision maker has not opened the last 2 messages.',
    confidence: 86,
    signals: [
      'Stage: proposal',
      'Days in stage: 14',
      'Stage baseline: 5 days',
      'Decision maker last seen 11 days ago',
    ],
    recoveryPlan:
      'Re-engage the decision maker with a short summary of value + 2 time slots this week.',
  },
  {
    dealId: 'deal-004',
    dealName: 'Levant Foods',
    reasonText:
      'No reply in 18 days and recent message tone shifted negative — close to losing this deal.',
    confidence: 78,
    signals: [
      'Days silent: 18',
      'Sentiment: negative',
      'Stage: qualified',
      'Lead score dropped 12 points',
    ],
    recoveryPlan:
      'Acknowledge the concern, offer a no-cost check-in to clarify scope, hold off on pricing pressure.',
  },
];

export class DealRiskAgent extends BaseAgent {
  role: AgentRole = 'deal-risk';
  defaultPermission: AgentPermissionLevel = 1;

  async evaluate(workspaceId: string): Promise<AgentOutput[]> {
    const memory = await aiMemoryService.getWorkspaceMemory(workspaceId);
    const risks = await this.detectRisks(workspaceId, memory);
    return risks.map((risk) =>
      this.createOutput({
        insight: `${risk.dealName} is at risk of stalling`,
        reason: risk.reasonText,
        confidence: risk.confidence,
        signals: risk.signals,
        recommendedAction: risk.recoveryPlan,
        cta: { label: 'View recovery plan', action: 'open-recovery-plan' },
        entityType: 'deal',
        entityId: risk.dealId,
      })
    );
  }

  private async detectRisks(
    _workspaceId: string,
    _memory: WorkspaceMemory
  ): Promise<DealRisk[]> {
    // Backend: /api/ai/agents/deal-risk/scan — returns deals matching
    // risk patterns (stuck > 2× stage baseline, sentiment dip, etc.).
    return MOCK_RISKS;
  }
}

export const dealRiskAgent = new DealRiskAgent();

export default dealRiskAgent;
