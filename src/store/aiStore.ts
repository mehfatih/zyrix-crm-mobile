/**
 * aiStore — Zustand store for AI-era app state.
 *
 * AI Sprint 2 (sections 3, 5, 6, 7) wires this into the Decision Engine,
 * Trust Layer, Memory Layer, Command Center and Floating Button. The
 * store keeps:
 *
 *   - rankedActions       → Decision Engine output (top 10 daily actions)
 *   - context             → Current screen/entity context (set by screens)
 *   - commandCenterOpen   → Floating Button toggle for the bottom-sheet
 *   - pendingAgentActions → Agent outputs awaiting human approval
 *   - lastSyncedAt        → Timestamp of the last successful refresh
 *
 * Only the Floating Button mutates `commandCenterOpen`. Screens push
 * their context via `setContext` so the Command Center can render the
 * correct entity card when it opens.
 */

import { create } from 'zustand';

import type { AgentOutput, AIContext, RankedAction } from '../types/ai';

export type AgentActionOutcome = 'approved' | 'edited' | 'dismissed';

export interface AIStoreState {
  rankedActions: RankedAction[];
  context: AIContext | null;
  commandCenterOpen: boolean;
  pendingAgentActions: AgentOutput[];
  lastSyncedAt: number | null;

  setRankedActions: (actions: RankedAction[]) => void;
  setContext: (context: AIContext | null) => void;

  openCommandCenter: (context?: AIContext) => void;
  closeCommandCenter: () => void;

  addPendingAgentAction: (action: AgentOutput) => void;
  resolvePendingAction: (id: string, outcome: AgentActionOutcome) => void;

  markSynced: () => void;
  reset: () => void;
}

export const useAiStore = create<AIStoreState>((set) => ({
  rankedActions: [],
  context: null,
  commandCenterOpen: false,
  pendingAgentActions: [],
  lastSyncedAt: null,

  setRankedActions: (actions) => set({ rankedActions: actions }),
  setContext: (context) => set({ context }),

  openCommandCenter: (context) =>
    set((state) => ({
      commandCenterOpen: true,
      context: context ?? state.context,
    })),
  closeCommandCenter: () => set({ commandCenterOpen: false }),

  addPendingAgentAction: (action) =>
    set((state) => {
      if (state.pendingAgentActions.some((a) => a.id === action.id)) {
        return state;
      }
      return { pendingAgentActions: [...state.pendingAgentActions, action] };
    }),

  resolvePendingAction: (id, _outcome) =>
    set((state) => ({
      pendingAgentActions: state.pendingAgentActions.filter((a) => a.id !== id),
    })),

  markSynced: () => set({ lastSyncedAt: Date.now() }),

  reset: () =>
    set({
      rankedActions: [],
      context: null,
      commandCenterOpen: false,
      pendingAgentActions: [],
      lastSyncedAt: null,
    }),
}));

// Spec uses `useAIStore` (capital AI) in places. Re-export with that name
// so component code can match the section-7 examples verbatim while we
// also keep the long-standing `useAiStore` callers happy.
export const useAIStore = useAiStore;
