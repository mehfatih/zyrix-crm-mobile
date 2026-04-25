/**
 * aiMemoryService — AI Memory Layer for the mobile client (Sprint 2 §6).
 *
 * The mobile app never reaches the database directly. The backend owns
 * the `WorkspaceMemory` table (Prisma) and exposes it through
 * /api/ai/memory. This client mirrors the spec's API surface but talks
 * to the server (or returns deterministic mock data when `USE_MOCKS`
 * is true) so screens can call `aiMemoryService.getWorkspaceMemory` /
 * `recordRecommendationOutcome` without caring about transport.
 *
 * CRITICAL (per spec): the memory layer must NEVER trigger irreversible
 * actions on its own — every recorded outcome is advisory and the user
 * stays in control via the Trust Layer.
 */

import { apiGet, apiPost } from '../api/client';

export type PreferredChannel = 'whatsapp' | 'email' | 'phone' | 'sms';

export interface WorkspaceMemory {
  workspaceId: string;
  avgReplyTime: number;
  responseBaseline: Record<string, number>;
  preferredChannel: PreferredChannel;
  successfulMessageStyles: string[];
  bestConvertingSegments: string[];
  ignoredRecommendations: string[];
  acceptedRecommendations: string[];
  updatedAt: string;
}

export type RecommendationOutcome = 'accepted' | 'ignored' | 'edited';

export interface RecordOutcomeInput {
  workspaceId: string;
  recommendationId: string;
  outcome: RecommendationOutcome;
}

const USE_MOCKS = true;

const MEMORY_ENDPOINT = '/api/ai/memory';

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const cache = new Map<string, WorkspaceMemory>();

const buildDefaultMemory = (workspaceId: string): WorkspaceMemory => ({
  workspaceId,
  avgReplyTime: 24,
  responseBaseline: {
    lead: 2,
    qualified: 3,
    proposal: 5,
    negotiation: 4,
    closing: 2,
  },
  preferredChannel: 'whatsapp',
  successfulMessageStyles: ['short-direct', 'arabic-formal'],
  bestConvertingSegments: ['retail-saudi', 'wholesale-turkey'],
  ignoredRecommendations: [],
  acceptedRecommendations: [],
  updatedAt: new Date().toISOString(),
});

const ensureMockMemory = (workspaceId: string): WorkspaceMemory => {
  const cached = cache.get(workspaceId);
  if (cached) return cached;
  const fresh = buildDefaultMemory(workspaceId);
  cache.set(workspaceId, fresh);
  return fresh;
};

class AIMemoryService {
  async getWorkspaceMemory(workspaceId: string): Promise<WorkspaceMemory> {
    if (USE_MOCKS) {
      await sleep(150);
      return ensureMockMemory(workspaceId);
    }
    return apiGet<WorkspaceMemory>(`${MEMORY_ENDPOINT}/${workspaceId}`);
  }

  async recordRecommendationOutcome(
    input: RecordOutcomeInput
  ): Promise<WorkspaceMemory> {
    if (USE_MOCKS) {
      await sleep(120);
      const memory = ensureMockMemory(input.workspaceId);
      const next: WorkspaceMemory = {
        ...memory,
        updatedAt: new Date().toISOString(),
      };
      if (input.outcome === 'accepted') {
        next.acceptedRecommendations = Array.from(
          new Set([...memory.acceptedRecommendations, input.recommendationId])
        );
      } else if (input.outcome === 'ignored') {
        next.ignoredRecommendations = Array.from(
          new Set([...memory.ignoredRecommendations, input.recommendationId])
        );
      }
      cache.set(input.workspaceId, next);
      return next;
    }
    return apiPost<WorkspaceMemory>(`${MEMORY_ENDPOINT}/outcome`, input);
  }

  async invalidate(workspaceId: string): Promise<void> {
    cache.delete(workspaceId);
  }
}

export const aiMemoryService = new AIMemoryService();

export default aiMemoryService;
