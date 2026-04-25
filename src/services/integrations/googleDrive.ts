/**
 * googleDrive integration — placeholder (AI Sprint 1, section 15).
 *
 * Future sprints implement OAuth + file listing/upload/download.
 */

export interface GoogleDriveClient {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  isConnected: () => Promise<boolean>;
}

export const googleDrive: GoogleDriveClient = {
  connect: async () => {
    // TODO(ai-sprint-3): real OAuth flow.
  },
  disconnect: async () => {
    // TODO(ai-sprint-3): revoke tokens.
  },
  isConnected: async () => false,
};

export default googleDrive;
