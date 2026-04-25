/**
 * AIPriorityCard — top-priority action surface for the AI dashboard
 * (AI Sprint 3 §4 / Task 2).
 *
 * Renders a single `RankedAction` from the decision engine with:
 *   - Type-coloured accent bar + icon (risk / opportunity / followup /
 *     revenue / retention).
 *   - Title + reason on the header row.
 *   - AITrustBadge (confidence chip + Explain modal).
 *   - Gradient CTA button.
 *
 * The card is colour-coded so a glance tells the user *why* it's on
 * their list before they read a single word.
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { Icon, type AnyIconName } from '../common/Icon';
import { AITrustBadge } from '../ai/AITrustBadge';
import {
  zyrixRadius,
  zyrixShadows,
  zyrixSpacing,
  zyrixTheme,
} from '../../theme/zyrixTheme';
import type { RankedAction } from '../../types/ai';

export interface AIPriorityCardProps {
  action: RankedAction;
  onResolve?: (action: RankedAction) => void;
}

const accentForType = (type: RankedAction['type']): string => {
  switch (type) {
    case 'risk':
      return zyrixTheme.danger;
    case 'opportunity':
      return zyrixTheme.success;
    case 'followup':
      return zyrixTheme.warning;
    case 'revenue':
      return zyrixTheme.primary;
    case 'retention':
      return zyrixTheme.primaryDark;
    default:
      return zyrixTheme.primary;
  }
};

const iconForType = (type: RankedAction['type']): AnyIconName => {
  switch (type) {
    case 'risk':
      return 'warning-outline';
    case 'opportunity':
      return 'flash-outline';
    case 'followup':
      return 'time-outline';
    case 'revenue':
      return 'trending-up-outline';
    case 'retention':
      return 'heart-outline';
    default:
      return 'star-outline';
  }
};

export const AIPriorityCard: React.FC<AIPriorityCardProps> = ({
  action,
  onResolve,
}) => {
  const accent = accentForType(action.type);
  const icon = iconForType(action.type);

  return (
    <View style={[styles.card, { borderLeftColor: accent }]}>
      <View style={styles.header}>
        <View style={[styles.iconWrap, { backgroundColor: accent + '20' }]}>
          <Icon name={icon} size={18} color={accent} family="Ionicons" />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title} numberOfLines={2}>
            {action.title}
          </Text>
          <Text style={styles.reason} numberOfLines={2}>
            {action.reason}
          </Text>
        </View>
      </View>

      <AITrustBadge
        confidence={action.confidence}
        reason={action.reason}
        signals={action.signals}
        recommendedAction={action.recommendedAction}
      />

      <Pressable
        onPress={() => onResolve?.(action)}
        style={styles.cta}
        accessibilityRole="button"
        accessibilityLabel={action.cta.label}
      >
        <LinearGradient
          colors={[zyrixTheme.primaryLight, zyrixTheme.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.ctaGradient}
        >
          <Text style={styles.ctaText}>{action.cta.label}</Text>
          <Icon
            name="arrow-forward"
            size={16}
            color="#FFFFFF"
            family="Ionicons"
          />
        </LinearGradient>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: zyrixTheme.cardBg,
    borderRadius: zyrixRadius.lg,
    padding: zyrixSpacing.base,
    borderLeftWidth: 4,
    borderColor: zyrixTheme.cardBorder,
    borderWidth: 1,
    rowGap: 12,
    ...zyrixShadows.card,
  },
  header: {
    flexDirection: 'row',
    columnGap: 12,
    alignItems: 'flex-start',
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1, rowGap: 4 },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: zyrixTheme.textHeading,
  },
  reason: {
    fontSize: 13,
    color: zyrixTheme.textBody,
    lineHeight: 18,
  },
  cta: {
    borderRadius: zyrixRadius.base,
    overflow: 'hidden',
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: 8,
    paddingVertical: 11,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default AIPriorityCard;
