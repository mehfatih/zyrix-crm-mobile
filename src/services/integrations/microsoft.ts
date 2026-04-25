/**
 * Microsoft 365 integration — AI Sprint 5, section 13.
 *
 * OAuth via Microsoft identity platform (common tenant), file CRUD via
 * Microsoft Graph (`/me/drive`). Tokens persist in SecureStore. Like the
 * Google Drive sibling, this client only ever shuttles a file the user
 * picks; backend stores the attachment pointer, not the bytes.
 */

import * as AuthSession from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';

import { apiPost } from '../../api/client';
import type { AttachableRecordType } from './googleDrive';

WebBrowser.maybeCompleteAuthSession();

const TOKEN_KEY = 'zyrix_microsoft_token';
const REFRESH_KEY = 'zyrix_microsoft_refresh';

const MS_DISCOVERY = {
  authorizationEndpoint:
    'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
  tokenEndpoint: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
};

export interface MSFile {
  id: string;
  name: string;
  webUrl: string;
  size?: number;
  lastModifiedDateTime?: string;
  file?: { mimeType: string };
  folder?: { childCount: number };
}

class MicrosoftService {
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
      const response = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async connect(): Promise<boolean> {
    const clientId = process.env.EXPO_PUBLIC_MICROSOFT_CLIENT_ID ?? '';
    if (!clientId) {
      console.warn('[Microsoft] EXPO_PUBLIC_MICROSOFT_CLIENT_ID not set');
      return false;
    }

    const redirectUri = AuthSession.makeRedirectUri({ scheme: 'zyrix' });
    const request = new AuthSession.AuthRequest({
      clientId,
      scopes: [
        'Files.ReadWrite',
        'Files.ReadWrite.All',
        'Sites.ReadWrite.All',
        'offline_access',
        'User.Read',
      ],
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
    });

    try {
      const result = await request.promptAsync(MS_DISCOVERY);
      if (result.type !== 'success' || !result.params.code) return false;

      const tokenResult = await AuthSession.exchangeCodeAsync(
        {
          clientId,
          code: result.params.code,
          redirectUri,
          extraParams: { code_verifier: request.codeVerifier ?? '' },
        },
        MS_DISCOVERY
      );

      this.accessToken = tokenResult.accessToken;
      await SecureStore.setItemAsync(TOKEN_KEY, tokenResult.accessToken);
      if (tokenResult.refreshToken) {
        await SecureStore.setItemAsync(REFRESH_KEY, tokenResult.refreshToken);
      }
      return true;
    } catch (err) {
      console.warn('[Microsoft] connect failed', err);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    this.accessToken = null;
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_KEY);
  }

  async listFiles(folderId?: string): Promise<MSFile[]> {
    const token = await this.loadStoredToken();
    if (!token) throw new Error('Not connected to Microsoft');

    const path = folderId
      ? `/me/drive/items/${folderId}/children`
      : '/me/drive/root/children';

    const response = await fetch(`https://graph.microsoft.com/v1.0${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error(`MS list failed: ${response.status}`);
    }
    const data = (await response.json()) as { value?: MSFile[] };
    return data.value ?? [];
  }

  async uploadFile(
    file: { uri: string; name: string; mimeType: string },
    folderPath: string = 'Zyrix'
  ): Promise<MSFile> {
    const token = await this.loadStoredToken();
    if (!token) throw new Error('Not connected to Microsoft');

    const fileResponse = await fetch(file.uri);
    const blob = await fileResponse.blob();
    const path = encodeURIComponent(`${folderPath}/${file.name}`);

    const response = await fetch(
      `https://graph.microsoft.com/v1.0/me/drive/root:/${path}:/content`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': file.mimeType,
        },
        body: blob,
      }
    );

    if (!response.ok) {
      throw new Error(`MS upload failed: ${response.status}`);
    }
    return (await response.json()) as MSFile;
  }

  async downloadFile(fileId: string): Promise<Blob> {
    const token = await this.loadStoredToken();
    if (!token) throw new Error('Not connected to Microsoft');

    const response = await fetch(
      `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/content`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!response.ok) {
      throw new Error(`MS download failed: ${response.status}`);
    }
    return response.blob();
  }

  async getFile(fileId: string): Promise<MSFile> {
    const token = await this.loadStoredToken();
    if (!token) throw new Error('Not connected to Microsoft');

    const response = await fetch(
      `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!response.ok) {
      throw new Error(`Get file failed: ${response.status}`);
    }
    return (await response.json()) as MSFile;
  }

  async attachToRecord(
    fileId: string,
    recordType: AttachableRecordType,
    recordId: string
  ): Promise<void> {
    const file = await this.getFile(fileId);
    await apiPost('/api/integrations/microsoft/attach', {
      provider: 'microsoft',
      externalFileId: fileId,
      fileName: file.name,
      webUrl: file.webUrl,
      recordType,
      recordId,
    });
  }
}

export const microsoftService = new MicrosoftService();
export default microsoftService;
