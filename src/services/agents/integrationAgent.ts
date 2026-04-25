/**
 * IntegrationAgent — AI Sprint 4 §11, agent 7.
 *
 * Sprint 5 wires this agent into the real Drive / Microsoft connectors.
 * When neither provider is connected the agent surfaces a single nudge
 * encouraging the user to wire one up so contracts and quotes can be
 * attached straight from the cloud. If at least one provider is
 * connected the agent stays quiet — orchestrator emits no card.
 *
 * Permission level stays at 3 (executes integration sync actions with
 * approval); the user must always confirm before a file is attached.
 */

import { BaseAgent } from './baseAgent';
import type {
  AgentOutput,
  AgentPermissionLevel,
  AgentRole,
} from '../../types/ai';
import { googleDriveService } from '../integrations/googleDrive';
import { microsoftService } from '../integrations/microsoft';

export class IntegrationAgent extends BaseAgent {
  role: AgentRole = 'integration';
  defaultPermission: AgentPermissionLevel = 3;

  async evaluate(
    _workspaceId: string,
    _context?: unknown
  ): Promise<AgentOutput[]> {
    const [driveConnected, msConnected] = await Promise.all([
      googleDriveService.isConnected(),
      microsoftService.isConnected(),
    ]);

    if (driveConnected || msConnected) return [];

    return [
      this.createOutput({
        insight: 'Connect a file storage provider',
        reason:
          'Attach contracts, quotes, and customer files directly from Google Drive or OneDrive without leaving Zyrix.',
        confidence: 100,
        signals: ['No cloud storage connected'],
        recommendedAction: 'Connect Google Drive or Microsoft 365',
        cta: { label: 'Open integrations', action: 'open-integrations' },
      }),
    ];
  }
}

export const integrationAgent = new IntegrationAgent();

export default integrationAgent;
