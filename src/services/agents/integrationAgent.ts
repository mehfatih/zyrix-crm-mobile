/**
 * IntegrationAgent — AI Sprint 4 §11, agent 7.
 *
 * Triggers: on-demand (Sprint 5 wires it into Google Drive / Microsoft
 * sync events).
 * Permission: L3 (executes integration sync actions with approval).
 *
 * For Sprint 4 the agent is a typed shell — it never produces an
 * output until Sprint 5 hooks the real Drive/Microsoft connectors.
 * Keeping the class in place now lets the orchestrator and inbox UI
 * register against the full eight-agent set without churn later.
 */

import { BaseAgent } from './baseAgent';
import type {
  AgentOutput,
  AgentPermissionLevel,
  AgentRole,
} from '../../types/ai';

export class IntegrationAgent extends BaseAgent {
  role: AgentRole = 'integration';
  defaultPermission: AgentPermissionLevel = 3;

  async evaluate(
    _workspaceId: string,
    _context?: unknown
  ): Promise<AgentOutput[]> {
    // Sprint 5 will populate this once Google Drive / Microsoft sync
    // signals are available. Returning [] keeps the orchestrator clean.
    return [];
  }
}

export const integrationAgent = new IntegrationAgent();

export default integrationAgent;
