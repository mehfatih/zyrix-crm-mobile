/**
 * setupResume — persists the user's onboarding progress so "Resume Setup"
 * can route them back to the exact step they last completed (spec §14.12).
 *
 * The authoritative store is the backend (`POST /api/onboarding/progress`),
 * but we also shadow-write to AsyncStorage so the resume flow works while
 * offline or before the backend call finishes.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import { apiPost } from '../api/client';
import { ENDPOINTS } from '../api/endpoints';

export type OnboardingStep = 1 | 2 | 3 | 4 | 5;

export interface OnboardingProgress {
  step: OnboardingStep;
  completed: boolean;
  updatedAt: number;
}

const STORAGE_KEY = 'zyrix.onboarding.progress';

const safeRead = async (): Promise<OnboardingProgress | null> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as OnboardingProgress;
    if (typeof parsed.step !== 'number') return null;
    return parsed;
  } catch (err) {
    console.warn('[setupResume] failed to read progress', err);
    return null;
  }
};

const safeWrite = async (value: OnboardingProgress): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch (err) {
    console.warn('[setupResume] failed to persist progress', err);
  }
};

const safeClear = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn('[setupResume] failed to clear progress', err);
  }
};

export const getOnboardingProgress = async (): Promise<OnboardingProgress | null> =>
  safeRead();

/**
 * Save progress — writes locally first, then POSTs to the backend. The
 * local write always wins: if the network call fails, the flow still
 * resumes correctly on relaunch.
 */
export const saveOnboardingProgress = async (
  step: OnboardingStep,
  completed = false
): Promise<void> => {
  const payload: OnboardingProgress = {
    step,
    completed,
    updatedAt: Date.now(),
  };
  await safeWrite(payload);
  try {
    await apiPost(ENDPOINTS.onboarding.PROGRESS, payload);
  } catch (err) {
    // Swallow — local write is enough for the resume flow, the backend
    // will catch up on the next successful call.
    console.warn('[setupResume] backend sync failed', err);
  }
};

export const clearOnboardingProgress = async (): Promise<void> => {
  await safeClear();
};
