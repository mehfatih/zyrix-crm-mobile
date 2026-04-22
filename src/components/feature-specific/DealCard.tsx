/**
 * DealCard — row used by both `DealsScreen` and each column of the
 * Pipeline Kanban. Displays customer, title, value, stage badge and a
 * progress bar keyed to probability.
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { CurrencyDisplay } from '../forms/CurrencyDisplay';
import { colors } from '../../constants/colors';
import { DEALS_BY_STAGE_COLORS } from '../../api/mockData';
import { radius, shadows, spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';
import { useCountryConfig } from '../../hooks/useCountryConfig';
import type { Deal } from '../../api/deals';

export interface DealCardProps {
  deal: Deal;
  onPress?: (deal: Deal) => void;
  compact?: boolean;
}

export const DealCard: React.FC<DealCardProps> = ({
  deal,
  onPress,
  compact = false,
}) => {
  const { t } = useTranslation();
  const { formatDate } = useCountryConfig();
  const stageColor = DEALS_BY_STAGE_COLORS[deal.stage];

  return (
    <Pressable
      onPress={() => onPress?.(deal)}
      style={({ pressed }) => [
        styles.card,
        compact ? styles.cardCompact : null,
        pressed ? { opacity: 0.85 } : null,
      ]}
      accessibilityRole="button"
    >
      <View style={styles.headerRow}>
        <Text style={styles.customer} numberOfLines={1}>
          {deal.customerName}
        </Text>
        <View style={[styles.stagePill, { backgroundColor: `${stageColor}20` }]}>
          <Text style={[styles.stageText, { color: stageColor }]}>
            {t(`stages.${deal.stage}`)}
          </Text>
        </View>
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {deal.title}
      </Text>

      <CurrencyDisplay amount={deal.value} size={compact ? 'medium' : 'large'} />

      <View style={styles.progressRow}>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.max(deal.probability, 4)}%`,
                backgroundColor: stageColor,
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>{`${deal.probability}%`}</Text>
      </View>

      {!compact ? (
        <Text style={styles.dueText}>{formatDate(deal.expectedCloseDate)}</Text>
      ) : null}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.base,
    rowGap: spacing.xs,
    marginBottom: spacing.sm,
    ...shadows.xs,
  },
  cardCompact: {
    padding: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    columnGap: spacing.xs,
  },
  customer: {
    ...textStyles.bodyMedium,
    color: colors.textPrimary,
    flex: 1,
  },
  stagePill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  stageText: {
    ...textStyles.caption,
    fontWeight: '700',
  },
  title: {
    ...textStyles.caption,
    color: colors.textSecondary,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.sm,
    marginTop: spacing.xs,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    borderRadius: radius.pill,
  },
  progressText: {
    ...textStyles.caption,
    color: colors.textMuted,
    fontWeight: '600',
    minWidth: 36,
    textAlign: 'right',
  },
  dueText: {
    ...textStyles.caption,
    color: colors.textMuted,
  },
});

export default DealCard;
