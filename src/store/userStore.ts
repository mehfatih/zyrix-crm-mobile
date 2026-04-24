/**
 * User store — Zustand.
 *
 * Holds the fully-hydrated profile for the authenticated user (role,
 * permissions, preferences). Persisted to AsyncStorage so the profile
 * survives app restarts even if the secure-store token read happens
 * later in the boot sequence.
 *
 * This store is separate from `authStore` on purpose: auth cares about
 * "is there a valid session?" and holds the token; userStore cares
 * about "who is this person and what can they do?".
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  EMPTY_PERMISSIONS,
  getPermissionsForRole,
  type User,
  type UserPermissions,
  type UserRole,
} from '../types/auth';

const USER_STORAGE_KEY = 'zyrix.user.profile';
const BIOMETRIC_FLAG_KEY = 'zyrix.user.biometricEnabled';

type SetState = (
  partial:
    | Partial<UserStoreState>
    | ((state: UserStoreState) => Partial<UserStoreState>)
) => void;

type GetState = () => UserStoreState;

const safeWrite = async (key: string, value: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(key, value);
  } catch (err) {
    console.warn('[userStore] failed to persist', key, err);
  }
};

const safeRead = async (key: string): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(key);
  } catch (err) {
    console.warn('[userStore] failed to read', key, err);
    return null;
  }
};

const safeRemove = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (err) {
    console.warn('[userStore] failed to clear', key, err);
  }
};

export interface UserStoreState {
  currentUser: User | null;
  permissions: UserPermissions;
  hasHydrated: boolean;
  biometricEnabled: boolean;

  setUser: (user: User | null) => Promise<void>;
  updateProfile: (partial: Partial<Omit<User, 'id' | 'permissions'>>) => Promise<void>;
  setRole: (role: UserRole) => Promise<void>;
  clearUser: () => Promise<void>;
  hydrate: () => Promise<void>;
  setBiometricEnabled: (enabled: boolean) => Promise<void>;
}

const applySetUser =
  (set: SetState) =>
  async (user: User | null): Promise<void> => {
    if (!user) {
      await safeRemove(USER_STORAGE_KEY);
      set({ currentUser: null, permissions: { ...EMPTY_PERMISSIONS } });
      return;
    }
    await safeWrite(USER_STORAGE_KEY, JSON.stringify(user));
    set({ currentUser: user, permissions: user.permissions });
  };

const applyUpdateProfile =
  (set: SetState, get: GetState) =>
  async (
    partial: Partial<Omit<User, 'id' | 'permissions'>>
  ): Promise<void> => {
    const current = get().currentUser;
    if (!current) return;
    const next: User = { ...current, ...partial };
    await safeWrite(USER_STORAGE_KEY, JSON.stringify(next));
    set({ currentUser: next });
  };

const applySetRole =
  (set: SetState, get: GetState) =>
  async (role: UserRole): Promise<void> => {
    const current = get().currentUser;
    if (!current) return;
    const permissions = getPermissionsForRole(role);
    const next: User = { ...current, role, permissions };
    await safeWrite(USER_STORAGE_KEY, JSON.stringify(next));
    set({ currentUser: next, permissions });
  };

const applyClearUser = (set: SetState) => async (): Promise<void> => {
  await safeRemove(USER_STORAGE_KEY);
  await safeRemove(BIOMETRIC_FLAG_KEY);
  set({
    currentUser: null,
    permissions: { ...EMPTY_PERMISSIONS },
    biometricEnabled: false,
  });
};

const applySetBiometricEnabled =
  (set: SetState) =>
  async (enabled: boolean): Promise<void> => {
    if (enabled) {
      await safeWrite(BIOMETRIC_FLAG_KEY, 'true');
    } else {
      await safeRemove(BIOMETRIC_FLAG_KEY);
    }
    set({ biometricEnabled: enabled });
  };

const applyHydrate = (set: SetState) => async (): Promise<void> => {
  const [raw, bioFlag] = await Promise.all([
    safeRead(USER_STORAGE_KEY),
    safeRead(BIOMETRIC_FLAG_KEY),
  ]);
  const biometricEnabled = bioFlag === 'true';
  if (!raw) {
    set({ hasHydrated: true, biometricEnabled });
    return;
  }
  try {
    const parsed = JSON.parse(raw) as User;
    set({
      currentUser: parsed,
      permissions: parsed.permissions ?? { ...EMPTY_PERMISSIONS },
      hasHydrated: true,
      biometricEnabled,
    });
  } catch (err) {
    console.warn('[userStore] corrupt profile blob — dropping', err);
    await safeRemove(USER_STORAGE_KEY);
    set({ hasHydrated: true, biometricEnabled });
  }
};

export const useUserStore = create<UserStoreState>((set, get) => ({
  currentUser: null,
  permissions: { ...EMPTY_PERMISSIONS },
  hasHydrated: false,
  biometricEnabled: false,

  setUser: applySetUser(set),
  updateProfile: applyUpdateProfile(set, get),
  setRole: applySetRole(set, get),
  clearUser: applyClearUser(set),
  hydrate: applyHydrate(set),
  setBiometricEnabled: applySetBiometricEnabled(set),
}));

export const USER_STORAGE_KEY_EXPORT = USER_STORAGE_KEY;
export const BIOMETRIC_FLAG_KEY_EXPORT = BIOMETRIC_FLAG_KEY;
