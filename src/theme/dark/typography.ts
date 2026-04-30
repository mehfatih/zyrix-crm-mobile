import { Platform } from 'react-native';

/**
 * Typography tokens — mirror the web's Tailwind type scale.
 *
 * Font families:
 *   - System default (San Francisco on iOS, Roboto on Android).
 *   - For Arabic: system handles bidi natively — no override needed.
 *   - For Turkish: same Latin alphabet as English.
 *
 * If the project ships custom fonts (Inter, Cairo) later, swap these keys.
 */

export const typography = {
  fontFamily: {
    sans: Platform.select({
      ios: 'System',
      android: 'sans-serif',
      default: 'System',
    }) as string,
    mono: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'Menlo',
    }) as string,
  },

  size: {
    xs:   12,
    sm:   14,
    base: 16,
    lg:   18,
    xl:   20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,
    '5xl': 40,
    '6xl': 48,
  },

  weight: {
    regular:  '400',
    medium:   '500',
    semibold: '600',
    bold:     '700',
    extrabold:'800',
  },

  lineHeight: {
    tight:   1.15,
    snug:    1.3,
    normal:  1.5,
    relaxed: 1.625,
    loose:   1.85,
  },

  letterSpacing: {
    tight:    -0.4,
    normal:   0,
    wide:     0.5,
    wider:    1,
    widest:   2,
  },
} as const;
