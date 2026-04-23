/**
 * Session inactivity manager.
 *
 * The store-level state is a small singleton that tracks when the
 * user last interacted with the app. The `useSessionTimeout` hook
 * subscribes a component to backgrounding + the timer reaching zero
 * so it can render a re-auth prompt.
 *
 * Touch tracking is delegated to `<InactivityTracker />` which calls
 * `resetTimer()` on every gesture; AppState transitions are handled
 * here directly so background → foreground triggers a 30-second
 * grace check.
 */

import { useEffect, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { logSecurityEvent } from './securityEvents';

const DEFAULT_TIMEOUT_MINUTES = 15;
const BACKGROUND_GRACE_MS = 30_000;

type Listener = () => void;

interface SessionState {
  timeoutMinutes: number;
  lastActivityAt: number;
  backgroundedAt: number | null;
  pollHandle: ReturnType<typeof setInterval> | null;
  listeners: Set<Listener>;
  appStateSub: { remove: () => void } | null;
}

const state: SessionState = {
  timeoutMinutes: DEFAULT_TIMEOUT_MINUTES,
  lastActivityAt: Date.now(),
  backgroundedAt: null,
  pollHandle: null,
  listeners: new Set(),
  appStateSub: null,
};

const fireExpired = (reason: 'idle' | 'background'): void => {
  void logSecurityEvent('session_timeout', { reason });
  state.listeners.forEach((listener) => {
    try {
      listener();
    } catch (err) {
      console.warn('[session] listener failed', err);
    }
  });
};

const tick = (): void => {
  const idleMs = Date.now() - state.lastActivityAt;
  const limitMs = state.timeoutMinutes * 60 * 1000;
  if (idleMs >= limitMs) {
    fireExpired('idle');
    state.lastActivityAt = Date.now();
  }
};

const handleAppStateChange = (next: AppStateStatus): void => {
  if (next === 'background' || next === 'inactive') {
    state.backgroundedAt = Date.now();
    return;
  }
  if (next === 'active' && state.backgroundedAt) {
    const offlineMs = Date.now() - state.backgroundedAt;
    state.backgroundedAt = null;
    if (offlineMs > BACKGROUND_GRACE_MS) {
      fireExpired('background');
    }
  }
};

export const startInactivityTimer = (
  timeoutMinutes: number = DEFAULT_TIMEOUT_MINUTES
): void => {
  state.timeoutMinutes = timeoutMinutes;
  state.lastActivityAt = Date.now();
  if (state.pollHandle) clearInterval(state.pollHandle);
  state.pollHandle = setInterval(tick, 30_000);
  state.appStateSub?.remove();
  state.appStateSub = AppState.addEventListener('change', handleAppStateChange);
};

export const stopInactivityTimer = (): void => {
  if (state.pollHandle) {
    clearInterval(state.pollHandle);
    state.pollHandle = null;
  }
  state.appStateSub?.remove();
  state.appStateSub = null;
};

export const resetTimer = (): void => {
  state.lastActivityAt = Date.now();
};

export const setSessionTimeoutMinutes = (minutes: number): void => {
  state.timeoutMinutes = minutes;
};

export const getSessionTimeoutMinutes = (): number => state.timeoutMinutes;

export const onSessionTimeout = (listener: Listener): (() => void) => {
  state.listeners.add(listener);
  return () => {
    state.listeners.delete(listener);
  };
};

export const useSessionTimeout = (
  callback: () => void
): { lastActivityAt: number } => {
  const [lastActivityAt, setLastActivityAt] = useState(state.lastActivityAt);

  useEffect(() => {
    const unsubscribe = onSessionTimeout(() => {
      setLastActivityAt(Date.now());
      callback();
    });
    return unsubscribe;
  }, [callback]);

  return { lastActivityAt };
};
