/**
 * TaskAgent — AI Sprint 4 §11, agent 8.
 *
 * Triggers: spawned by other agents (e.g. dealRisk → "create follow-up
 * task").
 * Permission: L4 (auto-execute INTERNAL tasks only).
 *
 * The L4 level is the only place in the agent system where execution
 * happens without an explicit user tap. The base class's
 * `validatePermission` blocks any action whose name matches
 * `NEVER_AUTO_EXECUTE` — so creating an internal task is fine, but a
 * payment / invoice / external message would be rejected here.
 */

import { BaseAgent } from './baseAgent';
import type {
  AgentOutput,
  AgentPermissionLevel,
  AgentRole,
} from '../../types/ai';

export interface TaskAgentContext {
  sourceInsightId?: string;
  suggestedTitle?: string;
}

export class TaskAgent extends BaseAgent {
  role: AgentRole = 'task';
  defaultPermission: AgentPermissionLevel = 4;

  async evaluate(
    _workspaceId: string,
    context?: unknown
  ): Promise<AgentOutput[]> {
    const ctx = context as TaskAgentContext | undefined;
    if (!ctx?.suggestedTitle) return [];

    if (!this.validatePermission('create-internal-task', this.defaultPermission)) {
      return [];
    }

    return [
      this.createOutput({
        insight: `Auto-created task: ${ctx.suggestedTitle}`,
        reason: 'Based on AI insight, an internal task was created.',
        confidence: 95,
        signals: ['Internal-only action', 'Linked to source insight'],
        recommendedAction: 'Open task to review or edit',
        cta: { label: 'Open task', action: 'open-task' },
        draftPayload: {
          type: 'task',
          content: ctx.suggestedTitle,
          metadata: {
            sourceInsightId: ctx.sourceInsightId,
            internal: true,
          },
        },
        entityType: 'task',
      }),
    ];
  }
}

export const taskAgent = new TaskAgent();

export default taskAgent;
