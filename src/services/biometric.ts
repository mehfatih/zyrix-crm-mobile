/**
 * biometric service — public surface for App Sprint 2 biometric login.
 * Re-exports the underlying helpers in `utils/biometrics` so screens
 * can import from a single, sprint-aligned path.
 */

export {
  authenticate,
  disableBiometricLogin,
  enableBiometricLogin,
  isBiometricAvailable,
  isBiometricLoginEnabled,
  loginWithBiometric,
  type BiometricAvailability,
  type BiometricType,
} from '../utils/biometrics';
