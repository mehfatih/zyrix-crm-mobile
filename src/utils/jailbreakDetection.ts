/**
 * Wraps `jail-monkey` into a small, typed helper. We expose individual
 * checks plus a combined `isCompromised()` so the host app can decide
 * how strict to be (block vs warn).
 */

import { Platform } from 'react-native';
import JailMonkey from 'jail-monkey';

export interface JailbreakReport {
  platform: 'ios' | 'android' | 'web' | string;
  isJailbroken: boolean;
  isRooted: boolean;
  isDebuggingEnabled: boolean;
  isExternalStorage: boolean;
  hasHooks: boolean;
  isOnExternalStorage: boolean;
}

const safe = <T>(fn: () => T, fallback: T): T => {
  try {
    return fn();
  } catch (err) {
    console.warn('[jailbreak] check failed', err);
    return fallback;
  }
};

export const isRooted = (): boolean =>
  Platform.OS === 'android'
    ? safe(() => Boolean(JailMonkey.isJailBroken?.()), false)
    : false;

export const isJailbroken = (): boolean =>
  Platform.OS === 'ios'
    ? safe(() => Boolean(JailMonkey.isJailBroken?.()), false)
    : false;

export const isDebuggingEnabled = (): boolean =>
  safe(() => Boolean(JailMonkey.isDebuggedMode?.()), false);

export const isExternalStorage = (): boolean =>
  safe(() => Boolean(JailMonkey.isOnExternalStorage?.()), false);

export const hasHooks = (): boolean =>
  safe(() => Boolean(JailMonkey.hookDetected?.()), false);

export const isCompromised = (): boolean =>
  isRooted() || isJailbroken() || hasHooks();

export const getDetailedReport = (): JailbreakReport => ({
  platform: Platform.OS,
  isJailbroken: isJailbroken(),
  isRooted: isRooted(),
  isDebuggingEnabled: isDebuggingEnabled(),
  isExternalStorage: isExternalStorage(),
  hasHooks: hasHooks(),
  isOnExternalStorage: isExternalStorage(),
});
