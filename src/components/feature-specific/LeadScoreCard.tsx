/**
 * LeadScoreCard — dense card for the lead-scoring list. Shows the lead
 * name, company, a big scored circle (red/amber/green), the top three
 * factors with ± indicators, and the AI-suggested next action.
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '../common/Icon';
import { colors } from '../../constants/colors';
import { radius, shadows, spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';
import type { LeadScore } from '../../types/ai';

export interface LeadScoreCardProps {
  lead: LeadScore;
  onPress?: (lead: LeadScore) => void;
  onTakeAction?: (lead: LeadScore) => void;
}

const scoreTone = (score: number): string => {
  if (score >= 70) return colors.success;
  if (score >= 40) return colors.warning;
  return colors.error;
};

export const LeadScoreCard: React.FC<LeadScoreCardProps> = ({
  lead,
  onPress,
  onTakeAction,
}) => {
  const tone = scoreTone(lead.score);
  const topFactors = lead.factors.slice(0, 3);

  return (
    <Pressable
      onPress={() => onPress?.(lead)}
      style={({ pressed }) => [
        styles.card,
        pressed ? { opacity: 0.9 } : null,
      ]}
      accessibilityRole="button"
    >
      <View style={styles.headerRow}>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {lead.leadName}
          </Text>
          <Text style={styles.company} numberOfLines={1}>
            {lead.company}
          </Text>
        </View>
        <View
          style={[
            styles.scoreCircle,
            { borderColor: tone, backgroundColor: `${tone}20` },
          ]}
        >
          <Text style={[styles.scoreText, { color: tone }]}>{lead.score}</Text>
        </View>
      </View>

      <View style={styles.factors}>
        {topFactors.map((factor, idx) => (
          <View key={`${lead.leadId}-${idx}`} style={styles.factorRow}>
            <Icon
              name={
                factor.kind === 'positive' ? 'arrow-up' : 'arrow-down'
              }
              size={12}
              color={
                factor.kind === 'positive' ? colors.success : colors.error
              }
            />
            <Text style={styles.factorText} numberOfLines={1}>
              {factor.label}
            </Text>
            <Text
              style={[
                styles.factorDelta,
                {
                  color:
                    factor.kind === 'positive' ? colors.success : colors.error,
                },
              ]}
            >
              {`${factor.delta > 0 ? '+' : ''}${factor.delta}`}
            </Text>
          </View>
        ))}
      </View>

      {onTakeAction ? (
        <Pressable
          onPress={() => onTakeAction(lead)}
          style={({ pressed }) => [
            styles.actionBtn,
            pressed ? { opacity: 0.85 } : null,
          ]}
        >
          <Text style={styles.actionText}>{lead.suggestedAction}</Text>
          <Icon name="arrow-forward" size={14} color={colors.primary} />
        </Pressable>
      ) : (
        <View style={styles.suggested}>
          <Icon name="sparkles-outline" size={14} color={colors.primary} />
          <Text style={styles.suggestedText}>{lead.suggestedAction}</Text>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    padding: spacing.base,
    borderRadius: radius.lg,
    rowGap: spacing.sm,
    marginBottom: spacing.sm,
    ...shadows.xs,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.sm,
  },
  info: { flex: 1 },
  name: {
    ...textStyles.bodyMedium,
    color: colors.textPrimary,
  },
  company: {
    ...textStyles.caption,
    color: colors.textMuted,
  },
  scoreCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    ...textStyles.h3,
    fontWeight: '800',
  },
  factors: {
    rowGap: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: spacing.sm,
  },
  factorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.xs,
  },
  factorText: {
    ...textStyles.caption,
    color: colors.textSecondary,
    flex: 1,
  },
  factorDelta: {
    ...textStyles.caption,
    fontWeight: '700',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  actionText: {
    ...textStyles.label,
    color: colors.primary,
    fontWeight: '700',
  },
  suggested: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.xs,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  suggestedText: {
    ...textStyles.caption,
    color: colors.primaryDark,
    fontWeight: '700',
  },
});

export default LeadScoreCard;
