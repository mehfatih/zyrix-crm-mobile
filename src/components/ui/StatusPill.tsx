/**
 * StatusPill — universal tone-based status pill (M25).
 *
 * Drop-in replacement for the inline `STATUS_STYLE` Record patterns that
 * previously lived in 10 screens. Drives a small View+Text via a semantic
 * `tone` prop (success/warning/error/info/neutral); colors come from the
 * central TONE_COLORS map in `src/lib/ui/status-tones.ts`.
 *
 * Coexists with the older `Pill` component (M1/M2 era) which uses an
 * `accent` vocabulary — the two are kept separate by design.
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { TONE_COLORS, type StatusTone } from '../../lib/ui/status-tones';

export type StatusPillSize = 'sm' | 'md' | 'lg';

export interface StatusPillProps {
  /** Semantic tone — drives the pill's color treatment */
  tone: StatusTone;
  /** Size variant — defaults to 'md' */
  size?: StatusPillSize;
  /** Pill content (typically the status label, e.g. "Won", "Pending") */
  children: React.ReactNode;
  /** Optional override for outer container style */
  style?: ViewStyle;
  /** Optional override for text style */
  textStyle?: TextStyle;
}

const SIZE_CONFIG: Record<
  StatusPillSize,
  {
    paddingH: number;
    paddingV: number;
    fontSize: number;
    borderRadius: number;
  }
> = {
  sm: { paddingH: 6, paddingV: 2, fontSize: 11, borderRadius: 6 },
  md: { paddingH: 10, paddingV: 4, fontSize: 13, borderRadius: 8 },
  lg: { paddingH: 14, paddingV: 6, fontSize: 15, borderRadius: 10 },
};

export function StatusPill({
  tone,
  size = 'md',
  children,
  style,
  textStyle,
}: StatusPillProps) {
  const config = SIZE_CONFIG[size];
  const toneColors = TONE_COLORS[tone];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: toneColors.background,
          borderColor: toneColors.border,
          paddingHorizontal: config.paddingH,
          paddingVertical: config.paddingV,
          borderRadius: config.borderRadius,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: toneColors.text,
            fontSize: config.fontSize,
          },
          textStyle,
        ]}
        numberOfLines={1}
      >
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  text: {
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});

export default StatusPill;
