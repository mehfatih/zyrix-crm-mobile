/**
 * aiStore — Zustand store for AI-era app state (AI Sprint 1, section 15).
 *
 * Placeholder implementation: holds ranked actions, the current screen
 * context, and a floating-button toggle. Later sprints wire the decision
 * engine and agent outputs into this store.
 */

import { create } from 'zustand';

import type { AIContext, RankedAction } from '../types/ai';

export interface AIStoreState {
  rankedActions: RankedAction[];
  context: AIContext | null;
  commandCenterOpen: boolean;
  lastSyncedAt: number | null;

  setRankedActions: (actions: RankedAction[]) => void;
  setContext: (context: AIContext | null) => void;
  openCommandCenter: () => void;
  closeCommandCenter: () => void;
  markSynced: () => void;
  reset: () => void;
}

export const useAiStore = create<AIStoreState>((set) => ({
  rankedActions: [],
  context: null,
  commandCenterOpen: false,
  lastSyncedAt: null,

  setRankedActions: (actions) => set({ rankedActions: actions }),
  setContext: (context) => set({ context }),
  openCommandCenter: () => set({ commandCenterOpen: true }),
  closeCommandCenter: () => set({ commandCenterOpen: false }),
  markSynced: () => set({ lastSyncedAt: Date.now() }),
  reset: () =>
    set({
      rankedActions: [],
      context: null,
      commandCenterOpen: false,
      lastSyncedAt: null,
    }),
}));
