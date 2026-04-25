/**
 * aiCommandService — drives the AI Command Center (Sprint 2 §7).
 *
 * Each tile / free-form prompt in the Command Center calls
 * `aiCommandService.execute(...)` which proxies to the backend at
 * /api/ai/command. The backend uses Gemini 2.0 Flash with a structured
 * output prompt and is workspace-aware via the Memory Layer. The
 * response is shaped like an `AIInsight` so the response card can
 * reuse the Trust Layer (`AITrustBadge`).
 *
 * Mobile mocks: when `USE_MOCKS` is true we synthesize plausible
 * responses per command so screens are exercisable end-to-end without
 * a live backend.
 */

import { apiPost } from '../api/client';
import type { AIContext, AIInsight } from '../types/ai';

export type AICommandId =
  | 'analyze-deal'
  | 'write-followup'
  | 'find-risks'
  | 'create-plan'
  | 'predict-revenue'
  | 'explain-recommendation'
  | 'free-form';

export interface AICommandRequest {
  commandId: AICommandId;
  input?: string;
  context?: AIContext | null;
  workspaceId: string;
  userId: string;
}

export interface AICommandResponse extends AIInsight {
  commandId: AICommandId;
  followups?: string[];
}

const USE_MOCKS = true;

const COMMAND_ENDPOINT = '/api/ai/command';

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const summarizeContext = (ctx: AIContext | null | undefined): string => {
  if (!ctx) return 'general workspace overview';
  if (ctx.entityType && ctx.entityId) {
    return `${ctx.entityType} ${ctx.entityId} on ${ctx.screen}`;
  }
  return ctx.summary || ctx.screen;
};

const buildMockResponse = (request: AICommandRequest): AICommandResponse => {
  const where = summarizeContext(request.context);
  switch (request.commandId) {
    case 'analyze-deal':
      return {
        commandId: 'analyze-deal',
        title: 'Deal momentum looks healthy',
        reason: `Last 3 touchpoints on ${where} were positive; the customer replies in under 8 hours which is twice the workspace baseline.`,
        confidence: 82,
        recommendedAction: 'Send pricing options today and aim to close within 7 days.',
        cta: { label: 'Draft message', action: 'compose-followup' },
        signals: [
          'Reply time: 7h vs 14h baseline',
          'Sentiment: positive (last 3 messages)',
          'Stage progressed last week',
        ],
        followups: [
          'What discount would close this faster?',
          'Compare against similar deals',
        ],
      };
    case 'write-followup':
      return {
        commandId: 'write-followup',
        title: 'Draft ready',
        reason: 'Tone matches your most-accepted style for this customer segment.',
        confidence: 88,
        recommendedAction:
          'Hi Mansour, just checking in on the proposal — happy to walk through anything that needs adjusting before you decide. — Mehmet',
        cta: { label: 'Send via WhatsApp', action: 'send-whatsapp' },
        signals: [
          'Style: short-direct (your top performer)',
          'Channel: WhatsApp (preferred)',
          'Language: matches customer profile',
        ],
      };
    case 'find-risks':
      return {
        commandId: 'find-risks',
        title: '2 deals are cooling down',
        reason:
          'Al-Faisal Trading and Anatolia Logistics have both gone quiet past the workspace baseline.',
        confidence: 86,
        recommendedAction: 'Review the risk list and send a short check-in today.',
        cta: { label: 'Open risks', action: 'open-risks' },
        signals: [
          'Al-Faisal: 9 days silent (baseline 5)',
          'Anatolia: 4 days silent on $38.5K negotiation',
        ],
      };
    case 'create-plan':
      return {
        commandId: 'create-plan',
        title: '3-step plan for the week',
        reason: 'Built from your top 5 ranked actions and the workspace memory.',
        confidence: 78,
        recommendedAction:
          '1) Close Gulf Builders by Wed. 2) Re-engage Al-Faisal Mon. 3) Renew Mansour Fri.',
        cta: { label: 'Create tasks', action: 'create-tasks' },
        signals: [
          'Aligned with your 60-day average closing speed',
          'Avoids a 3-deal pipeline gap next month',
        ],
      };
    case 'predict-revenue':
      return {
        commandId: 'predict-revenue',
        title: 'Likely revenue this month: $96K – $112K',
        reason:
          'Weighted from open deals × stage probability and historical close rate.',
        confidence: 74,
        recommendedAction:
          'You are ~$14K below last month — push the 2 negotiation-stage deals to close.',
        cta: { label: 'Open forecast', action: 'open-forecast' },
        signals: [
          'Open pipeline: $187K',
          'Weighted forecast: $104K',
          'Last month: $118K',
        ],
      };
    case 'explain-recommendation':
      return {
        commandId: 'explain-recommendation',
        title: 'Why this recommendation',
        reason: `Triggered for ${where} because it crossed a workspace baseline, then ranked above 70 priority.`,
        confidence: 90,
        recommendedAction: 'Take the suggested action or dismiss to teach the system.',
        cta: { label: 'Got it', action: 'dismiss-explain' },
        signals: [
          'Rule: risk detector',
          'Above baseline by 65%',
          'Boosted: similar past acceptance',
        ],
      };
    case 'free-form':
    default:
      return {
        commandId: 'free-form',
        title: 'Working on it',
        reason: `Ran your prompt against ${where}.`,
        confidence: 70,
        recommendedAction:
          request.input?.trim() ||
          'Tell me which customer or deal you want me to focus on.',
        cta: { label: 'Refine', action: 'refine-prompt' },
        signals: ['Free-form prompt', 'Workspace memory applied'],
      };
  }
};

export class AICommandService {
  async execute(request: AICommandRequest): Promise<AICommandResponse> {
    if (USE_MOCKS) {
      await sleep(500);
      return buildMockResponse(request);
    }
    return apiPost<AICommandResponse>(COMMAND_ENDPOINT, request);
  }
}

export const aiCommandService = new AICommandService();

export default aiCommandService;
