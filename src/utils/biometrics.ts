/**
 * Biometric authentication helpers built on top of
 * `expo-local-authentication`. Tokens unlocked by biometrics live in
 * SecureStore with `requireAuthentication: true` so the OS handles
 * the prompt natively.
 */

import * as LocalAuthentication from 'expo-local-authentication';

import {
  SECURE_KEYS,
  getToken,
  getWithBiometric,
  removeToken,
  storeToken,
  storeWithBiometric,
} from './secureStorage';

export type BiometricType =
  | 'FaceID'
  | 'TouchID'
  | 'Fingerprint'
  | 'Iris'
  | null;

export interface BiometricAvailability {
  available: boolean;
  type: BiometricType;
}

const mapType = (
  types: LocalAuthentication.AuthenticationType[]
): BiometricType => {
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
    return 'FaceID';
  }
  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    return 'TouchID';
  }
  if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
    return 'Iris';
  }
  return null;
};

export const isBiometricAvailable = async (): Promise<BiometricAvailability> => {
  try {
    const [hasHardware, isEnrolled, types] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
      LocalAuthentication.supportedAuthenticationTypesAsync(),
    ]);
    if (!hasHardware || !isEnrolled) {
      return { available: false, type: null };
    }
    return { available: true, type: mapType(types) };
  } catch (err) {
    console.warn('[biometrics] isAvailable failed', err);
    return { available: false, type: null };
  }
};

export const authenticate = async (
  promptMessage: string
): Promise<boolean> => {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
      fallbackLabel: 'Use passcode',
    });
    return result.success;
  } catch (err) {
    console.warn('[biometrics] authenticate failed', err);
    return false;
  }
};

export const enableBiometricLogin = async (
  token: string,
  userId: string
): Promise<void> => {
  await storeWithBiometric(SECURE_KEYS.biometricToken, token);
  await storeToken(SECURE_KEYS.biometricUserId, userId);
};

export const disableBiometricLogin = async (): Promise<void> => {
  await Promise.all([
    removeToken(SECURE_KEYS.biometricToken),
    removeToken(SECURE_KEYS.biometricUserId),
  ]);
};

export const isBiometricLoginEnabled = async (): Promise<boolean> => {
  const userId = await getToken(SECURE_KEYS.biometricUserId);
  return Boolean(userId);
};

export const loginWithBiometric = async (
  promptMessage = 'Authenticate to continue'
): Promise<{ token: string; userId: string } | null> => {
  const userId = await getToken(SECURE_KEYS.biometricUserId);
  if (!userId) return null;
  const ok = await authenticate(promptMessage);
  if (!ok) return null;
  const token = await getWithBiometric(SECURE_KEYS.biometricToken);
  if (!token) return null;
  return { token, userId };
};
