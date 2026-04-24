/**
 * pinnedStore — persistent list of sidebar items the user has pinned to
 * the top of the SmartSidebar. Defaults to Home + Today's tasks + Deals
 * pipeline so the section is never empty on first launch.
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PINNED_STORAGE_KEY = 'zyrix.sidebar.pinned';

export const DEFAULT_PINS: readonly string[] = ['Home', 'Tasks', 'Deals'];

type SetState = (
  partial:
    | Partial<PinnedStoreState>
    | ((s: PinnedStoreState) => Partial<PinnedStoreState>)
) => void;

type GetState = () => PinnedStoreState;

const safeWrite = async (value: string[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(PINNED_STORAGE_KEY, JSON.stringify(value));
  } catch (err) {
    console.warn('[pinnedStore] persist failed', err);
  }
};

const safeRead = async (): Promise<string[] | null> => {
  try {
    const raw = await AsyncStorage.getItem(PINNED_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed.filter((v): v is string => typeof v === 'string');
  } catch (err) {
    console.warn('[pinnedStore] read failed', err);
    return null;
  }
};

export interface PinnedStoreState {
  pins: string[];
  hasHydrated: boolean;
  hydrate: () => Promise<void>;
  togglePin: (route: string) => Promise<void>;
  isPinned: (route: string) => boolean;
  reset: () => Promise<void>;
}

const applyHydrate = (set: SetState) => async (): Promise<void> => {
  const stored = await safeRead();
  set({
    pins: stored && stored.length > 0 ? stored : [...DEFAULT_PINS],
    hasHydrated: true,
  });
};

const applyTogglePin =
  (set: SetState, get: GetState) =>
  async (route: string): Promise<void> => {
    const current = get().pins;
    const next = current.includes(route)
      ? current.filter((r) => r !== route)
      : [...current, route];
    await safeWrite(next);
    set({ pins: next });
  };

const applyReset = (set: SetState) => async (): Promise<void> => {
  await safeWrite([...DEFAULT_PINS]);
  set({ pins: [...DEFAULT_PINS] });
};

export const usePinnedStore = create<PinnedStoreState>((set, get) => ({
  pins: [...DEFAULT_PINS],
  hasHydrated: false,
  hydrate: applyHydrate(set),
  togglePin: applyTogglePin(set, get),
  isPinned: (route: string) => get().pins.includes(route),
  reset: applyReset(set),
}));

export const PINNED_STORAGE_KEY_EXPORT = PINNED_STORAGE_KEY;
