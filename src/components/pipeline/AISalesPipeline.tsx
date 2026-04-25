/**
 * AISalesPipeline — AI-augmented kanban surface (AI Sprint 3 §8 / Task 4).
 *
 * Each stage column renders an AI summary header (count + risk + best
 * deal) and the deals inside carry an AI insight badge so a glance
 * tells the rep where attention is needed.
 *
 * Stage CTAs (per spec):
 *   Lead Created    → AI scores lead         · CTA: Start outreach
 *   Qualification   → AI detects intent      · CTA: Book demo / qualify
 *   Proposal        → AI suggests timing     · CTA: Generate proposal
 *   Negotiation     → AI suggests strategy   · CTA: Draft counter
 *   Closing         → AI predicts win prob   · CTA: Closing plan
 *   Post-sale       → AI suggests upsell     · CTA: Success plan
 *
 * The drag-drop reordering UX is owned by the existing Kanban screen
 * in the CRM stack — this component is the AI overlay used both
 * stand-alone (in tests / Sprint 4 wiring) and as a header strip
 * above the Kanban board.
 */

import React, { useMemo } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { Icon, type AnyIconName } from '../common/Icon';
import { AITrustBadge } from '../ai/AITrustBadge';
import {
  zyrixRadius,
  zyrixShadows,
  zyrixSpacing,
  zyrixTheme,
} from '../../theme/zyrixTheme';

export type PipelineStage =
  | 'lead'
  | 'qualified'
  | 'proposal'
  | 'negotiation'
  | 'closing'
  | 'postsale';

export interface PipelineDeal {
  id: string;
  customerName: string;
  value: number;
  daysInStage: number;
  probability: number;
  aiInsight?: string;
  riskLevel?: 'low' | 'medium' | 'high';
}

export interface PipelineStageColumn {
  stage: PipelineStage;
  deals: PipelineDeal[];
}

export interface AISalesPipelineProps {
  columns?: PipelineStageColumn[];
  currency?: string;
  onSelectDeal?: (dealId: string) => void;
  onStageCta?: (stage: PipelineStage) => void;
}

const STAGE_META: Record<
  PipelineStage,
  {
    titleKey: string;
    summaryKey: string;
    ctaKey: string;
    icon: AnyIconName;
    accent: string;
  }
> = {
  lead: {
    titleKey: 'pipeline.stage.lead',
    summaryKey: 'pipeline.summary.lead',
    ctaKey: 'pipeline.cta.startOutreach',
    icon: 'sparkles-outline',
    accent: zyrixTheme.primary,
  },
  qualified: {
    titleKey: 'pipeline.stage.qualified',
    summaryKey: 'pipeline.summary.qualified',
    ctaKey: 'pipeline.cta.bookDemo',
    icon: 'flash-outline',
    accent: zyrixTheme.info,
  },
  proposal: {
    titleKey: 'pipeline.stage.proposal',
    summaryKey: 'pipeline.summary.proposal',
    ctaKey: 'pipeline.cta.generateProposal',
    icon: 'document-text-outline',
    accent: zyrixTheme.primary,
  },
  negotiation: {
    titleKey: 'pipeline.stage.negotiation',
    summaryKey: 'pipeline.summary.negotiation',
    ctaKey: 'pipeline.cta.draftCounter',
    icon: 'swap-horizontal-outline',
    accent: zyrixTheme.warning,
  },
  closing: {
    titleKey: 'pipeline.stage.closing',
    summaryKey: 'pipeline.summary.closing',
    ctaKey: 'pipeline.cta.closingPlan',
    icon: 'trophy-outline',
    accent: zyrixTheme.success,
  },
  postsale: {
    titleKey: 'pipeline.stage.postsale',
    summaryKey: 'pipeline.summary.postsale',
    ctaKey: 'pipeline.cta.successPlan',
    icon: 'heart-outline',
    accent: zyrixTheme.primaryDark,
  },
};

