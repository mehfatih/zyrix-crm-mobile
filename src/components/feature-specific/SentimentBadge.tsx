/**
 * SentimentBadge — compact pill that shows an emoji + label + a
 * confidence dot. Used on conversation intelligence cards and next to
 * meeting sentiment scores.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { colors } from '../../constants/colors';
import { radius, spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';
import type { SentimentLabel } from '../../types/ai';

export interface SentimentBadgeProps {
  sentiment: SentimentLabel;
  confidence?: number;
}

const TONE: Record<
  SentimentLabel,
  { background: string; color: string; emoji: string }
> = {
  positive: {
    background: colors.successSoft,
    color: colors.success,
    emoji: '😊',
  },
  neutral: {
    background: colors.surfaceAlt,
    color: colors.textMuted,
    emoji: '😐',
  },
  negative: {
    background: colors.errorSoft,
    color: colors.error,
    emoji: '😞',
  },
};

export const SentimentBadge: React.FC<SentimentBadgeProps> = ({
  sentiment,
  confidence,
}) => {
  const { t } = useTranslation();
  const tone = TONE[sentiment];
  const pct = typeof confidence === 'number' ? Math.round(confidence * 100) : undefined;

  return (
    <View style={[styles.pill, { backgroundColor: tone.background }]}>
      <Text style={styles.emoji}>{tone.emoji}</Text>
      <Text style={[styles.label, { color: tone.color }]}>
        {t(`sentiment.${sentiment}`)}
      </Text>
      {pct !== undefined ? (
        <View style={[styles.dot, { backgroundColor: tone.color }]}>
          <Text style={styles.dotText}>{`${pct}%`}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  emoji: { fontSize: 14 },
  label: {
    ...textStyles.caption,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  dot: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 1,
    borderRadius: radius.pill,
  },
  dotText: {
    ...textStyles.caption,
    color: colors.textInverse,
    fontWeight: '700',
    fontSize: 10,
  },
});

export default SentimentBadge;
