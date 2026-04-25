/**
 * zyrixTheme — Premium Light AI theme tokens (AI Sprint 1, spec section 2).
 *
 * This is the forward-looking theme layer introduced by the AI sprint work.
 * It sits alongside the existing `constants/colors.ts` palette (Sprint 1/app
 * era) rather than replacing it — older screens can keep importing `colors`
 * while new AI-era surfaces pull from `zyrixTheme` / `zyrixShadows` / etc.
 *
 * Keep the tokens numerically exact as the spec expects other packages
 * (shared Next.js site, design-doc tooling) to mirror these values.
 */

export const zyrixTheme = {
  gradient: {
    start: '#FFFFFF',
    mid: '#F0F9FF',
    end: '#E0F2FE',
  },

  primary: '#0EA5E9',
  primaryDark: '#0284C7',
  primaryLight: '#22D3EE',
  primarySoft: '#F0F9FF',

  textHeading: '#0C4A6E',
  textBody: '#1A202C',
  textMuted: '#64748B',
  textInverse: '#FFFFFF',

  aiSurface: 'rgba(14,165,233,0.08)',
  aiSurfaceHover: 'rgba(14,165,233,0.12)',
  aiBorder: 'rgba(14,165,233,0.3)',

  cardBg: '#FFFFFF',
  cardBgAlpha: 'rgba(255,255,255,0.92)',
  cardBorder: '#D7ECF8',
  cardHover: '#F0F9FF',

  surface: '#FFFFFF',
  surfaceAlt: '#F8FAFC',

  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#0EA5E9',

  saudiBadge: '#006C35',
  turkeyBadge: '#E30A17',

  border: '#D7ECF8',
  borderStrong: 'rgba(14,165,233,0.25)',
} as const;

export const zyrixShadows = {
  card: {
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  aiGlow: {
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 8,
  },
  modal: {
    shadowColor: '#0C4A6E',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
} as const;

export const zyrixSpacing = {
  xs: 4,
  sm: 8,
  base: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const zyrixRadius = {
  sm: 8,
  base: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  pill: 999,
} as const;

export type ZyrixTheme = typeof zyrixTheme;
