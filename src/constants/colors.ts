/**
 * Zyrix CRM color palette.
 * Cyan-only theme — no navy, no dark/black brand colors.
 */

export const colors = {
  // Primary cyan ramp
  primary: '#0891B2',
  primaryDark: '#0E7490',
  primaryLight: '#22D3EE',
  primarySoft: '#CFFAFE',

  // Backgrounds
  background: '#F0F9FF',
  surface: '#FFFFFF',
  surfaceAlt: '#ECFEFF',
  overlay: 'rgba(8, 145, 178, 0.12)',

  // Text
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#64748B',
  textInverse: '#FFFFFF',
  textOnPrimary: '#FFFFFF',
  textLink: '#0891B2',

  // Borders & dividers
  border: '#E2E8F0',
  borderStrong: '#CBD5E1',
  borderFocus: '#0891B2',
  divider: '#E0F2FE',

  // Semantic colors
  success: '#10B981',
  successSoft: '#D1FAE5',
  warning: '#F59E0B',
  warningSoft: '#FEF3C7',
  error: '#EF4444',
  errorSoft: '#FEE2E2',
  info: '#0EA5E9',
  infoSoft: '#E0F2FE',

  // Plan badge colors (cyan-safe variants)
  planFree: '#64748B',
  planFreeSoft: '#F1F5F9',
  planStarter: '#06B6D4',
  planStarterSoft: '#CFFAFE',
  planPro: '#0891B2',
  planProSoft: '#E0F7FA',
  planBusiness: '#0E7490',
  planBusinessSoft: '#CCFBF1',
  planEnterprise: '#155E75',
  planEnterpriseSoft: '#A5F3FC',

  // Gradient stops for splash / headers
  gradientStart: '#22D3EE',
  gradientMid: '#0891B2',
  gradientEnd: '#0E7490',

  // Utility
  transparent: 'transparent',
  black: '#000000',
  white: '#FFFFFF',
  shadow: 'rgba(8, 145, 178, 0.18)',
  disabled: '#CBD5E1',
  disabledText: '#94A3B8',
} as const;

export type ColorKey = keyof typeof colors;
export type ColorValue = (typeof colors)[ColorKey];
