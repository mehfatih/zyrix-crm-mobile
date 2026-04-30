/**
 * Dark navy AI theme — drop-in replacement for src/theme/zyrixTheme.ts.
 *
 * Used by 19 files (mostly AI-era surfaces). Every key in the legacy
 * `zyrixTheme` is mirrored here with dark-theme values, plus matching
 * shadow/spacing/radius scales.
 */

export const darkZyrixTheme = {
  gradient: {
    start: '#0C162C',   // dark navy gradient (was white)
    mid:   '#121E3B',
    end:   '#1A2750',
  },

  primary:      '#7A60FA',
  primaryDark:  '#6849F5',
  primaryLight: '#A78BFA',
  primarySoft:  'rgba(122, 96, 250, 0.12)',

  textHeading: '#FFFFFF',
  textBody:    '#F1F4F9',
  textMuted:   '#9DA1A8',
  textInverse: '#0C162C',

  // AI surface tints (was cyan; now violet)
  aiSurface:      'rgba(122, 96, 250, 0.10)',
  aiSurfaceHover: 'rgba(122, 96, 250, 0.16)',
  aiBorder:       'rgba(122, 96, 250, 0.35)',

  cardBg:      '#1A2440',
  cardBgAlpha: 'rgba(26, 36, 64, 0.92)',
  cardBorder:  '#33405A',
  cardHover:   '#1F2B4D',

  surface:    '#0C162C',
  surfaceAlt: '#242F4A',

  success: '#34D399',
  warning: '#FBBF24',
  danger:  '#FB7185',
  info:    '#22D3EE',

  saudiBadge:  '#006C35',
  turkeyBadge: '#E30A17',

  border:       '#33405A',
  borderStrong: '#445273',
} as const;

export const darkZyrixShadows = {
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 4,
  },
  aiGlow: {
    shadowColor: '#7A60FA',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.40,
    shadowRadius: 20,
    elevation: 8,
  },
  modal: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.55,
    shadowRadius: 24,
    elevation: 16,
  },
} as const;

// Spacing/radius are unchanged — values were already good in legacy
export const darkZyrixSpacing = { xs: 4, sm: 8, base: 16, lg: 24, xl: 32, xxl: 48 } as const;
export const darkZyrixRadius  = { sm: 8, base: 12, lg: 16, xl: 20, xxl: 28, pill: 999 } as const;

export type DarkZyrixTheme = typeof darkZyrixTheme;
