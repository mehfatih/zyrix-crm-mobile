/**
 * BaseAgent — shared scaffolding for all eight Sprint-4 agents.
 *
 * Every concrete agent extends this class and implements `evaluate`.
 * The base class handles three concerns:
 *
 *   1. `generateDraft(prompt)` — calls the backend Gemini bridge
 *      (`/api/ai/agents/draft`). The mobile client never embeds the
 *      Gemini SDK directly (5-sacred-rule §4 + §5 — backend owns AI
 *      access). When `USE_MOCKS` is true the helper returns a short
 *      deterministic stub so screens work offline.
 *
 *   2. `validatePermission(action, level)` — enforces spec §11.2:
 *      L4 agents must never auto-execute anything in
 *      `NEVER_AUTO_EXECUTE`. Lower levels still produce drafts but
 *      the user always approves before execution.
 *
 *   3. `createOutput(partial)` — assembles a fully-typed `AgentOutput`
 *      with id, role, permission, status='pending', timestamp, so each
 *      agent can focus on its own evaluation logic.
 */

import { apiPost } from '../../api/client';
import type {
  AgentOutput,
  AgentPermissionLevel,
  AgentRole,
} from '../../types/ai';
import { NEVER_AUTO_EXECUTE } from './registry';

const USE_MOCKS = true;

const DRAFT_ENDPOINT = '/api/ai/agents/draft';

interface DraftRequest {
  role: AgentRole;
  prompt: string;
}

interface DraftResponse {
  text: string;
}

const MOCK_DRAFTS: Record<AgentRole, string> = {
  'sales-followup':
    "Hi — circling back on the proposal. Want me to set up a quick 15-minute call this week to walk through the next steps?",
  'deal-risk':
    'This deal looks stalled vs. your stage baseline. Recommend a check-in with the decision maker before week-end.',
  revenue:
    'Closing the highest-probability deals this week recovers most of the gap to target.',
  'customer-profile':
    'Reliable mid-market customer with steady engagement. Best next move is a value-add success call.',
  messaging:
    'Thanks for the update. I have a slot tomorrow at 11:00 to walk you through the proposal — does that work?',
  onboarding: 'Set your country first — it drives tax, currency, and compliance.',
  integration:
    'Connect Google Drive to auto-link uploaded contracts to the right deals.',
  task: 'Follow up with this customer in 3 days.',
};

export abstract class BaseAgent {
  abstract role: AgentRole;
  abstract defaultPermission: AgentPermissionLevel;

  abstract evaluate(
    workspaceId: string,
    context?: unknown
  ): Promise<AgentOutput[]>;

  /**
   * Ask the backend Gemini bridge for a draft. Falls back to a short,
   * deterministic mock when `USE_MOCKS` is true OR the request fails,
   * so the UI is never blocked by a transient backend issue.
   */
  protected async generateDraft(prompt: string): Promise<string> {
    if (USE_MOCKS) {
      return MOCK_DRAFTS[this.role] ?? '';
    }
    try {
      const payload: DraftRequest = { role: this.role, prompt };
      const result = await apiPost<DraftResponse>(DRAFT_ENDPOINT, payload);
      return result.text ?? '';
    } catch (err) {
      console.warn(`[${this.role}] draft generation failed`, err);
      return MOCK_DRAFTS[this.role] ?? '';
    }
  }

  /**
   * Block sensitive auto-execute actions (spec §11.2). Returns false
   * when an L4 agent tries to fire something on the deny-list. Lower
   * permission levels return true here because they need a human
   * approval path anyway — the actual gating happens in the UI.
   */
  protected validatePermission(
    action: string,
    level: AgentPermissionLevel
  ): boolean {
    const isSensitive = NEVER_AUTO_EXECUTE.some((blocked) =>
      action.includes(blocked)
    );
    if (isSensitive && level === 4) {
      console.error(
        `[${this.role}] Blocked auto-execute on sensitive action: ${action}`
      );
      return false;
    }
    return true;
  }

  protected createOutput(
    partial: Omit<
      AgentOutput,
      'id' | 'agentRole' | 'permissionLevel' | 'createdAt' | 'status'
    >
  ): AgentOutput {
    return {
      id: `${this.role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      agentRole: this.role,
      permissionLevel: this.defaultPermission,
      createdAt: new Date().toISOString(),
      status: 'pending',
      ...partial,
    };
  }
}
