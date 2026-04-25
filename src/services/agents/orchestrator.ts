/**
 * AgentOrchestrator — AI Sprint 4 §11.
 *
 * Coordinates the eight agents. The Inbox screen calls `runAll` on
 * pull-to-refresh; agent-specific surfaces (customer detail,
 * messaging composer) call `runSingle` so they only invoke the
 * one agent they need.
 *
 * Failures from any individual agent are caught (Promise.allSettled)
 * so a transient backend issue can't take the inbox down. Outputs are
 * sorted by confidence so the most certain insight floats to the top.
 */

import type { AgentOutput, AgentRole } from '../../types/ai';
import { customerProfileAgent } from './customerProfileAgent';
import { dealRiskAgent } from './dealRiskAgent';
import { integrationAgent } from './integrationAgent';
import { messagingAgent } from './messagingAgent';
import { onboardingAgent } from './onboardingAgent';
import { revenueAgent } from './revenueAgent';
import { salesFollowupAgent } from './salesFollowupAgent';
import { taskAgent } from './taskAgent';
import type { BaseAgent } from './baseAgent';

const allAgents: BaseAgent[] = [
  salesFollowupAgent,
  dealRiskAgent,
  revenueAgent,
  customerProfileAgent,
  messagingAgent,
  onboardingAgent,
  integrationAgent,
  taskAgent,
];

class AgentOrchestrator {
  agents(): readonly BaseAgent[] {
    return allAgents;
  }

  async runAll(workspaceId: string): Promise<AgentOutput[]> {
    const results = await Promise.allSettled(
      allAgents.map((agent) => agent.evaluate(workspaceId))
    );
    return results
      .filter(
        (r): r is PromiseFulfilledResult<AgentOutput[]> =>
          r.status === 'fulfilled'
      )
      .flatMap((r) => r.value)
      .sort((a, b) => b.confidence - a.confidence);
  }

  async runSingle(
    role: AgentRole,
    workspaceId: string,
    context?: unknown
  ): Promise<AgentOutput[]> {
    const agent = allAgents.find((a) => a.role === role);
    if (!agent) return [];
    try {
      return await agent.evaluate(workspaceId, context);
    } catch (err) {
      console.warn(`[orchestrator] ${role} failed`, err);
      return [];
    }
  }
}

export const agentOrchestrator = new AgentOrchestrator();

export default agentOrchestrator;
