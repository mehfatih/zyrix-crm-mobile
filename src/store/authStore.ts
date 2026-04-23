/**
 * Auth store — Zustand.
 *
 * Sprint 9 extends the original (Sprint 1) shape with security-related
 * fields:
 *   - sessionExpiry / lastActivity for the inactivity manager
 *   - twoFactorEnabled / twoFactorVerified for the 2FA flow
 *   - trustedDevice for "don't ask 2FA again on this device"
 *   - biometricEnabled mirrors `useBiometric` so screens can read it
 *
 * Tokens still live exclusively in `expo-secure-store`; the user
 * profile lives in `userStore` (AsyncStorage).
 */

import { create } from 'zustand';

import {
  SECURE_KEYS,
  clearAll as clearSecure,
  getToken as readSecure,
  storeToken as writeSecure,
} from '../utils/secureStorage';
import type { AuthUser, LoginResult } from '../types/auth';

const DEFAULT_SESSION_MS = 15 * 60 * 1000;

type SetState = (
  partial: Partial<AuthStoreState> | ((state: AuthStoreState) => Partial<AuthStoreState>)
) => void;

export interface AuthStoreState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasHydrated: boolean;

  // Sprint 9
  sessionExpiry: number;
  lastActivity: number;
  trustedDevice: boolean;
  twoFactorEnabled: boolean;
  twoFactorVerified: boolean;
  biometricEnabled: boolean;
  logoutReason: string | null;

  login: (result: LoginResult) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
  hydrate: () => Promise<void>;

  updateLastActivity: () => void;
  triggerLogout: (reason?: string) => Promise<void>;
  verifyTwoFactor: () => void;
  setTwoFactorEnabled: (enabled: boolean) => void;
  setBiometricEnabled: (enabled: boolean) => void;
  markTrustedDevice: (durationMs?: number) => void;
}

const applyLogin =
  (set: SetState) =>
  async ({ user, token }: LoginResult): Promise<void> => {
    await writeSecure(SECURE_KEYS.authToken, token);
    set({
      user,
      token,
      isAuthenticated: true,
      isLoading: false,
      lastActivity: Date.now(),
      sessionExpiry: Date.now() + DEFAULT_SESSION_MS,
      twoFactorVerified: false,
      logoutReason: null,
    });
  };

const applyLogout = (set: SetState) => async (): Promise<void> => {
  await clearSecure();
  set({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    twoFactorVerified: false,
    logoutReason: null,
  });
};

const applyHydrate = (set: SetState) => async (): Promise<void> => {
  set({ isLoading: true });
  const token = await readSecure(SECURE_KEYS.authToken);
  set({
    token,
    isAuthenticated: Boolean(token),
    isLoading: false,
    hasHydrated: true,
    lastActivity: Date.now(),
    sessionExpiry: Date.now() + DEFAULT_SESSION_MS,
  });
};

export const useAuthStore = create<AuthStoreState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  hasHydrated: false,

  sessionExpiry: Date.now() + DEFAULT_SESSION_MS,
  lastActivity: Date.now(),
  trustedDevice: false,
  twoFactorEnabled: false,
  twoFactorVerified: false,
  biometricEnabled: false,
  logoutReason: null,

  login: applyLogin(set),
  logout: applyLogout(set),
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ isLoading: loading }),
  hydrate: applyHydrate(set),

  updateLastActivity: () =>
    set({
      lastActivity: Date.now(),
      sessionExpiry: Date.now() + DEFAULT_SESSION_MS,
    }),
  triggerLogout: async (reason?: string) => {
    set({ logoutReason: reason ?? null });
    await applyLogout(set)();
  },
  verifyTwoFactor: () => set({ twoFactorVerified: true }),
  setTwoFactorEnabled: (enabled) => set({ twoFactorEnabled: enabled }),
  setBiometricEnabled: (enabled) => set({ biometricEnabled: enabled }),
  markTrustedDevice: (durationMs = 30 * 24 * 60 * 60 * 1000) => {
    set({ trustedDevice: true });
    void writeSecure(
      SECURE_KEYS.twoFactorTrustedUntil,
      String(Date.now() + durationMs)
    );
  },
}));

export const AUTH_TOKEN_STORAGE_KEY = SECURE_KEYS.authToken;
