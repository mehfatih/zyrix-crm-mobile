import { Platform } from 'react-native';

/**
 * Dark-theme shadow recipes. iOS uses shadow* props (with violet glow for
 * brand elements), Android uses elevation only (Android can't render
 * colored shadows on dark surfaces well).
 */

export const shadows = {
  card: Platform.select({
    ios: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.45,
      shadowRadius: 12,
    },
    android: { elevation: 4 },
    default: {},
  }),

  cardElevated: Platform.select({
    ios: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.50,
      shadowRadius: 20,
    },
    android: { elevation: 8 },
    default: {},
  }),

  modal: Platform.select({
    ios: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.55,
      shadowRadius: 32,
    },
    android: { elevation: 16 },
    default: {},
  }),

  /** Violet glow — for primary buttons and AI surfaces. */
  primaryGlow: Platform.select({
    ios: {
      shadowColor: '#7A60FA',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.45,
      shadowRadius: 16,
    },
    android: { elevation: 10 },
    default: {},
  }),

  pressed: Platform.select({
    ios: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.30,
      shadowRadius: 6,
    },
    android: { elevation: 2 },
    default: {},
  }),
} as const;
