/**
 * AIConfidenceBadge — lightweight 4-tier confidence badge.
 *
 * Use this when a screen wants the simplest possible confidence display:
 * a tinted pill with the percentage value (or tier name) coloured per
 * the 4-tier `statusColors.ts` system. For the richer pattern with an
 * Explain modal (reason / signals / recommendedAction), use
 * `AITrustBadge` instead — both share the same 4-tier color source via
 * `confidenceColor()`.
 *
 * Tier boundaries:
 *   ≥90 → Violet (Premium)
 *   ≥80 → Emerald (High)
 *   ≥60 → Cyan (Mid)
 *   <60 → Amber (Low)
 *
 * Examples:
 *   <AIConfidenceBadge value={95} />              // "95% Confidence" violet
 *   <AIConfidenceBadge value={73} size="sm" />    // "73% Confidence" cyan, small
 *   <AIConfidenceBadge value={91} showTierLabel />// "Premium Confidence" violet
 *   <AIConfidenceBadge value={87} label="Match" />// "87% Match" emerald
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  confidenceColor,
  confidenceTier,
  type ConfidenceTier,
} from '../../theme/dark/statusColors';

export type AIConfidenceBadgeSize = 'sm' | 'md' | 'lg';

export interface AIConfidenceBadgeProps {
  /** Confidence value 0-100. Values outside the range are clamped. */
  value: number;
  /** Size variant. Defaults to `'md'`. */
  size?: AIConfidenceBadgeSize;
  /** Optional label override (e.g. "Match", "Trust"). Defaults to `t('ai.confidence')`. */
  label?: string;
  /** When true, show the tier name (Premium/High/Mid/Low) instead of the percentage. */
  showTierLabel?: boolean;
}

const SIZE_CONFIG: Record<AIConfidenceBadgeSize, {
  paddingH: number;
  paddingV: number;
  fontSize: number;
  borderRadius: number;
}> = {
  sm: { paddingH: 6, paddingV: 2, fontSize: 11, borderRadius: 6 },
  md: { paddingH: 10, paddingV: 4, fontSize: 13, borderRadius: 8 },
  lg: { paddingH: 14, paddingV: 6, fontSize: 15, borderRadius: 10 },
};

export const AIConfidenceBadge: React.FC<AIConfidenceBadgeProps> = ({
  value,
  size = 'md',
  label,
  showTierLabel = false,
}) => {
  const { t } = useTranslation();

  // Clamp + round to a safe 0-100 integer
  const safeValue = Math.max(0, Math.min(100, Math.round(value)));

  const accentColor = confidenceColor(safeValue);
  const tier: ConfidenceTier = confidenceTier(safeValue);

  const displayLabel = label ?? t('ai.confidence');
  const displayValue = showTierLabel
    ? t(`ai.confidenceTier.${tier}`)
    : `${safeValue}%`;

  const config = SIZE_CONFIG[size];

  return (
    <View
      style={[
        styles.container,
        {
          // 15% opacity tint background and 40% opacity border, derived
          // from the 6-digit hex `accentColor` by appending alpha bytes.
          backgroundColor: `${accentColor}26`,
          borderColor: `${accentColor}66`,
          paddingHorizontal: config.paddingH,
          paddingVertical: config.paddingV,
          borderRadius: config.borderRadius,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: accentColor, fontSize: config.fontSize },
        ]}
        numberOfLines={1}
      >
        {displayValue} {displayLabel}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  text: {
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

export default AIConfidenceBadge;
