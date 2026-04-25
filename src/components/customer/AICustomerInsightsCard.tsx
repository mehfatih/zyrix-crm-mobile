/**
 * AICustomerInsightsCard — AI inside the customer profile
 * (AI Sprint 3 §12 / Task 7).
 *
 * Surfaces four blocks at the top of the customer detail screen:
 *   1. AI Customer Summary — auto-generated paragraph.
 *   2. Behaviour pattern chips (replies fast, prefers WhatsApp, …).
 *   3. Opportunity level with confidence (Trust Layer chip).
 *   4. Next best action card — reuses the AIPriorityCard contract.
 *
 * The component accepts pre-computed insights from the caller so it
 * stays pure / testable. The customer screen passes data derived
 * from the customer record and (when available) the decision engine
 * output.
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

import { Icon, type AnyIconName } from '../common/Icon';
import { AITrustBadge } from '../ai/AITrustBadge';
import {
  zyrixRadius,
  zyrixShadows,
  zyrixSpacing,
  zyrixTheme,
} from '../../theme/zyrixTheme';
import type { RankedAction } from '../../types/ai';

export type OpportunityLevel = 'high' | 'medium' | 'low';

export interface BehaviourPattern {
  id: string;
  icon: AnyIconName;
  label: string;
}

export interface AICustomerInsights {
  summary: string;
  behaviour: BehaviourPattern[];
  opportunity: {
    level: OpportunityLevel;
    label: string;
    confidence: number;
    reason: string;
    signals: string[];
  };
  nextBestAction?: Pick<
    RankedAction,
    'title' | 'reason' | 'confidence' | 'signals' | 'recommendedAction' | 'cta' | 'type'
  >;
}

export interface AICustomerInsightsCardProps {
  insights: AICustomerInsights;
  onAction?: () => void;
}

const opportunityColor = (level: OpportunityLevel): string => {
  switch (level) {
    case 'high':
      return zyrixTheme.success;
    case 'medium':
      return zyrixTheme.primary;
    case 'low':
    default:
      return zyrixTheme.warning;
  }
};

export const AICustomerInsightsCard: React.FC<
  AICustomerInsightsCardProps
> = ({ insights, onAction }) => {
  const { t } = useTranslation();
  const oppColor = opportunityColor(insights.opportunity.level);

  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={[zyrixTheme.aiSurface, zyrixTheme.cardBg]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.summary}
      >
        <View style={styles.headerRow}>
          <View style={styles.aiTag}>
            <Icon
              name="sparkles-outline"
              size={12}
              color={zyrixTheme.primary}
              family="Ionicons"
            />
            <Text style={styles.aiTagText}>
              {t('customer.ai.summaryLabel').toUpperCase()}
            </Text>
          </View>
        </View>
        <Text style={styles.summaryText}>{insights.summary}</Text>
      </LinearGradient>

      {insights.behaviour.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>
            {t('customer.ai.behaviourPattern')}
          </Text>
          <View style={styles.behaviourRow}>
            {insights.behaviour.map((pattern) => (
              <View key={pattern.id} style={styles.behaviourChip}>
                <Icon
                  name={pattern.icon}
                  size={12}
                  color={zyrixTheme.primary}
                  family="Ionicons"
                />
                <Text style={styles.behaviourText}>{pattern.label}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.sectionLabel}>
          {t('customer.ai.opportunityLevel')}
        </Text>
        <View style={styles.opportunityRow}>
          <View style={[styles.oppDot, { backgroundColor: oppColor }]} />
          <Text style={[styles.opportunityValue, { color: oppColor }]}>
            {insights.opportunity.label}
          </Text>
          <View style={{ flex: 1 }} />
          <AITrustBadge
            confidence={insights.opportunity.confidence}
            reason={insights.opportunity.reason}
            signals={insights.opportunity.signals}
            recommendedAction={insights.nextBestAction?.recommendedAction}
            compact
          />
        </View>
        <Text style={styles.opportunityReason}>
          {insights.opportunity.reason}
        </Text>
      </View>

      {insights.nextBestAction ? (
        <View style={styles.actionCard}>
          <View style={styles.actionHeader}>
            <Icon
              name="bulb-outline"
              size={14}
              color={zyrixTheme.primary}
              family="Ionicons"
            />
            <Text style={styles.actionLabel}>
              {t('customer.ai.nextBestAction').toUpperCase()}
            </Text>
          </View>
          <Text style={styles.actionTitle}>
            {insights.nextBestAction.title}
          </Text>
          <Text style={styles.actionReason}>
            {insights.nextBestAction.reason}
          </Text>
          <AITrustBadge
            confidence={insights.nextBestAction.confidence}
            reason={insights.nextBestAction.reason}
            signals={insights.nextBestAction.signals}
            recommendedAction={insights.nextBestAction.recommendedAction}
          />
          <Pressable
            onPress={onAction}
            style={styles.actionCta}
            accessibilityRole="button"
          >
            <LinearGradient
              colors={[zyrixTheme.primaryLight, zyrixTheme.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.actionCtaGradient}
            >
              <Text style={styles.actionCtaText}>
                {insights.nextBestAction.cta.label}
              </Text>
              <Icon
                name="arrow-forward"
                size={14}
                color={zyrixTheme.textInverse}
                family="Ionicons"
              />
            </LinearGradient>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    rowGap: zyrixSpacing.sm + 4,
  },
  summary: {
    borderRadius: zyrixRadius.lg,
    padding: zyrixSpacing.base - 2,
    rowGap: 6,
    borderWidth: 1,
    borderColor: zyrixTheme.aiBorder,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiTag: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 4,
    backgroundColor: zyrixTheme.cardBg,
    borderRadius: zyrixRadius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: zyrixTheme.aiBorder,
  },
  aiTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: zyrixTheme.primary,
    letterSpacing: 1.1,
  },
  summaryText: {
    fontSize: 13,
    color: zyrixTheme.textBody,
    lineHeight: 19,
  },
  card: {
    backgroundColor: zyrixTheme.cardBg,
    borderRadius: zyrixRadius.lg,
    padding: zyrixSpacing.base - 2,
    borderWidth: 1,
    borderColor: zyrixTheme.cardBorder,
    rowGap: 6,
    ...zyrixShadows.card,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: zyrixTheme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  behaviourRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  behaviourChip: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 4,
    backgroundColor: zyrixTheme.aiSurface,
    borderRadius: zyrixRadius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: zyrixTheme.aiBorder,
  },
  behaviourText: {
    fontSize: 11,
    fontWeight: '600',
    color: zyrixTheme.primary,
  },
  opportunityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 6,
  },
  oppDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  opportunityValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  opportunityReason: {
    fontSize: 12,
    color: zyrixTheme.textBody,
    lineHeight: 17,
  },
  actionCard: {
    backgroundColor: zyrixTheme.cardBg,
    borderRadius: zyrixRadius.lg,
    padding: zyrixSpacing.base - 2,
    borderLeftWidth: 4,
    borderLeftColor: zyrixTheme.primary,
    borderWidth: 1,
    borderColor: zyrixTheme.cardBorder,
    rowGap: 8,
    ...zyrixShadows.card,
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 6,
  },
  actionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: zyrixTheme.primary,
    letterSpacing: 1.1,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: zyrixTheme.textHeading,
  },
  actionReason: {
    fontSize: 12,
    color: zyrixTheme.textBody,
    lineHeight: 17,
  },
  actionCta: {
    borderRadius: zyrixRadius.base,
    overflow: 'hidden',
  },
  actionCtaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: 6,
    paddingVertical: 10,
  },
  actionCtaText: {
    color: zyrixTheme.textInverse,
    fontSize: 13,
    fontWeight: '700',
  },
});

export default AICustomerInsightsCard;
