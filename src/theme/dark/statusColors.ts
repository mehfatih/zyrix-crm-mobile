/**
 * Universal status semantics — NEVER varies by page accent.
 *
 * | Meaning                  | Color   | Hex      |
 * | Won / Positive           | Emerald | #34D399  |
 * | At-risk / Pending / Warn | Amber   | #FBBF24  |
 * | Lost / Failed / Danger   | Rose    | #FB7185  |
 * | AI / Smart insights      | Violet  | #A78BFA  |
 *
 * AI confidence pill tiers (Sprint 14q):
 *   ≥90%: Violet (Premium)
 *   ≥80%: Emerald (High)
 *   ≥60%: Cyan (Mid)
 *   <60%: Amber (Low)
 */

export const statusColors = {
  won: {
    base:    '#34D399',
    text:    '#6EE7B7',
    bgTint:  'rgba(52, 211, 153, 0.15)',
    bgSoft:  'rgba(52, 211, 153, 0.08)',
    border:  'rgba(52, 211, 153, 0.40)',
  },
  atRisk: {
    base:    '#FBBF24',
    text:    '#FCD34D',
    bgTint:  'rgba(251, 191, 36, 0.15)',
    bgSoft:  'rgba(251, 191, 36, 0.08)',
    border:  'rgba(251, 191, 36, 0.40)',
  },
  lost: {
    base:    '#FB7185',
    text:    '#FDA4AF',
    bgTint:  'rgba(251, 113, 133, 0.15)',
    bgSoft:  'rgba(251, 113, 133, 0.08)',
    border:  'rgba(251, 113, 133, 0.40)',
  },
  ai: {
    base:    '#A78BFA',
    text:    '#C4B5FD',
    bgTint:  'rgba(167, 139, 250, 0.15)',
    bgSoft:  'rgba(167, 139, 250, 0.08)',
    border:  'rgba(167, 139, 250, 0.40)',
  },
  confidencePremium:  '#A78BFA',
  confidenceHigh:     '#34D399',
  confidenceMid:      '#22D3EE',
  confidenceLow:      '#FBBF24',
} as const;

export type StatusKind = 'won' | 'atRisk' | 'lost' | 'ai';

export function confidenceColor(score: number): string {
  if (score >= 90) return statusColors.confidencePremium;
  if (score >= 80) return statusColors.confidenceHigh;
  if (score >= 60) return statusColors.confidenceMid;
  return statusColors.confidenceLow;
}
