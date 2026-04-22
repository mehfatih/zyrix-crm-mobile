/**
 * Spacing, radius and shadow tokens.
 * 4pt base grid. Use these rather than hard-coded numbers.
 */

import { Platform, ViewStyle } from 'react-native';
import { colors } from './colors';

export const spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  huge: 56,
  massive: 72,
} as const;

export const radius = {
  none: 0,
  xs: 4,
  sm: 6,
  md: 10,
  base: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  pill: 999,
  full: 9999,
} as const;

type Shadow = Pick<
  ViewStyle,
  'shadowColor' | 'shadowOffset' | 'shadowOpacity' | 'shadowRadius' | 'elevation'
>;

const shadow = (
  elevation: number,
  opacity: number,
  radiusVal: number,
  offsetY: number
): Shadow => ({
  shadowColor: colors.shadow,
  shadowOffset: { width: 0, height: offsetY },
  shadowOpacity: Platform.OS === 'ios' ? opacity : 0,
  shadowRadius: radiusVal,
  elevation: Platform.OS === 'android' ? elevation : 0,
});

export const shadows = {
  none: shadow(0, 0, 0, 0),
  xs: shadow(1, 0.08, 2, 1),
  sm: shadow(2, 0.1, 4, 2),
  md: shadow(4, 0.12, 8, 4),
  lg: shadow(8, 0.16, 16, 8),
  xl: shadow(12, 0.22, 24, 12),
} as const;

export const hitSlop = {
  sm: { top: 6, bottom: 6, left: 6, right: 6 },
  md: { top: 10, bottom: 10, left: 10, right: 10 },
  lg: { top: 14, bottom: 14, left: 14, right: 14 },
} as const;

export const layout = {
  minTouchTarget: 44,
  inputHeight: 52,
  buttonHeight: 52,
  buttonHeightSm: 40,
  headerHeight: 56,
  tabBarHeight: 64,
  screenPadding: spacing.lg,
} as const;

export type SpacingKey = keyof typeof spacing;
export type RadiusKey = keyof typeof radius;
export type ShadowKey = keyof typeof shadows;
