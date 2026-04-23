/**
 * Thin wrapper around `expo-secure-store` that centralises the keys
 * Zyrix uses (auth + biometric tokens) and provides a single
 * `clearAll()` for logout. Items that should require biometric unlock
 * call `storeWithBiometric` which sets `requireAuthentication: true`.
 */

import * as SecureStore from 'expo-secure-store';

export const SECURE_KEYS = {
  authToken: 'zyrix.auth.token',
  refreshToken: 'zyrix.auth.refresh',
  biometricToken: 'zyrix.biometric.token',
  biometricUserId: 'zyrix.biometric.userId',
  encryptionKey: 'zyrix.local.encryptionKey',
  twoFactorTrustedUntil: 'zyrix.twoFactor.trustedUntil',
} as const;

export type SecureKey = (typeof SECURE_KEYS)[keyof typeof SECURE_KEYS];

const safe = async <T>(
  fn: () => Promise<T>,
  fallback: T,
  context: string
): Promise<T> => {
  try {
    return await fn();
  } catch (err) {
    console.warn('[secureStorage]', context, err);
    return fallback;
  }
};

export const storeToken = async (
  key: string,
  value: string
): Promise<void> => {
  await safe(
    () => SecureStore.setItemAsync(key, value),
    undefined as unknown as void,
    `setItem ${key}`
  );
};

export const getToken = async (key: string): Promise<string | null> =>
  safe(() => SecureStore.getItemAsync(key), null, `getItem ${key}`);

export const removeToken = async (key: string): Promise<void> => {
  await safe(
    () => SecureStore.deleteItemAsync(key),
    undefined as unknown as void,
    `delete ${key}`
  );
};

export const storeWithBiometric = async (
  key: string,
  value: string
): Promise<void> => {
  await safe(
    () =>
      SecureStore.setItemAsync(key, value, {
        requireAuthentication: true,
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      }),
    undefined as unknown as void,
    `setItem (biometric) ${key}`
  );
};

export const getWithBiometric = async (key: string): Promise<string | null> =>
  safe(
    () =>
      SecureStore.getItemAsync(key, {
        requireAuthentication: true,
      }),
    null,
    `getItem (biometric) ${key}`
  );

export const clearAll = async (): Promise<void> => {
  await Promise.all(
    Object.values(SECURE_KEYS).map((key) => removeToken(key))
  );
};