const formatCurrency = (value: number, currency: string): string => {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${currency} ${value.toLocaleString()}`;
  }
};

const buildDefaultColumns = (): PipelineStageColumn[] => [
  {
    stage: 'lead',
    deals: [
      {
        id: 'l1',
        customerName: 'Sara Khalid',
        value: 4_500,
        daysInStage: 1,
        probability: 0.25,
        aiInsight: 'Lead score 88 · responds in 6h',
        riskLevel: 'low',
      },
    ],
  },
  {
    stage: 'qualified',
    deals: [
      {
        id: 'q1',
        customerName: 'Levant Foods',
        value: 12_500,
        daysInStage: 4,
        probability: 0.42,
        aiInsight: 'Buying signal detected in last call',
        riskLevel: 'low',
      },
    ],
  },
  {
    stage: 'proposal',
    deals: [
      {
        id: 'p1',
        customerName: 'Al-Faisal Trading',
        value: 24_000,
        daysInStage: 9,
        probability: 0.55,
        aiInsight: 'Stalled — send timing nudge today',
        riskLevel: 'high',
      },
    ],
  },
  {
    stage: 'negotiation',
    deals: [
      {
        id: 'n1',
        customerName: 'Anatolia Logistics',
        value: 38_500,
        daysInStage: 4,
        probability: 0.72,
        aiInsight: 'Price objection likely — prep counter',
        riskLevel: 'medium',
      },
    ],
  },
  {
    stage: 'closing',
    deals: [
      {
        id: 'c1',
        customerName: 'Gulf Builders',
        value: 65_000,
        daysInStage: 2,
        probability: 0.81,
        aiInsight: 'High win probability · close this week',
        riskLevel: 'low',
      },
    ],
  },
  {
    stage: 'postsale',
    deals: [
      {
        id: 's1',
        customerName: 'Mansour Group',
        value: 28_000,
        daysInStage: 90,
        probability: 1,
        aiInsight: 'Upsell window — propose expansion',
        riskLevel: 'low',
      },
    ],
  },
];

const riskColor = (level: PipelineDeal['riskLevel']): string => {
  switch (level) {
    case 'high':
      return zyrixTheme.danger;
    case 'medium':
      return zyrixTheme.warning;
    case 'low':
    default:
      return zyrixTheme.success;
  }
};

export const AISalesPipeline: React.FC<AISalesPipelineProps> = ({
  columns,
  currency = 'USD',
  onSelectDeal,
  onStageCta,
}) => {
  const { t } = useTranslation();
  const data = useMemo(() => columns ?? buildDefaultColumns(), [columns]);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scroll}
    >
      {data.map((column) => {
        const meta = STAGE_META[column.stage];
        const total = column.deals.reduce((sum, d) => sum + d.value, 0);
        const atRisk = column.deals.filter((d) => d.riskLevel === 'high').length;
        const best = [...column.deals].sort((a, b) => b.probability - a.probability)[0];

        return (
          <View key={column.stage} style={styles.column}>
            <View style={[styles.columnHeader, { borderLeftColor: meta.accent }]}>
              <View style={styles.columnTitleRow}>
                <Icon
                  name={meta.icon}
                  size={14}
                  color={meta.accent}
                  family="Ionicons"
                />
                <Text style={styles.columnTitle}>{t(meta.titleKey)}</Text>
                <View style={styles.countPill}>
                  <Text style={styles.countText}>{column.deals.length}</Text>
                </View>
              </View>
              <Text style={styles.columnTotal}>{formatCurrency(total, currency)}</Text>
              <Text style={styles.columnSummary}>{t(meta.summaryKey)}</Text>
              {atRisk > 0 ? (
                <View style={styles.riskPill}>
                  <Icon
                    name="warning-outline"
                    size={11}
                    color={zyrixTheme.danger}
                    family="Ionicons"
                  />
                  <Text style={styles.riskText}>
                    {t('pipeline.atRiskCount', { count: atRisk })}
                  </Text>
                </View>
              ) : null}
              {best ? (
                <Pressable
                  onPress={() => onStageCta?.(column.stage)}
                  style={styles.stageCta}
                  accessibilityRole="button"
                >
                  <Text style={[styles.stageCtaText, { color: meta.accent }]}>
                    {t(meta.ctaKey)}
                  </Text>
                  <Icon
                    name="chevron-forward"
                    size={12}
                    color={meta.accent}
                    family="Ionicons"
                  />
                </Pressable>
              ) : null}
            </View>

            <View style={styles.dealList}>
              {column.deals.map((deal) => (
                <Pressable
                  key={deal.id}
                  onPress={() => onSelectDeal?.(deal.id)}
                  style={styles.dealCard}
                  accessibilityRole="button"
                >
                  <View style={styles.dealHeader}>
                    <Text style={styles.dealName} numberOfLines={1}>
                      {deal.customerName}
                    </Text>
                    <View
                      style={[
                        styles.riskDot,
                        { backgroundColor: riskColor(deal.riskLevel) },
                      ]}
                    />
                  </View>
                  <Text style={styles.dealValue}>
                    {formatCurrency(deal.value, currency)}
                  </Text>
                  <Text style={styles.dealMeta}>
                    {t('pipeline.dayInStage', { count: deal.daysInStage })} ·{' '}
                    {Math.round(deal.probability * 100)}%
                  </Text>
                  {deal.aiInsight ? (
                    <View style={styles.dealInsight}>
                      <Icon
                        name="sparkles-outline"
                        size={11}
                        color={zyrixTheme.primary}
                        family="Ionicons"
                      />
                      <Text style={styles.dealInsightText} numberOfLines={2}>
                        {deal.aiInsight}
                      </Text>
                    </View>
                  ) : null}
                  <AITrustBadge
                    confidence={Math.round(deal.probability * 100)}
                    compact
                  />
                </Pressable>
              ))}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: {
    padding: zyrixSpacing.base,
    columnGap: zyrixSpacing.sm + 4,
  },
  column: {
    width: 240,
    rowGap: zyrixSpacing.sm,
  },
  columnHeader: {
    backgroundColor: zyrixTheme.cardBg,
    borderRadius: zyrixRadius.lg,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: zyrixTheme.cardBorder,
    padding: zyrixSpacing.sm + 4,
    rowGap: 4,
    ...zyrixShadows.card,
  },
  columnTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 6,
  },
  columnTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: zyrixTheme.textHeading,
    flex: 1,
  },
  countPill: {
    backgroundColor: zyrixTheme.aiSurface,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: zyrixRadius.pill,
  },
  countText: {
    fontSize: 11,
    fontWeight: '700',
    color: zyrixTheme.primary,
  },
  columnTotal: {
    fontSize: 16,
    fontWeight: '800',
    color: zyrixTheme.textHeading,
  },
  columnSummary: {
    fontSize: 11,
    color: zyrixTheme.textMuted,
    lineHeight: 15,
  },
  riskPill: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 4,
    backgroundColor: 'rgba(239,68,68,0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: zyrixRadius.pill,
    alignSelf: 'flex-start',
  },
  riskText: {
    fontSize: 10,
    fontWeight: '700',
    color: zyrixTheme.danger,
  },
  stageCta: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 4,
    marginTop: 4,
  },
  stageCtaText: {
    fontSize: 12,
    fontWeight: '700',
  },
  dealList: {
    rowGap: zyrixSpacing.sm,
  },
  dealCard: {
    backgroundColor: zyrixTheme.cardBg,
    borderRadius: zyrixRadius.base,
    padding: zyrixSpacing.sm + 4,
    borderWidth: 1,
    borderColor: zyrixTheme.cardBorder,
    rowGap: 4,
    ...zyrixShadows.card,
  },
  dealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    columnGap: 6,
  },
  dealName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: zyrixTheme.textHeading,
  },
  riskDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dealValue: {
    fontSize: 14,
    fontWeight: '700',
    color: zyrixTheme.primary,
  },
  dealMeta: {
    fontSize: 11,
    color: zyrixTheme.textMuted,
  },
  dealInsight: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    columnGap: 4,
    backgroundColor: zyrixTheme.aiSurface,
    borderRadius: zyrixRadius.sm,
    padding: 6,
  },
  dealInsightText: {
    flex: 1,
    fontSize: 11,
    color: zyrixTheme.textBody,
    lineHeight: 14,
  },
});

export default AISalesPipeline;
