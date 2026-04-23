/**
 * Security audit-event emitter. Calls a backend endpoint to persist
 * the event. Until the backend lands the event is logged locally so
 * we can verify the call sites are wired correctly.
 */

import { Platform } from 'react-native';

import { apiPost } from '../api/client';
import { getCurrentIP } from './ipDetection';

export type SecurityEventType =
  | 'login_success'
  | 'login_failure'
  | 'biometric_success'
  | 'biometric_failure'
  | 'two_factor_success'
  | 'two_factor_failure'
  | 'suspicious_activity'
  | 'permission_denied'
  | 'session_timeout'
  | 'device_revoked'
  | 'password_changed'
  | '2fa_enabled'
  | '2fa_disabled'
  | 'jailbreak_detected'
  | 'sensitive_action_attempt'
  | 'sensitive_action_success';

export interface SecurityEventMetadata {
  resource?: string;
  resourceId?: string;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
  [key: string]: string | number | boolean | undefined;
}

const USE_MOCKS = true;

export const logSecurityEvent = async (
  type: SecurityEventType,
  metadata: SecurityEventMetadata = {}
): Promise<void> => {
  const enriched: SecurityEventMetadata = {
    ...metadata,
    platform: Platform.OS,
  };
  if (!enriched.ipAddress) {
    try {
      enriched.ipAddress = await getCurrentIP();
    } catch (err) {
      console.warn('[securityEvents] failed to resolve IP', err);
    }
  }

  if (USE_MOCKS) {
    console.info('[security]', type, enriched);
    return;
  }
  try {
    await apiPost('/api/admin/audit-log/security', {
      type,
      metadata: enriched,
    });
  } catch (err) {
    console.warn('[security] event log failed', type, err);
  }
};
