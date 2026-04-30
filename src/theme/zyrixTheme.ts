/**
 * Legacy zyrixTheme palette — atomically swapped to dark navy theme via M19.
 *
 * This file is now a thin re-export layer over `theme/dark/zyrixTheme.dark.ts`.
 * The shape is preserved so all 18 importers (components/ai/, components/dashboard/,
 * components/layout/AppScreen.tsx, etc.) continue to work without modification.
 *
 * To make further palette changes, edit `theme/dark/zyrixTheme.dark.ts` directly.
 *
 * Migration history:
 *   M1: created src/theme/dark/zyrixTheme.dark.ts with darkZyrixTheme variants
 *   M6, M18: migrated 3 screens that used zyrixTheme directly
 *   M19: this file's contents replaced with re-exports (atomic swap for
 *        all 18 remaining component-layer importers, including AppScreen
 *        which means gradient-wrapped screens automatically render dark)
 */

import {
  darkZyrixTheme,
  darkZyrixShadows,
  darkZyrixSpacing,
  darkZyrixRadius,
  type DarkZyrixTheme,
} from './dark';

export const zyrixTheme = darkZyrixTheme;
export const zyrixShadows = darkZyrixShadows;
export const zyrixSpacing = darkZyrixSpacing;
export const zyrixRadius = darkZyrixRadius;

export type ZyrixTheme = DarkZyrixTheme;
