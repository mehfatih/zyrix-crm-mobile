/**
 * microsoft integration — placeholder (AI Sprint 1, section 15).
 *
 * Future sprints implement Microsoft Graph connectivity (OneDrive,
 * Outlook, Teams) via MSAL.
 */

export interface MicrosoftClient {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  isConnected: () => Promise<boolean>;
}

export const microsoft: MicrosoftClient = {
  connect: async () => {
    // TODO(ai-sprint-3): real MSAL flow.
  },
  disconnect: async () => {
    // TODO(ai-sprint-3): revoke tokens.
  },
  isConnected: async () => false,
};

export default microsoft;
