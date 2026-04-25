/**
 * RevenueAgent — AI Sprint 4 §11, agent 3.
 *
 * Triggers: month-end, revenue-below-target, high-value-near-closing,
 * forecast-drops.
 * Permission: L1 (suggest-only — never moves money or changes targets).
 *
 * Wraps the existing `aiRevenueBrain` forecast (Sprint 3 §10) and
 * surfaces a single `AgentOutput` whenever the forecast shows a
 * meaningful gap to target. The user opens the Revenue Brain screen
 * to drill in; this agent only flags that attention is warranted.
 */

import { BaseAgent } from './baseAgent';
import type {
  AgentOutput,
  AgentPermissionLevel,
  AgentRole,
} from '../../types/ai';
import { aiRevenueBrain } from '../aiRevenueBrain';

export class RevenueAgent extends BaseAgent {
  role: AgentRole = 'revenue';
  defaultPermission: AgentPermissionLevel = 1;

  async evaluate(workspaceId: string): Promise<AgentOutput[]> {
    const forecast = await aiRevenueBrain.forecast({
      workspaceId,
      currency: 'USD',
    });

    if (forecast.targetProgress.gap <= 0) {
      return [];
    }

    const firstAction = forecast.nextBestActions[0]?.action;
    return [
      this.createOutput({
        insight: `Revenue gap of $${forecast.targetProgress.gap} this month`,
        reason: `Expected $${forecast.expectedMonthly}, target $${forecast.targetProgress.target}. Best-case $${forecast.bestCase}, risk-case $${forecast.riskCase}.`,
        confidence: forecast.confidence,
        signals: [
          `Forecast: $${forecast.expectedMonthly}`,
          `Target: $${forecast.targetProgress.target}`,
          `${forecast.closingThisMonth.length} deals closing this month`,
          `${forecast.leakage.length} sources of revenue leakage`,
        ],
        recommendedAction: firstAction ?? 'Focus on high-probability deals',
        cta: { label: 'Open Revenue Brain', action: 'open-revenue-brain' },
      }),
    ];
  }
}

export const revenueAgent = new RevenueAgent();

export default revenueAgent;
