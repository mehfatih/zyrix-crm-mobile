/**
 * Google Drive integration — AI Sprint 5, section 13.
 *
 * OAuth via expo-auth-session, file CRUD via Drive REST v3. Tokens
 * persist in SecureStore so the user only signs in once. The mobile
 * client only ever holds a Google access token long enough to read or
 * upload a file the user explicitly picks — backend stores attachment
 * pointers (not file blobs) so the cloud copy stays canonical.
 */

import * as AuthSession from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';

import { apiPost } from '../../api/client';

WebBrowser.maybeCompleteAuthSession();

const TOKEN_KEY = 'zyrix_google_drive_token';
const REFRESH_KEY = 'zyrix_google_drive_refresh';

const DRIVE_DISCOVERY = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  size?: number;
  modifiedTime?: string;
  thumbnailLink?: string;
}

export interface DriveFolder {
  id: string;
  name: string;
  parentId?: string;
}

export type AttachableRecordType =
  | 'customer'
  | 'deal'
  | 'quote'
  | 'contract'
  | 'report';

class GoogleDriveService {
  private accessToken: string | null = null;

  async loadStoredToken(): Promise<string | null> {
    if (this.accessToken) return this.accessToken;
    try {
      this.accessToken = await SecureStore.getItemAsync(TOKEN_KEY);
      return this.accessToken;
    } catch {
      return null;
    }
  }

  async isConnected(): Promise<boolean> {
    const token = await this.loadStoredToken();
    if (!token) return false;
    try {
      const response = await fetch(
        'https://www.googleapis.com/drive/v3/about?fields=user',
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.ok;
    } catch {
      return false;
    }
  }

  async connect(): Promise<boolean> {
    const clientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? '';
    if (!clientId) {
      console.warn('[GoogleDrive] EXPO_PUBLIC_GOOGLE_CLIENT_ID not set');
      return false;
    }

    const redirectUri = AuthSession.makeRedirectUri({ scheme: 'zyrix' });
    const request = new AuthSession.AuthRequest({
      clientId,
      scopes: [
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/drive.readonly',
      ],
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
      extraParams: { access_type: 'offline', prompt: 'consent' },
    });

    try {
      const result = await request.promptAsync(DRIVE_DISCOVERY);
      if (result.type !== 'success' || !result.params.code) return false;

      const tokenResult = await AuthSession.exchangeCodeAsync(
        {
          clientId,
          code: result.params.code,
          redirectUri,
          extraParams: { code_verifier: request.codeVerifier ?? '' },
        },
        DRIVE_DISCOVERY
      );

      this.accessToken = tokenResult.accessToken;
      await SecureStore.setItemAsync(TOKEN_KEY, tokenResult.accessToken);
      if (tokenResult.refreshToken) {
        await SecureStore.setItemAsync(REFRESH_KEY, tokenResult.refreshToken);
      }
      return true;
    } catch (err) {
      console.warn('[GoogleDrive] connect failed', err);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    this.accessToken = null;
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_KEY);
  }

  async listFiles(folderId?: string, pageSize: number = 50): Promise<DriveFile[]> {
    const token = await this.loadStoredToken();
    if (!token) throw new Error('Not connected to Google Drive');

    const queryParts = [
      'trashed = false',
      folderId ? `'${folderId}' in parents` : null,
    ].filter(Boolean) as string[];
    const q = encodeURIComponent(queryParts.join(' and '));
    const fields = encodeURIComponent(
      'files(id,name,mimeType,webViewLink,size,modifiedTime,thumbnailLink)'
    );

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${q}&pageSize=${pageSize}&fields=${fields}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!response.ok) {
      throw new Error(`Drive list failed: ${response.status}`);
    }
    const data = (await response.json()) as { files?: DriveFile[] };
    return data.files ?? [];
  }

  async listFolders(): Promise<DriveFolder[]> {
    const token = await this.loadStoredToken();
    if (!token) throw new Error('Not connected to Google Drive');

    const q = encodeURIComponent(
      "mimeType = 'application/vnd.google-apps.folder' and trashed = false"
    );
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${q}&pageSize=100&fields=files(id,name,parents)`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!response.ok) {
      throw new Error(`Drive folders failed: ${response.status}`);
    }
    const data = (await response.json()) as {
      files?: { id: string; name: string; parents?: string[] }[];
    };
    return (data.files ?? []).map((f) => ({
      id: f.id,
      name: f.name,
      parentId: f.parents?.[0],
    }));
  }

  async uploadFile(
    file: { uri: string; name: string; mimeType: string },
    folderId?: string
  ): Promise<DriveFile> {
    const token = await this.loadStoredToken();
    if (!token) throw new Error('Not connected to Google Drive');

    const metadata: Record<string, unknown> = { name: file.name };
    if (folderId) metadata.parents = [folderId];

    const fileResponse = await fetch(file.uri);
    const blob = await fileResponse.blob();

    const form = new FormData();
    form.append(
      'metadata',
      new Blob([JSON.stringify(metadata)], { type: 'application/json' })
    );
    form.append('file', blob);

    const response = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink,size,modifiedTime',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form as unknown as BodyInit,
      }
    );

    if (!response.ok) {
      throw new Error(`Drive upload failed: ${response.status}`);
    }
    return (await response.json()) as DriveFile;
  }

  async downloadFile(fileId: string): Promise<Blob> {
    const token = await this.loadStoredToken();
    if (!token) throw new Error('Not connected to Google Drive');

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!response.ok) {
      throw new Error(`Drive download failed: ${response.status}`);
    }
    return response.blob();
  }

  async getFile(fileId: string): Promise<DriveFile> {
    const token = await this.loadStoredToken();
    if (!token) throw new Error('Not connected to Google Drive');

    const fields =
      'id,name,mimeType,webViewLink,size,modifiedTime,thumbnailLink';
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?fields=${encodeURIComponent(fields)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!response.ok) {
      throw new Error(`Get file failed: ${response.status}`);
    }
    return (await response.json()) as DriveFile;
  }

  async attachToRecord(
    driveFileId: string,
    recordType: AttachableRecordType,
    recordId: string
  ): Promise<void> {
    const file = await this.getFile(driveFileId);
    await apiPost('/api/integrations/drive/attach', {
      provider: 'google-drive',
      externalFileId: driveFileId,
      fileName: file.name,
      webUrl: file.webViewLink,
      recordType,
      recordId,
    });
  }
}

export const googleDriveService = new GoogleDriveService();
export default googleDriveService;
