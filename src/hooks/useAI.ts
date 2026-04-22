/**
 * React bindings for the AI resource module. `useAIChat` drives the
 * chat surfaces (AI CFO, Builder, Workflow Builder) — it owns the
 * message list and handles the streaming assistant response via the
 * mock `streamAIResponse` helper until the backend lands.
 */

import { useCallback, useMemo, useRef, useState } from 'react';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import {
  analyzeConversation,
  askAICFO,
  listConversations,
  scoreLeads,
  streamAIResponse,
  summarizeMeeting,
  listMeetings,
} from '../api/ai';
import { useToast } from './useToast';
import type {
  AIMessage,
  AIResponse,
  ConversationAnalysis,
  ConversationItem,
  LeadScoreResponse,
  LiveMeetingListItem,
  MeetingSummary,
} from '../types/ai';

const nowTimestamp = (): string => new Date().toISOString();

const genId = (): string =>
  `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

export interface UseAIChatResult {
  messages: AIMessage[];
  sendMessage: (text: string) => Promise<void>;
  isTyping: boolean;
  clearHistory: () => void;
  appendAssistantMessage: (message: AIMessage) => void;
}

export const useAIChat = (): UseAIChatResult => {
  const toast = useToast();
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const streamBuffer = useRef<string>('');

  const appendAssistantMessage = useCallback(
    (message: AIMessage) => {
      setMessages((prev) => [...prev, message]);
    },
    [setMessages]
  );

  const sendMessage = useCallback(
    async (text: string): Promise<void> => {
      const trimmed = text.trim();
      if (!trimmed) return;

      const userMessage: AIMessage = {
        id: genId(),
        role: 'user',
        content: trimmed,
        timestamp: nowTimestamp(),
      };
      const assistantId = genId();

      setMessages((prev) => [
        ...prev,
        userMessage,
        {
          id: assistantId,
          role: 'assistant',
          content: '',
          timestamp: nowTimestamp(),
        },
      ]);
      streamBuffer.current = '';
      setIsTyping(true);

      try {
        await streamAIResponse(trimmed, (chunk) => {
          streamBuffer.current += chunk;
          setMessages((prev) =>
            prev.map((message) =>
              message.id === assistantId
                ? { ...message, content: streamBuffer.current }
                : message
            )
          );
        });

        // Pull the structured response (charts/insights/actions) in one
        // call — the stream only delivers the text preview for now.
        const full: AIResponse = await askAICFO({ question: trimmed });
        setMessages((prev) =>
          prev.map((message) =>
            message.id === assistantId
              ? {
                  ...message,
                  content: streamBuffer.current || full.answer,
                  charts: full.charts,
                  insights: full.insights,
                  actions: full.suggestedActions,
                }
              : message
          )
        );
      } catch (err) {
        toast.error('AI', (err as Error).message);
        setMessages((prev) =>
          prev.filter((message) => message.id !== assistantId)
        );
      } finally {
        setIsTyping(false);
      }
    },
    [toast]
  );

  const clearHistory = useCallback(() => {
    setMessages([]);
    streamBuffer.current = '';
  }, []);

  return useMemo(
    () => ({
      messages,
      sendMessage,
      isTyping,
      clearHistory,
      appendAssistantMessage,
    }),
    [messages, sendMessage, isTyping, clearHistory, appendAssistantMessage]
  );
};

export const useAIScoreLeads = (): UseQueryResult<LeadScoreResponse, Error> =>
  useQuery<LeadScoreResponse, Error>({
    queryKey: ['ai', 'leadScores'],
    queryFn: () => scoreLeads(),
    staleTime: 5 * 60 * 1000,
  });

export const useConversationList = (): UseQueryResult<
  ConversationItem[],
  Error
> =>
  useQuery<ConversationItem[], Error>({
    queryKey: ['ai', 'conversations'],
    queryFn: () => listConversations(),
    staleTime: 60 * 1000,
  });

export const useConversationIntel = (
  conversationId: string | null | undefined
): UseQueryResult<ConversationAnalysis, Error> =>
  useQuery<ConversationAnalysis, Error>({
    queryKey: ['ai', 'conversation', conversationId],
    queryFn: () => analyzeConversation(conversationId as string),
    enabled: !!conversationId,
    staleTime: 60 * 1000,
  });

export const useMeetingList = (): UseQueryResult<LiveMeetingListItem[], Error> =>
  useQuery<LiveMeetingListItem[], Error>({
    queryKey: ['ai', 'meetings'],
    queryFn: () => listMeetings(),
    staleTime: 60 * 1000,
  });

export const useMeetingIntel = (
  meetingId: string | null | undefined
): UseQueryResult<MeetingSummary, Error> =>
  useQuery<MeetingSummary, Error>({
    queryKey: ['ai', 'meeting', meetingId],
    queryFn: () => summarizeMeeting(meetingId as string),
    enabled: !!meetingId,
    staleTime: 5 * 60 * 1000,
  });
