/**
 * status-tones.ts — central tone system for the StatusPill component (M25).
 *
 * Defines the five semantic tones (success/warning/error/info/neutral),
 * their visual treatment in TONE_COLORS, and a set of domain-specific
 * "STATUS → tone" maps used across the app's pipeline, billing, refund,
 * campaign and system-health screens.
 *
 * `getToneForStatus` is a generic fallback for cases where the caller
 * doesn't know which domain map applies (e.g. mixed feeds).
 */

import { darkColors } from '../../theme/dark';

/**
 * StatusTone — semantic UI tones for the StatusPill component.
 * Maps to colors via TONE_COLORS below.
 */
export type StatusTone = 'success' | 'warning' | 'error' | 'info' | 'neutral';

/**
 * TONE_COLORS — central source of truth for tone visual treatment.
 * Each tone has: background (~12% tint via xxxSoft), border (40% opacity
 * of the base color), text (full color).
 */
export const TONE_COLORS: Record<
  StatusTone,
  {
    background: string;
    border: string;
    text: string;
  }
> = {
  success: {
    background: darkColors.successSoft,
    border: darkColors.success + '66', // ~40% opacity
    text: darkColors.success,
  },
  warning: {
    background: darkColors.warningSoft,
    border: darkColors.warning + '66',
    text: darkColors.warning,
  },
  error: {
    background: darkColors.errorSoft,
    border: darkColors.error + '66',
    text: darkColors.error,
  },
  info: {
    background: darkColors.infoSoft,
    border: darkColors.info + '66',
    text: darkColors.info,
  },
  neutral: {
    background: darkColors.surfaceAlt,
    border: darkColors.border,
    text: darkColors.textMuted,
  },
};

/**
 * RISK_TONE — maps risk levels to status tones.
 * Use for customer health, lead scoring, churn risk, etc.
 */
export const RISK_TONE: Record<string, StatusTone> = {
  low: 'success',
  medium: 'warning',
  high: 'error',
  // Aliases
  good: 'success',
  ok: 'warning',
  risk: 'error',
};

/**
 * STAGE_TONE — maps deal pipeline stages to status tones.
 * The mobile app uses 6 stages: lead/qualified/proposal/negotiation/won/lost.
 */
export const STAGE_TONE: Record<string, StatusTone> = {
  lead: 'neutral',
  qualified: 'info',
  proposal: 'warning',
  negotiation: 'info',
  closing: 'success', // alternate naming
  won: 'success',
  lost: 'error',
};

/**
 * SEGMENT_TONE — maps customer segments to status tones.
 * Used for customer classification (Champion/Loyal/Newcomer/AtRisk).
 */
export const SEGMENT_TONE: Record<string, StatusTone> = {
  Champion: 'success',
  Loyal: 'info',
  Newcomer: 'warning',
  AtRisk: 'error',
  // Lowercase aliases
  champion: 'success',
  loyal: 'info',
  newcomer: 'warning',
  atRisk: 'error',
  at_risk: 'error',
};

/**
 * QUOTE_STATUS_TONE — for quotes (draft/sent/viewed/accepted/expired).
 */
export const QUOTE_STATUS_TONE: Record<string, StatusTone> = {
  draft: 'neutral',
  sent: 'info',
  viewed: 'warning',
  accepted: 'success',
  expired: 'error',
};

/**
 * CONTRACT_STATUS_TONE — for contracts.
 */
export const CONTRACT_STATUS_TONE: Record<string, StatusTone> = {
  draft: 'neutral',
  pending: 'warning',
  active: 'info',
  signed: 'success',
  expired: 'error',
  cancelled: 'error',
};

/**
 * INVOICE_STATUS_TONE — for invoices and tax invoices.
 */
export const INVOICE_STATUS_TONE: Record<string, StatusTone> = {
  draft: 'neutral',
  sent: 'info',
  pending: 'warning',
  paid: 'success',
  overdue: 'error',
  cancelled: 'error',
  void: 'neutral',
};

/**
 * REFUND_STATUS_TONE — for refunds.
 */
export const REFUND_STATUS_TONE: Record<string, StatusTone> = {
  pending: 'warning',
  approved: 'info',
  processing: 'info',
  completed: 'success',
  rejected: 'error',
  failed: 'error',
};

/**
 * CAMPAIGN_STATUS_TONE — for marketing campaigns.
 */
export const CAMPAIGN_STATUS_TONE: Record<string, StatusTone> = {
  draft: 'neutral',
  scheduled: 'info',
  active: 'success',
  paused: 'warning',
  completed: 'success',
  archived: 'neutral',
};

/**
 * SYSTEM_STATUS_TONE — for system stats / health.
 */
export const SYSTEM_STATUS_TONE: Record<string, StatusTone> = {
  operational: 'success',
  degraded: 'warning',
  outage: 'error',
  maintenance: 'info',
  unknown: 'neutral',
};

/**
 * Generic helper — get a tone for any string status, with fallback.
 * Searches all tone maps in priority order (domain-specific first, then
 * cross-domain stage/risk/segment).
 */
export function getToneForStatus(
  status: string,
  fallback: StatusTone = 'neutral'
): StatusTone {
  const normalized = status.toLowerCase();
  return (
    QUOTE_STATUS_TONE[normalized] ??
    CONTRACT_STATUS_TONE[normalized] ??
    INVOICE_STATUS_TONE[normalized] ??
    REFUND_STATUS_TONE[normalized] ??
    CAMPAIGN_STATUS_TONE[normalized] ??
    SYSTEM_STATUS_TONE[normalized] ??
    STAGE_TONE[normalized] ??
    RISK_TONE[normalized] ??
    SEGMENT_TONE[normalized] ??
    SEGMENT_TONE[status] ?? // exact-case for segments
    fallback
  );
}
