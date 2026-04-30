/**
 * Zyrix mobile DARK theme — central export.
 *
 * THIS MODULE IS NOT YET ACTIVE. The legacy theme files
 * (`src/constants/colors.ts`, `src/theme/zyrixTheme.ts`) are still the
 * production tokens. This module lives alongside as a drop-in replacement
 * that future sprints will adopt — first by introducing primitives that use
 * it (M2), then by migrating screens one at a time (M3+), and finally by
 * swapping the legacy modules' content to re-export from here (M-final).
 *
 * Usage in new code (M2 onward):
 *
 *   import { darkColors as colors, accents, statusColors, spacing, radius } from '@/theme/dark';
 *
 * Usage in existing screens: KEEP the existing imports. Don't change anything.
 */

export {
  darkColors,
  darkGradients,
  type DarkColors,
  type DarkGradients,
} from './colors.dark';

export {
  darkZyrixTheme,
  darkZyrixShadows,
  darkZyrixSpacing,
  darkZyrixRadius,
  type DarkZyrixTheme,
} from './zyrixTheme.dark';

export {
  accents,
  pageAccentMap,
  rankPalette,
  getPageAccent,
  type AccentColor,
  type AccentShade,
  type PageId,
} from './accents';

export {
  statusColors,
  confidenceColor,
  type StatusKind,
} from './statusColors';

export { spacing, type SpacingToken } from './spacing';
export { radius, type RadiusToken } from './radius';
export { shadows } from './shadows';
export { typography } from './typography';
