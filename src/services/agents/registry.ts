/**
 * Agents registry — AI Sprint 4 §11.1.
 *
 * Single source of truth for the eight controlled assistants the spec
 * defines. Each entry pairs a role with its default permission level
 * and the triggers it watches. UI surfaces (Agent Inbox, Trust Layer,
 * settings) read from this list so adding a new agent is one append.
 *
 * `NEVER_AUTO_EXECUTE` enforces the spec §11.2 hard rule: even an L4
 * agent must NOT silently fire any of these actions. The base class
 * checks this before allowing auto-execute.
 */

import type { AgentDefinition } from '../../types/ai';

export const agentDefinitions: AgentDefinition[] = [
  {
    role: 'sales-followup',
    defaultPermission: 2,
    triggers: ['no-response', 'proposal-stale', 'high-score-no-contact'],
    description: 'Prevents lost leads by drafting follow-up messages',
  },
  {
    role: 'deal-risk',
    defaultPermission: 1,
    triggers: [
      'deal-stuck',
      'negative-sentiment',
      'response-delay',
      'decision-maker-inactive',
    ],
    description: 'Protects pipeline by detecting at-risk deals',
  },
  {
    role: 'revenue',
    defaultPermission: 1,
    triggers: [
      'month-end',
      'revenue-below-target',
      'high-value-near-closing',
      'forecast-drops',
    ],
    description: 'Forecasts revenue and finds growth opportunities',
  },
  {
    role: 'customer-profile',
    defaultPermission: 1,
    triggers: [],
    description: 'Summarizes customer history and suggests next best action',
  },
  {
    role: 'messaging',
    defaultPermission: 2,
    triggers: [
      'user-opens-message',
      'weak-followup-typed',
      'deal-at-risk-needs-outreach',
    ],
    description: 'Drafts and improves messages',
  },
  {
    role: 'onboarding',
    defaultPermission: 3,
    triggers: [],
    description: 'Guides workspace setup',
  },
  {
    role: 'integration',
    defaultPermission: 3,
    triggers: [],
    description: 'Prepares Google Drive / Microsoft sync actions',
  },
  {
    role: 'task',
    defaultPermission: 4,
    triggers: [],
    description: 'Creates internal tasks from AI insights',
  },
];

/**
 * Sensitive actions that NEVER auto-execute (§11.2). An agent at L4 that
 * tries to fire one of these must be blocked. Use a substring match in
 * `BaseAgent.validatePermission` so namespaced action ids
 * (e.g. `send-payment.invoice-123`) still match.
 */
export const NEVER_AUTO_EXECUTE = [
  'send-payment',
  'change-tax-settings',
  'create-invoice',
  'edit-legal-doc',
  'send-external-message',
  'invite-user',
  'change-billing',
  'delete-data',
] as const;

export type NeverAutoExecuteAction = (typeof NEVER_AUTO_EXECUTE)[number];

export const findAgentDefinition = (
  role: AgentDefinition['role']
): AgentDefinition | undefined =>
  agentDefinitions.find((entry) => entry.role === role);
