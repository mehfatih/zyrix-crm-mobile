/**
 * AI resource module.
 *
 * Mobile never calls a model provider directly — all requests hit the
 * Zyrix backend (which fronts Gemini 2.0 Flash). Sprint 6 ships
 * deterministic mocks so the UI can be exercised end-to-end while the
 * server wiring is being built. Flip `USE_MOCKS` to `false` to route
 * calls through the real axios client.
 */

import { apiGet, apiPost } from './client';
import { ENDPOINTS } from './endpoints';
import {
  buildCFOResponse,
  buildConversationAnalysis,
  buildConversationList,
  buildDuplicateGroups,
  buildLeadScoreResponse,
  buildMeetingSummary,
  buildMeetings,
  buildWorkflowDefinition,
} from './aiMock';
import type {
  AIBuildResult,
  AIBuilderMode,
  AIResponse,
  ConversationAnalysis,
  ConversationItem,
  DuplicateGroup,
  LeadScoreResponse,
  LiveMeetingListItem,
  MeetingSummary,
  WorkflowDefinition,
} from '../types/ai';

const USE_MOCKS = true;

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export interface AskAICFOInput {
  question: string;
  context?: Record<string, string | number | boolean>;
}

export const askAICFO = async (input: AskAICFOInput): Promise<AIResponse> => {
  if (USE_MOCKS) {
    await sleep(450);
    return buildCFOResponse(input.question);
  }
  return apiPost<AIResponse>(`${ENDPOINTS.ai.SUMMARIZE}/cfo`, input);
};

export const createWorkflow = async (
  description: string
): Promise<WorkflowDefinition> => {
  if (USE_MOCKS) {
    await sleep(550);
    return buildWorkflowDefinition(description);
  }
  return apiPost<WorkflowDefinition>(`${ENDPOINTS.ai.SUMMARIZE}/workflow`, {
    description,
  });
};

export const buildWithAI = async (
  mode: AIBuilderMode,
  prompt: string
): Promise<AIBuildResult> => {
  if (USE_MOCKS) {
    await sleep(600);
    return {
      title:
        mode === 'architect'
          ? 'CRM blueprint'
          : mode === 'builder'
            ? 'Suggested artifact'
            : 'Data report',
      summary:
        mode === 'architect'
          ? 'I configured modules, pipelines, and default reports based on your description.'
          : mode === 'builder'
            ? 'I drafted an asset ready for review before publishing.'
            : 'Here is the data slice you asked for, with notes on trends.',
      artifacts: [
        {
          kind:
            mode === 'architect' ? 'setup' : mode === 'builder' ? 'template' : 'report',
          label: `${mode}: ${prompt.slice(0, 40)}`,
          preview: 'Preview ready once the backend endpoint ships.',
        },
      ],
    };
  }
  return apiPost<AIBuildResult>(`${ENDPOINTS.ai.SUMMARIZE}/build`, {
    mode,
    prompt,
  });
};

export const scoreLeads = async (
  filters?: { stage?: string; country?: string }
): Promise<LeadScoreResponse> => {
  if (USE_MOCKS) {
    await sleep(500);
    const base = buildLeadScoreResponse();
    if (!filters) return base;
    return base;
  }
  return apiPost<LeadScoreResponse>(ENDPOINTS.ai.SCORE_LEAD, filters ?? {});
};

export const listConversations = async (): Promise<ConversationItem[]> => {
  if (USE_MOCKS) {
    await sleep(350);
    return buildConversationList();
  }
  return apiGet<ConversationItem[]>(ENDPOINTS.ai.CONVERSATION_INTEL);
};

export const analyzeConversation = async (
  conversationId: string
): Promise<ConversationAnalysis> => {
  if (USE_MOCKS) {
    await sleep(500);
    return buildConversationAnalysis(conversationId);
  }
  return apiGet<ConversationAnalysis>(
    `${ENDPOINTS.ai.CONVERSATION_INTEL}/${conversationId}`
  );
};

export const detectDuplicates = async (
  entityType: 'customer' | 'contact' | 'company'
): Promise<DuplicateGroup[]> => {
  if (USE_MOCKS) {
    await sleep(550);
    return buildDuplicateGroups().filter(
      (group) => group.entityType === entityType || entityType === 'customer'
    );
  }
  return apiPost<DuplicateGroup[]>(`${ENDPOINTS.ai.SUMMARIZE}/duplicates`, {
    entityType,
  });
};

export const listMeetings = async (): Promise<LiveMeetingListItem[]> => {
  if (USE_MOCKS) {
    await sleep(300);
    return buildMeetings();
  }
  return apiGet<LiveMeetingListItem[]>(`${ENDPOINTS.ai.SUMMARIZE}/meetings`);
};

export const summarizeMeeting = async (
  meetingId: string
): Promise<MeetingSummary> => {
  if (USE_MOCKS) {
    await sleep(500);
    return buildMeetingSummary(meetingId);
  }
  return apiPost<MeetingSummary>(`${ENDPOINTS.ai.SUMMARIZE}/meeting`, {
    meetingId,
  });
};

export interface UploadMeetingInput {
  name: string;
  uri: string;
  mimeType?: string;
  size?: number;
}

export const uploadMeetingRecording = async (
  _file: UploadMeetingInput
): Promise<{ meetingId: string }> => {
  if (USE_MOCKS) {
    await sleep(1200);
    return { meetingId: `mt_${Math.random().toString(36).slice(2, 8)}` };
  }
  return apiPost<{ meetingId: string }>(`${ENDPOINTS.ai.SUMMARIZE}/upload`, {
    name: _file.name,
    uri: _file.uri,
    mimeType: _file.mimeType,
    size: _file.size,
  });
};

export const streamAIResponse = async (
  question: string,
  onChunk: (chunk: string) => void
): Promise<void> => {
  if (USE_MOCKS) {
    const response = buildCFOResponse(question);
    const tokens = response.answer.split(/(\s+)/);
    for (const token of tokens) {
      await sleep(30);
      onChunk(token);
    }
    return;
  }
  // Real streaming would open an SSE / fetch stream against the server.
  const full = await askAICFO({ question });
  onChunk(full.answer);
};
