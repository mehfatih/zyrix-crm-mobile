/**
 * Zyrix CRM color palette.
 *
 * Cyan is still the core brand ramp (primary/Soft/Light/Dark). APP Sprint 1
 * adds a set of vibrant, bright, uplifting accent colors plus preset
 * gradient stops so screens can lean on colour for visual energy without
 * reaching for dark tones. No dark mode, no navy, no black.
 */

export const colors = {
  // Primary cyan ramp
  primary: '#0891B2',
  primaryDark: '#0E7490',
  primaryLight: '#06B6D4',
  primaryLighter: '#22D3EE',
  primarySoft: '#CFFAFE',

  // Backgrounds
  background: '#F0F9FF',
  surface: '#FFFFFF',
  surfaceAlt: '#ECFEFF',
  overlay: 'rgba(8, 145, 178, 0.12)',

  // Text
  textPrimary: '#0F172A',
  textHeading: '#0C4A6E',
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

  // Vibrant accents — every screen should use at least 2 of these
  // alongside the cyan ramp. Soft variants are safe for tinted backgrounds.
  coral: '#FB7185',
  coralSoft: '#FFE4E6',
  peach: '#FDBA74',
  peachSoft: '#FFEDD5',
  mint: '#34D399',
  mintSoft: '#D1FAE5',
  lavender: '#A78BFA',
  lavenderSoft: '#EDE9FE',
  sunshine: '#FCD34D',
  sunshineSoft: '#FEF3C7',
  sky: '#7DD3FC',
  skySoft: '#E0F2FE',
  rose: '#F9A8D4',
  roseSoft: '#FCE7F3',
  teal: '#5EEAD4',
  tealSoft: '#CCFBF1',

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

/**
 * Preset gradient stop arrays ready to drop into <LinearGradient colors={...} />.
 * Each is a bright, uplifting pair — pick one by intent rather than by exact hue.
 */
export const gradients = {
  /** Cyan hero — default for headers and primary CTAs. */
  hero: ['#06B6D4', '#7DD3FC'] as const,
  /** Mint-teal success — dashboards, positive metrics, achievements. */
  success: ['#34D399', '#5EEAD4'] as const,
  /** Peach-sunshine warning — gentle attention without alarm. */
  warning: ['#FDBA74', '#FCD34D'] as const,
  /** Lavender-sky premium — AI features, pro tier highlights. */
  premium: ['#A78BFA', '#7DD3FC'] as const,
  /** Coral-peach celebration — splash screen, onboarding, milestones. */
  celebration: ['#FB7185', '#FDBA74'] as const,
  /** Rose-lavender soft — gentle notifications, empty states. */
  soft: ['#F9A8D4', '#A78BFA'] as const,
} as const;

export type ColorKey = keyof typeof colors;
export type ColorValue = (typeof colors)[ColorKey];
export type GradientKey = keyof typeof gradients;
