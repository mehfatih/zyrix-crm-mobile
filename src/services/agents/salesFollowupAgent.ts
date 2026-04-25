/**
 * SalesFollowupAgent — AI Sprint 4 §11, agent 1.
 *
 * Triggers: no-response, proposal-stale, high-score-no-contact.
 * Permission: L2 (drafts a message — user approves before sending).
 *
 * Pulls workspace memory (preferred channel, baseline reply time,
 * successful tone styles) so each draft matches what already converts
 * for this team. Drafts are mock-generated client-side until the
 * backend `/api/ai/agents/draft` endpoint is live.
 */

import { BaseAgent } from './baseAgent';
import type {
  AgentOutput,
  AgentPermissionLevel,
  AgentRole,
} from '../../types/ai';
import { aiMemoryService, type WorkspaceMemory } from '../aiMemoryService';

interface FollowupCandidate {
  dealId: string;
  name: string;
  daysSilent: number;
  value: number;
  stage: string;
  leadScore: number;
  locale: 'ar' | 'en' | 'tr';
  lastTopic?: string;
}

const MOCK_CANDIDATES: FollowupCandidate[] = [
  {
    dealId: 'deal-001',
    name: 'Al-Faisal Trading',
    daysSilent: 9,
    value: 24_000,
    stage: 'proposal',
    leadScore: 78,
    locale: 'ar',
    lastTopic: 'pricing review',
  },
  {
    dealId: 'deal-004',
    name: 'Levant Foods',
    daysSilent: 18,
    value: 12_500,
    stage: 'qualified',
    leadScore: 64,
    locale: 'en',
    lastTopic: 'demo follow-up',
  },
];

export class SalesFollowupAgent extends BaseAgent {
  role: AgentRole = 'sales-followup';
  defaultPermission: AgentPermissionLevel = 2;

  async evaluate(workspaceId: string): Promise<AgentOutput[]> {
    const memory = await aiMemoryService.getWorkspaceMemory(workspaceId);
    const candidates = await this.findCandidates(workspaceId, memory);
    const outputs: AgentOutput[] = [];

    for (const candidate of candidates) {
      const draft = await this.generateFollowupDraft(candidate, memory);
      outputs.push(
        this.createOutput({
          insight: `${candidate.name} hasn't replied in ${candidate.daysSilent} days`,
          reason: `Last activity ${candidate.daysSilent} days ago. Workspace baseline: ${memory.avgReplyTime}h. Deal value: $${candidate.value}.`,
          confidence: this.scoreConfidence(candidate, memory),
          signals: [
            `${candidate.daysSilent} days silent`,
            `Stage: ${candidate.stage}`,
            `Lead score: ${candidate.leadScore}`,
            `Preferred channel: ${memory.preferredChannel}`,
          ],
          recommendedAction: 'Send a short, friendly follow-up to re-engage',
          cta: { label: 'Send follow-up', action: 'send-message' },
          draftPayload: {
            type: 'message',
            content: draft,
            metadata: {
              channel: memory.preferredChannel,
              locale: candidate.locale,
            },
          },
          entityType: 'deal',
          entityId: candidate.dealId,
        })
      );
    }
    return outputs;
  }

  private async findCandidates(
    _workspaceId: string,
    _memory: WorkspaceMemory
  ): Promise<FollowupCandidate[]> {
    // Backend: /api/ai/agents/sales-followup/candidates — returns deals
    // whose lastActivity exceeds the workspace baseline. Mock for now.
    return MOCK_CANDIDATES;
  }

  private async generateFollowupDraft(
    candidate: FollowupCandidate,
    memory: WorkspaceMemory
  ): Promise<string> {
    const styleHint =
      memory.successfulMessageStyles.length > 0
        ? memory.successfulMessageStyles.join(', ')
        : 'professional friendly';
    const cultureHint =
      candidate.locale === 'ar'
        ? 'Arabic Gulf/Levantine'
        : candidate.locale === 'tr'
          ? 'Turkish business'
          : 'English';
    const prompt = `You are Zyrix Sales Follow-up Agent. Write a short, friendly follow-up message.

Customer: ${candidate.name}
Stage: ${candidate.stage}
Days silent: ${candidate.daysSilent}
Last topic: ${candidate.lastTopic ?? 'general inquiry'}
Locale: ${candidate.locale}
Preferred channel: ${memory.preferredChannel}
Successful tone styles for this workspace: ${styleHint}

Rules:
- Keep under 60 words
- No pushy language
- Natural for ${cultureHint} business culture
- One clear next step (question or call to action)
- Match the workspace's successful tone

Output: just the message text, no labels.`;
    return this.generateDraft(prompt);
  }

  private scoreConfidence(
    candidate: FollowupCandidate,
    memory: WorkspaceMemory
  ): number {
    const baseline = memory.avgReplyTime > 0 ? memory.avgReplyTime : 24;
    const silentHours = candidate.daysSilent * 24;
    const ratio = silentHours / baseline;
    if (ratio > 5) return 92;
    if (ratio > 3) return 85;
    if (ratio > 2) return 75;
    return 65;
  }
}

export const salesFollowupAgent = new SalesFollowupAgent();

export default salesFollowupAgent;
