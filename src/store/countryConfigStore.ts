/**
 * Country configuration store — Zustand.
 *
 * Persists the user's selected country to AsyncStorage so formatting,
 * tax rules, payment methods and phone codes survive app restarts.
 * The full `Country` object is resolved lazily from `SUPPORTED_COUNTRIES`
 * on rehydrate rather than re-serialised — that way schema changes to
 * Country don't corrupt stored data.
 *
 * Mirrors the pattern in `userStore.ts` (plain async helpers, no
 * zustand/middleware/persist) for consistency across the codebase.
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  SUPPORTED_COUNTRIES,
  findCountry,
  isCountryCode,
} from '../constants/countries';
import type { Country, CountryCode } from '../types/country';

const COUNTRY_STORAGE_KEY = 'zyrix.country.code';

type SetState = (
  partial:
    | Partial<CountryConfigStoreState>
    | ((state: CountryConfigStoreState) => Partial<CountryConfigStoreState>)
) => void;

type GetState = () => CountryConfigStoreState;

const safeWrite = async (key: string, value: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(key, value);
  } catch (err) {
    console.warn('[countryConfigStore] failed to persist', key, err);
  }
};

const safeRead = async (key: string): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(key);
  } catch (err) {
    console.warn('[countryConfigStore] failed to read', key, err);
    return null;
  }
};

const safeRemove = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (err) {
    console.warn('[countryConfigStore] failed to clear', key, err);
  }
};

export interface CountryConfigStoreState {
  countryCode: CountryCode | null;
  countryConfig: Country | null;
  hasHydrated: boolean;

  setCountry: (code: CountryCode) => Promise<void>;
  resetCountry: () => Promise<void>;
  getCurrentConfig: () => Country;
  hydrate: () => Promise<void>;
}

const applySetCountry =
  (set: SetState) =>
  async (code: CountryCode): Promise<void> => {
    const config = findCountry(code);
    await safeWrite(COUNTRY_STORAGE_KEY, code);
    set({ countryCode: code, countryConfig: config });
  };

const applyResetCountry = (set: SetState) => async (): Promise<void> => {
  await safeRemove(COUNTRY_STORAGE_KEY);
  set({ countryCode: null, countryConfig: null });
};

const applyGetCurrentConfig =
  (get: GetState) =>
  (): Country => {
    const stored = get().countryConfig;
    if (stored) return stored;
    return findCountry(null);
  };

const applyHydrate = (set: SetState) => async (): Promise<void> => {
  const raw = await safeRead(COUNTRY_STORAGE_KEY);
  if (!isCountryCode(raw)) {
    set({ hasHydrated: true });
    return;
  }
  set({
    countryCode: raw,
    countryConfig: findCountry(raw),
    hasHydrated: true,
  });
};

export const useCountryConfigStore = create<CountryConfigStoreState>(
  (set, get) => ({
    countryCode: null,
    countryConfig: null,
    hasHydrated: false,

    setCountry: applySetCountry(set),
    resetCountry: applyResetCountry(set),
    getCurrentConfig: applyGetCurrentConfig(get),
    hydrate: applyHydrate(set),
  })
);

export const COUNTRY_STORAGE_KEY_EXPORT = COUNTRY_STORAGE_KEY;
export { SUPPORTED_COUNTRIES };
