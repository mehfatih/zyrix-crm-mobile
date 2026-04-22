/**
 * AIInsightCard — surfaces a single AI-generated observation.
 *
 * Visual mapping by `insight.type`:
 *   warning  → amber triangle on `warningSoft`
 *   success  → green check on `successSoft`
 *   info     → cyan info icon on `primarySoft`
 *   critical → red alert on `errorSoft`
 *
 * Tap to expand / collapse. When `onTakeAction` is supplied, a pill
 * button appears below the recommendation.
 */

import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { Icon, type AnyIconName } from '../common/Icon';
import { colors } from '../../constants/colors';
import { radius, shadows, spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';
import type { Insight, InsightType } from '../../types/ai';
import { useTranslation } from 'react-i18next';

export interface AIInsightCardProps {
  insight: Insight;
  onTakeAction?: (insight: Insight) => void;
  style?: StyleProp<ViewStyle>;
  defaultExpanded?: boolean;
}

const TONE: Record<
  InsightType,
  { background: string; accent: string; icon: AnyIconName }
> = {
  warning: {
    background: colors.warningSoft,
    accent: colors.warning,
    icon: 'warning-outline',
  },
  success: {
    background: colors.successSoft,
    accent: colors.success,
    icon: 'checkmark-circle-outline',
  },
  info: {
    background: colors.primarySoft,
    accent: colors.primary,
    icon: 'information-circle-outline',
  },
  critical: {
    background: colors.errorSoft,
    accent: colors.error,
    icon: 'alert-circle-outline',
  },
};

export const AIInsightCard: React.FC<AIInsightCardProps> = ({
  insight,
  onTakeAction,
  style,
  defaultExpanded = false,
}) => {
  const { t } = useTranslation();
  const tone = TONE[insight.type];
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <Pressable
      onPress={() => setExpanded((prev) => !prev)}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: tone.background },
        pressed ? { opacity: 0.92 } : null,
        style,
      ]}
      accessibilityRole="button"
    >
      <View style={styles.row}>
        <View style={[styles.iconCircle, { borderColor: tone.accent }]}>
          <Icon name={tone.icon} size={18} color={tone.accent} />
        </View>
        <View style={styles.body}>
          <Text style={[styles.title, { color: tone.accent }]}>
            {insight.title}
          </Text>
          <Text
            style={styles.description}
            numberOfLines={expanded ? undefined : 2}
          >
            {insight.description}
          </Text>

          {insight.recommendation && expanded ? (
            <Text style={[styles.recommendation, { color: tone.accent }]}>
              {insight.recommendation}
            </Text>
          ) : null}

          {insight.metric ? (
            <View style={styles.metricRow}>
              <Text style={styles.metricValue}>{insight.metric.value}</Text>
              <Text style={styles.metricLabel}>{insight.metric.label}</Text>
              {typeof insight.metric.delta === 'number' ? (
                <Text
                  style={[
                    styles.metricDelta,
                    {
                      color:
                        insight.metric.delta >= 0
                          ? colors.success
                          : colors.error,
                    },
                  ]}
                >
                  {`${insight.metric.delta >= 0 ? '+' : ''}${insight.metric.delta}%`}
                </Text>
              ) : null}
            </View>
          ) : null}

          {onTakeAction ? (
            <Pressable
              onPress={() => onTakeAction(insight)}
              style={({ pressed }) => [
                styles.actionBtn,
                { backgroundColor: tone.accent },
                pressed ? { opacity: 0.85 } : null,
              ]}
            >
              <Text style={styles.actionText}>{t('common.takeAction')}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: spacing.base,
    borderRadius: radius.lg,
    ...shadows.xs,
  },
  row: {
    flexDirection: 'row',
    columnGap: spacing.sm,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    rowGap: spacing.xs,
  },
  title: {
    ...textStyles.bodyMedium,
    fontWeight: '700',
  },
  description: {
    ...textStyles.caption,
    color: colors.textPrimary,
  },
  recommendation: {
    ...textStyles.caption,
    fontStyle: 'italic',
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    columnGap: spacing.sm,
    marginTop: spacing.xs,
  },
  metricValue: {
    ...textStyles.h3,
    color: colors.textPrimary,
    fontWeight: '800',
  },
  metricLabel: {
    ...textStyles.caption,
    color: colors.textMuted,
  },
  metricDelta: {
    ...textStyles.caption,
    fontWeight: '700',
  },
  actionBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    marginTop: spacing.xs,
  },
  actionText: {
    ...textStyles.label,
    color: colors.textInverse,
    fontWeight: '700',
  },
});

export default AIInsightCard;
