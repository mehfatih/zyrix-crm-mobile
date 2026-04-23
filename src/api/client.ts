/**
 * Axios client for the Zyrix backend.
 *
 * - Pulls the bearer token out of `authStore` on every request.
 * - Tags requests with `X-Client-Type`, `X-App-Version`, `X-App-Platform`
 *   so the backend can segment mobile traffic.
 * - Clears the session on 401, surfaces IP-allowlist issues on 403, and
 *   retries once on network errors (exponential backoff).
 *
 * Each resource module (`src/api/customers.ts`, etc.) imports the
 * typed helpers `get<T>`, `post<T>`, `put<T>`, `patch<T>`, `delete<T>`
 * from here rather than talking to axios directly — keeps logging and
 * error normalisation in one place.
 */

import axios, {
  AxiosError,
  AxiosHeaders,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

import type { ApiError } from './types';
import { useAuthStore } from '../store/authStore';

const DEFAULT_TIMEOUT_MS = 20_000;
const MAX_RETRIES = 1;
const BACKOFF_MS = 600;

const resolveBaseUrl = (): string => {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv && fromEnv.trim().length > 0) return fromEnv.trim();
  return 'https://api.crm.zyrix.co';
};

const resolveVersion = (): string => {
  const extra = Constants.expoConfig?.version;
  return typeof extra === 'string' && extra ? extra : '1.0.0';
};

const client: AxiosInstance = axios.create({
  baseURL: resolveBaseUrl(),
  timeout: DEFAULT_TIMEOUT_MS,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().token;
  const headers = AxiosHeaders.from(config.headers ?? {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  headers.set('X-Client-Type', 'mobile-app');
  headers.set('X-App-Version', resolveVersion());
  headers.set('X-App-Platform', Platform.OS);
  config.headers = headers;
  return config;
});

interface RetryableConfig extends InternalAxiosRequestConfig {
  _retryCount?: number;
}

type ServerErrorShape = {
  code?: string;
  message?: string;
  error?: { code?: string; message?: string };
  details?: Record<string, unknown>;
};

const extractApiError = (err: AxiosError<ServerErrorShape>): ApiError => {
  const data = err.response?.data;
  const code =
    data?.code ?? data?.error?.code ?? err.code ?? `HTTP_${err.response?.status ?? 'NETWORK'}`;
  const message =
    data?.message ?? data?.error?.message ?? err.message ?? 'Request failed';
  return { code: String(code), message: String(message), details: data?.details };
};

type IPNotAllowedListener = (details: {
  reason?: string;
  currentIP?: string;
  allowedIPs?: string[];
  userRole?: string;
  message: string;
}) => void;

const ipListeners = new Set<IPNotAllowedListener>();

export const onIPNotAllowed = (listener: IPNotAllowedListener): (() => void) => {
  ipListeners.add(listener);
  return () => {
    ipListeners.delete(listener);
  };
};

const onIpNotAllowed = (
  message: string,
  details?: Record<string, unknown>
): void => {
  console.warn('[api] IP not allowed:', message, details);
  const reason = typeof details?.reason === 'string' ? details.reason : undefined;
  const currentIP =
    typeof details?.currentIP === 'string' ? details.currentIP : undefined;
  const userRole =
    typeof details?.userRole === 'string' ? details.userRole : undefined;
  const allowedIPs = Array.isArray(details?.allowedIPs)
    ? (details.allowedIPs as string[])
    : undefined;
  const payload = { reason, currentIP, allowedIPs, userRole, message };
  ipListeners.forEach((listener) => {
    try {
      listener(payload);
    } catch (err) {
      console.warn('[api] ip listener failed', err);
    }
  });
  // Fire-and-forget security audit entry so the backend knows the
  // blocked attempt happened.
  void import('../utils/securityEvents').then(({ logSecurityEvent }) =>
    logSecurityEvent('permission_denied', {
      resource: 'ip_allowlist',
      reason: reason ?? 'IP_NOT_ALLOWED',
      ipAddress: currentIP,
      userRole,
    })
  );
};

const onServerError = (message: string): void => {
  console.warn('[api] 5xx error:', message);
};

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

client.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ServerErrorShape>) => {
    const config = (error.config ?? {}) as RetryableConfig;
    const status = error.response?.status;

    if (status === 401) {
      try {
        await useAuthStore.getState().logout();
      } catch (logoutErr) {
        console.warn('[api] logout on 401 failed', logoutErr);
      }
      return Promise.reject(extractApiError(error));
    }

    if (status === 403) {
      const normalized = extractApiError(error);
      if (normalized.code === 'IP_NOT_ALLOWED') {
        onIpNotAllowed(normalized.message, normalized.details);
      }
      return Promise.reject(normalized);
    }

    if (status && status >= 500) {
      onServerError(extractApiError(error).message);
      return Promise.reject(extractApiError(error));
    }

    const isNetworkError = !error.response;
    if (isNetworkError) {
      config._retryCount = (config._retryCount ?? 0) + 1;
      if (config._retryCount <= MAX_RETRIES) {
        const delay = BACKOFF_MS * 2 ** (config._retryCount - 1);
        await sleep(delay);
        return client.request(config);
      }
    }

    return Promise.reject(extractApiError(error));
  }
);

const unwrap = <T,>(res: AxiosResponse<T>): T => res.data;

export const apiGet = <T,>(url: string, config?: AxiosRequestConfig): Promise<T> =>
  client.get<T>(url, config).then(unwrap);

export const apiPost = <T,>(
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig
): Promise<T> => client.post<T>(url, body, config).then(unwrap);

export const apiPut = <T,>(
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig
): Promise<T> => client.put<T>(url, body, config).then(unwrap);

export const apiPatch = <T,>(
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig
): Promise<T> => client.patch<T>(url, body, config).then(unwrap);

export const apiDelete = <T,>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> => client.delete<T>(url, config).then(unwrap);

export { client as axiosClient };
