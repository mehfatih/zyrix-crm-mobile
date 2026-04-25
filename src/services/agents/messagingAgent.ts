/**
 * MessagingAgent — AI Sprint 4 §11, agent 5.
 *
 * Triggers: user-opens-message, weak-followup-typed,
 * deal-at-risk-needs-outreach.
 * Permission: L2 (drafts — user reviews and sends; nothing auto-sends).
 *
 * Generates 3 reply variants (professional / friendly / concise) for
 * the open conversation. The default `draftPayload.content` is the
 * professional variant; the other two are stored in
 * `draftPayload.metadata.variants` so the composer can show a quick
 * picker.
 */

import { BaseAgent } from './baseAgent';
import type {
  AgentOutput,
  AgentPermissionLevel,
  AgentRole,
  SupportedChatLanguage,
} from '../../types/ai';

export interface MessagingContextInput {
  messageContext: MessagingContext;
}

export interface MessagingContext {
  customerId?: string;
  customerName: string;
  lastMessage?: string;
  stage?: string;
  locale: SupportedChatLanguage;
}

type Tone = 'professional' | 'friendly' | 'concise';

const TONES: Tone[] = ['professional', 'friendly', 'concise'];

export class MessagingAgent extends BaseAgent {
  role: AgentRole = 'messaging';
  defaultPermission: AgentPermissionLevel = 2;

  async evaluate(
    _workspaceId: string,
    context?: unknown
  ): Promise<AgentOutput[]> {
    const ctx = (context as MessagingContextInput | undefined)?.messageContext;
    if (!ctx) return [];

    const drafts = await Promise.all(
      TONES.map((tone) => this.generateDraft(this.buildPrompt(ctx, tone)))
    );

    const safeDrafts = drafts.map((draft, idx) =>
      draft && draft.trim().length > 0
        ? draft
        : this.fallbackDraft(ctx, TONES[idx]!)
    );

    return [
      this.createOutput({
        insight: 'Suggested replies ready',
        reason: `Based on ${ctx.lastMessage ? 'their last message' : 'the deal context'}.`,
        confidence: 80,
        signals: [
          `Locale: ${ctx.locale}`,
          `Stage: ${ctx.stage ?? 'unknown'}`,
          `Tone options: ${safeDrafts.length}`,
        ],
        recommendedAction: 'Pick a draft, edit if needed, send',
        cta: { label: 'Use professional', action: 'use-draft-0' },
        draftPayload: {
          type: 'message',
          content: safeDrafts[0] ?? '',
          metadata: {
            variants: safeDrafts,
            tones: TONES,
            locale: ctx.locale,
            customerId: ctx.customerId,
          },
        },
        entityType: 'message',
        entityId: ctx.customerId,
      }),
    ];
  }

  private buildPrompt(ctx: MessagingContext, tone: Tone): string {
    const culture =
      ctx.locale === 'ar'
        ? 'Arabic'
        : ctx.locale === 'tr'
          ? 'Turkish'
          : 'English';
    const length = tone === 'concise' ? 'Max 30 words' : 'Max 60 words';
    return `Write a ${tone} reply to this customer message.

Customer: ${ctx.customerName}
Their message: "${ctx.lastMessage ?? 'N/A'}"
Stage: ${ctx.stage ?? 'unknown'}
Locale: ${ctx.locale}
Rules:
- Match ${culture} business style
- ${length}
- One clear next step
Output: just the message text.`;
  }

  private fallbackDraft(ctx: MessagingContext, tone: Tone): string {
    if (tone === 'concise') {
      return `Hi ${ctx.customerName} — quick check: should we move forward this week?`;
    }
    if (tone === 'friendly') {
      return `Hey ${ctx.customerName}! Thanks for the note. Want me to set aside 15 minutes tomorrow to wrap this up?`;
    }
    return `Hi ${ctx.customerName}, thanks for the update. I have time tomorrow to walk you through the next steps — does 11:00 work?`;
  }
}

export const messagingAgent = new MessagingAgent();

export default messagingAgent;
