/**
 * aiDecisionEngine — placeholder service (AI Sprint 1, section 15).
 *
 * Future sprints implement the ranking loop: collect agent outputs,
 * score + dedupe, and emit `RankedAction[]` for the UI.
 */

import type { AgentOutput, RankedAction } from '../types/ai';

export interface DecisionEngine {
  rankActions: (outputs: AgentOutput[]) => Promise<RankedAction[]>;
}

export const aiDecisionEngine: DecisionEngine = {
  rankActions: async (_outputs) => {
    // TODO(ai-sprint-2): replace with the real ranking implementation.
    return [];
  },
};

export default aiDecisionEngine;
