/**
 * OnboardingAgent — AI Sprint 4 §11, agent 6.
 *
 * Triggers: on-demand (the user lands on the dashboard).
 * Permission: L3 (executes setup steps with explicit approval — never
 * silently changes country, currency, integrations).
 *
 * Walks a brand-new workspace through the spec's setup checklist and
 * surfaces ONE next step at a time so the inbox doesn't get spammed.
 * Each step ships with a `cta.action` the host screen routes on.
 */

import { BaseAgent } from './baseAgent';
import type {
  AgentOutput,
  AgentPermissionLevel,
  AgentRole,
} from '../../types/ai';

export interface OnboardingProgress {
  countrySet: boolean;
  currencyConfirmed: boolean;
  firstCustomer: boolean;
  firstDeal: boolean;
  firstIntegration: boolean;
}

interface StepDescriptor {
  insight: string;
  reason: string;
  actionId: string;
}

export class OnboardingAgent extends BaseAgent {
  role: AgentRole = 'onboarding';
  defaultPermission: AgentPermissionLevel = 3;

  async evaluate(workspaceId: string): Promise<AgentOutput[]> {
    const progress = await this.getProgress(workspaceId);
    const step = this.nextStep(progress);
    if (!step) return [];
    return [
      this.createOutput({
        insight: step.insight,
        reason: step.reason,
        confidence: 100,
        signals: ['Workspace setup checklist'],
        recommendedAction: step.insight,
        cta: { label: 'Continue setup', action: step.actionId },
      }),
    ];
  }

  private nextStep(progress: OnboardingProgress): StepDescriptor | null {
    if (!progress.countrySet) {
      return {
        insight: 'Set your country',
        reason: 'This drives tax, currency, and compliance.',
        actionId: 'set-country',
      };
    }
    if (!progress.currencyConfirmed) {
      return {
        insight: 'Confirm your currency',
        reason: 'Verify default currency is correct.',
        actionId: 'confirm-currency',
      };
    }
    if (!progress.firstCustomer) {
      return {
        insight: 'Add your first customer',
        reason: 'Start your CRM with a real contact.',
        actionId: 'add-customer',
      };
    }
    if (!progress.firstDeal) {
      return {
        insight: 'Create your first deal',
        reason: 'See pipeline come to life.',
        actionId: 'add-deal',
      };
    }
    if (!progress.firstIntegration) {
      return {
        insight: 'Connect a tool',
        reason: 'WhatsApp, email, or Drive.',
        actionId: 'open-integrations',
      };
    }
    return null;
  }

  private async getProgress(_workspaceId: string): Promise<OnboardingProgress> {
    // Backend: GET /api/onboarding/progress — returns the workspace's
    // checklist state. Default to a partially-set workspace until wired.
    return {
      countrySet: true,
      currencyConfirmed: true,
      firstCustomer: true,
      firstDeal: false,
      firstIntegration: false,
    };
  }
}

export const onboardingAgent = new OnboardingAgent();

export default onboardingAgent;
