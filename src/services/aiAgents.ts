/**
 * aiAgents — placeholder service (AI Sprint 1, section 15).
 *
 * Future sprints implement the agent swarm registry and runner.
 */

import type { AgentOutput, AgentRole, AIContext } from '../types/ai';

export interface AgentRunner {
  listRoles: () => readonly AgentRole[];
  run: (role: AgentRole, context: AIContext) => Promise<AgentOutput[]>;
}

export const aiAgents: AgentRunner = {
  listRoles: () => [
    'sales-followup',
    'deal-risk',
    'revenue',
    'customer-profile',
    'messaging',
    'onboarding',
    'integration',
    'task',
  ] as const,
  run: async (_role, _context) => {
    // TODO(ai-sprint-2): dispatch to the real Gemini-backed agent.
    return [];
  },
};

export default aiAgents;
