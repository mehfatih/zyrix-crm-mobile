/**
 * Shopify OAuth API module (mobile).
 *
 * Mirrors the web client against the backend's /api/integrations/shopify
 * module. The connect call passes ?platform=mobile so the backend redirects
 * to the app's deep link (zyrix://shopify/connected) when OAuth completes.
 * Tokens never cross this boundary — only an authorizeUrl + status.
 */

import { apiGet, apiPost } from './client';

interface Envelope<T> {
  success: boolean;
  data: T;
}

export interface ShopifyConnection {
  id: string;
  shopDomain: string;
  status: 'pending' | 'connected' | 'needs_reauth' | 'revoked' | 'error';
  scopes: string[];
  lastSyncAt: string | null;
  lastSyncDurationMs: number | null;
  tokenExpiresAt: string | null;
  needsReauth: boolean;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ShopifyLegacyStore {
  id: string;
  shopDomain: string;
  status: 'legacy_manual';
  isActive: boolean;
  lastSyncAt: string | null;
  syncStatus: string;
}

export interface ShopifyStatus {
  configured: boolean;
  connections: ShopifyConnection[];
  legacy: ShopifyLegacyStore[];
}

/** Start the OAuth flow; returns the authorize URL to open in the auth session. */
export const connectShopify = (shop: string): Promise<{ authorizeUrl: string }> =>
  apiPost<Envelope<{ authorizeUrl: string }>>(
    '/api/integrations/shopify/connect?platform=mobile',
    { shop }
  ).then((r) => r.data);

export const getShopifyStatus = (): Promise<ShopifyStatus> =>
  apiGet<Envelope<ShopifyStatus>>('/api/integrations/shopify/status').then((r) => r.data);

export const disconnectShopify = (id: string): Promise<{ disconnected: true }> =>
  apiPost<Envelope<{ disconnected: true }>>('/api/integrations/shopify/disconnect', {
    id,
  }).then((r) => r.data);

// ──────────────────────────────────────────────────────────────────────
// Error code → i18n key (mirrors the backend integration error registry).
// ──────────────────────────────────────────────────────────────────────
export const KNOWN_ERROR_CODES = [
  'SHOPIFY_NOT_CONFIGURED',
  'SHOPIFY_AUTH_FAILED',
  'SHOPIFY_CODE_EXCHANGE_FAILED',
  'STORE_NOT_FOUND',
  'MISSING_PERMISSIONS',
  'INVALID_SHOP_DOMAIN',
  'INVALID_STATE',
  'INVALID_HMAC',
  'RATE_LIMITED',
  'CONNECTION_TIMEOUT',
  'TOKEN_REFRESH_FAILED',
  'NEEDS_REAUTH',
  'INTERNAL_ERROR',
] as const;

export type IntegrationErrorCode = (typeof KNOWN_ERROR_CODES)[number];

export const errorCodeToKey = (code: string | null | undefined): IntegrationErrorCode =>
  code && (KNOWN_ERROR_CODES as readonly string[]).includes(code)
    ? (code as IntegrationErrorCode)
    : 'INTERNAL_ERROR';

/** Pull a stable code out of an ApiError-shaped rejection. */
export const extractErrorCode = (err: unknown): IntegrationErrorCode => {
  const code = (err as { code?: string })?.code;
  return errorCodeToKey(code);
};

export const shopIsValid = (shop: string): boolean => {
  const s = shop
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '');
  const full = s.includes('.') ? s : `${s}.myshopify.com`;
  return /^[a-z0-9][a-z0-9-]{1,60}[a-z0-9]\.myshopify\.com$/.test(full);
};
