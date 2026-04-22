/**
 * Auth store — Zustand.
 *
 * The token is stored securely via expo-secure-store. The user object is
 * kept only in memory; consumers should re-fetch the profile from the API
 * after `hydrate()`.
 */

import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

import type { AuthUser, LoginResult } from '../types/auth';

const TOKEN_KEY = 'zyrix.auth.token';

type SetState = (
  partial: Partial<AuthStoreState> | ((state: AuthStoreState) => Partial<AuthStoreState>)
) => void;

const safeSetItem = async (key: string, value: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch (err) {
    console.warn('[authStore] failed to persist token', err);
  }
};

const safeGetItem = async (key: string): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(key);
  } catch (err) {
    console.warn('[authStore] failed to read token', err);
    return null;
  }
};

const safeDeleteItem = async (key: string): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch (err) {
    console.warn('[authStore] failed to clear token', err);
  }
};

export interface AuthStoreState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasHydrated: boolean;

  login: (result: LoginResult) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
  hydrate: () => Promise<void>;
}

const applyLogin =
  (set: SetState) =>
  async ({ user, token }: LoginResult): Promise<void> => {
    await safeSetItem(TOKEN_KEY, token);
    set({
      user,
      token,
      isAuthenticated: true,
      isLoading: false,
    });
  };

const applyLogout = (set: SetState) => async (): Promise<void> => {
  await safeDeleteItem(TOKEN_KEY);
  set({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
  });
};

const applyHydrate = (set: SetState) => async (): Promise<void> => {
  set({ isLoading: true });
  const token = await safeGetItem(TOKEN_KEY);
  set({
    token,
    isAuthenticated: Boolean(token),
    isLoading: false,
    hasHydrated: true,
  });
};

export const useAuthStore = create<AuthStoreState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  hasHydrated: false,

  login: applyLogin(set),
  logout: applyLogout(set),
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ isLoading: loading }),
  hydrate: applyHydrate(set),
}));

export const AUTH_TOKEN_STORAGE_KEY = TOKEN_KEY;
