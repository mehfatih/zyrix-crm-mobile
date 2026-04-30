/**
 * Legacy colors palette — atomically swapped to dark navy theme via M19.
 *
 * This file is now a thin re-export layer over `theme/dark/colors.dark.ts`.
 * The shape is preserved so all 70 importers across components/, navigation/,
 * and App.tsx continue to work without modification.
 *
 * To make further palette changes, edit `theme/dark/colors.dark.ts` directly.
 *
 * Migration history:
 *   M1: created src/theme/dark/* with darkColors and darkGradients
 *   M3-M18: migrated 95 screens from `colors` to `darkColors`
 *   M19: this file's contents replaced with re-exports (atomic swap for
 *        all remaining components, navigation, and App.tsx importers)
 */

import { darkColors, darkGradients, type DarkColors, type DarkGradients } from '../theme/dark';

export const colors = darkColors;
export const gradients = darkGradients;

export type ColorKey = keyof DarkColors;
export type ColorValue = DarkColors[ColorKey];
export type GradientKey = keyof DarkGradients;
