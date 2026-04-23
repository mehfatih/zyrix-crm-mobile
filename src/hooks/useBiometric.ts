/**
 * useBiometric — React-friendly view over the biometric helpers in
 * `utils/biometrics`. Components subscribe to `isAvailable`, `isEnabled`,
 * and the platform `type`, and call `enable()` / `disable()` /
 * `login()` from event handlers.
 */

import { useCallback, useEffect, useState } from 'react';

import {
  authenticate,
  disableBiometricLogin,
  enableBiometricLogin,
  isBiometricAvailable,
  isBiometricLoginEnabled,
  loginWithBiometric,
  type BiometricType,
} from '../utils/biometrics';
import { logSecurityEvent } from '../utils/securityEvents';

export interface UseBiometricApi {
  isAvailable: boolean;
  isEnabled: boolean;
  type: BiometricType;
  isLoading: boolean;
  checkAvailability: () => Promise<void>;
  enable: (token: string, userId: string) => Promise<boolean>;
  disable: () => Promise<void>;
  login: () => Promise<{ token: string; userId: string } | null>;
  promptOnly: (message?: string) => Promise<boolean>;
}

export const useBiometric = (): UseBiometricApi => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [type, setType] = useState<BiometricType>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAvailability = useCallback(async () => {
    setIsLoading(true);
    try {
      const [availability, enabled] = await Promise.all([
        isBiometricAvailable(),
        isBiometricLoginEnabled(),
      ]);
      setIsAvailable(availability.available);
      setType(availability.type);
      setIsEnabled(enabled);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void checkAvailability();
  }, [checkAvailability]);

  const enable = useCallback(
    async (token: string, userId: string): Promise<boolean> => {
      const ok = await authenticate('Confirm to enable biometric login');
      if (!ok) {
        await logSecurityEvent('biometric_failure', { reason: 'enable cancelled' });
        return false;
      }
      await enableBiometricLogin(token, userId);
      setIsEnabled(true);
      await logSecurityEvent('biometric_success', { reason: 'enabled' });
      return true;
    },
    []
  );

  const disable = useCallback(async () => {
    await disableBiometricLogin();
    setIsEnabled(false);
    await logSecurityEvent('biometric_success', { reason: 'disabled' });
  }, []);

  const login = useCallback(async () => {
    const result = await loginWithBiometric('Login to Zyrix CRM');
    if (!result) {
      await logSecurityEvent('biometric_failure', { reason: 'login cancelled' });
      return null;
    }
    await logSecurityEvent('biometric_success', { reason: 'login' });
    return result;
  }, []);

  const promptOnly = useCallback(async (message?: string) => {
    const ok = await authenticate(message ?? 'Confirm your identity');
    await logSecurityEvent(
      ok ? 'biometric_success' : 'biometric_failure',
      { reason: 'prompt' }
    );
    return ok;
  }, []);

  return {
    isAvailable,
    isEnabled,
    type,
    isLoading,
    checkAvailability,
    enable,
    disable,
    login,
    promptOnly,
  };
};
