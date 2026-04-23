/**
 * Public-IP + geolocation helpers. The backend `/api/auth/whoami`
 * returns the IP it sees for the current request along with country/
 * city/ISP context. Cached for 5 minutes per process.
 */

import { apiGet } from '../api/client';

export interface IPInfo {
  ip: string;
  country?: string;
  city?: string;
  isp?: string;
}

const CACHE_TTL_MS = 5 * 60 * 1000;
let cache: { value: IPInfo; expiresAt: number } | null = null;

const USE_MOCKS = true;

const fakeIPInfo = (): IPInfo => ({
  ip: '212.118.45.12',
  country: 'SA',
  city: 'Riyadh',
  isp: 'Mobily',
});

export const getCurrentIP = async (): Promise<string> => {
  const info = await getIPInfo();
  return info.ip;
};

export const getIPInfo = async (force = false): Promise<IPInfo> => {
  if (!force && cache && cache.expiresAt > Date.now()) {
    return cache.value;
  }
  if (USE_MOCKS) {
    cache = { value: fakeIPInfo(), expiresAt: Date.now() + CACHE_TTL_MS };
    return cache.value;
  }
  try {
    const value = await apiGet<IPInfo>('/api/auth/whoami');
    cache = { value, expiresAt: Date.now() + CACHE_TTL_MS };
    return value;
  } catch (err) {
    console.warn('[ipDetection] whoami failed, returning unknown', err);
    return { ip: '0.0.0.0' };
  }
};

export const invalidateIPCache = (): void => {
  cache = null;
};
