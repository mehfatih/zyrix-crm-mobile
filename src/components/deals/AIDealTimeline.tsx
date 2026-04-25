/**
 * AIDealTimeline — per-deal timeline with anomaly detection
 * (AI Sprint 3 §9 / Task 5).
 *
 * Renders deal events in chronological order. Each event carries a
 * status (✓ complete / ⏳ pending / ⚠️ delay) and, when AI flags an
 * anomaly, the row shows:
 *   - Reason ("Delay above normal for stage")
 *   - Confidence chip (via AITrustBadge)
 *   - CTA ("Generate follow-up")
 *
 * Anomaly detection compares the gap between two consecutive events
 * against `WorkspaceMemory.responseBaseline[stage]`. The component
 * receives the baseline as a prop so it stays presentational; the
 * caller (DealDetailScreen) pulls the baseline from `aiMemoryService`.
 */

import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Icon, type AnyIconName } from '../common/Icon';
import { AITrustBadge } from '../ai/AITrustBadge';
import {
  zyrixRadius,
  zyrixShadows,
  zyrixSpacing,
  zyrixTheme,
} from '../../theme/zyrixTheme';

export type TimelineEventKind =
  | 'lead'
  | 'contact'
  | 'proposal'
  | 'negotiation'
  | 'closing'
  | 'no_response'
  | 'won'
  | 'lost';

export interface TimelineEvent {
  id: string;
  kind: TimelineEventKind;
  label: string;
  occurredAt: number;
  stage?: string;
  status?: 'complete' | 'pending' | 'delay';
}

export interface AIDealTimelineProps {
  events: TimelineEvent[];
  baselineDaysByStage?: Record<string, number>;
  defaultBaselineDays?: number;
  onResolveAnomaly?: (event: TimelineEvent) => void;
}

interface RenderableEvent extends TimelineEvent {
  dayLabel: string;
  iconName: AnyIconName;
  iconColor: string;
  anomaly?: {
    daysOverBaseline: number;
    baselineDays: number;
    confidence: number;
    reason: string;
  };
}

const KIND_META: Record<
  TimelineEventKind,
  { icon: AnyIconName; color: string }
> = {
  lead: { icon: 'sparkles-outline', color: zyrixTheme.primary },
  contact: { icon: 'mail-outline', color: zyrixTheme.primary },
  proposal: { icon: 'document-text-outline', color: zyrixTheme.primary },
  negotiation: {
    icon: 'swap-horizontal-outline',
    color: zyrixTheme.warning,
  },
  closing: { icon: 'trophy-outline', color: zyrixTheme.success },
  no_response: { icon: 'warning-outline', color: zyrixTheme.warning },
  won: { icon: 'checkmark-circle-outline', color: zyrixTheme.success },
  lost: { icon: 'close-circle-outline', color: zyrixTheme.danger },
};

const STATUS_ICON: Record<NonNullable<TimelineEvent['status']>, AnyIconName> = {
  complete: 'checkmark',
  pending: 'time-outline',
  delay: 'warning-outline',
};

const STATUS_COLOR: Record<NonNullable<TimelineEvent['status']>, string> = {
  complete: zyrixTheme.success,
  pending: zyrixTheme.primary,
  delay: zyrixTheme.warning,
};

const daysBetween = (a: number, b: number): number =>
  Math.max(0, Math.round((b - a) / (1000 * 60 * 60 * 24)));

export const AIDealTimeline: React.FC<AIDealTimelineProps> = ({
  events,
  baselineDaysByStage = {},
  defaultBaselineDays = 5,
  onResolveAnomaly,
}) => {
  const { t } = useTranslation();

  const renderable: RenderableEvent[] = useMemo(() => {
    if (events.length === 0) return [];
    const sorted = [...events].sort((a, b) => a.occurredAt - b.occurredAt);
    const start = sorted[0]?.occurredAt ?? Date.now();

    return sorted.map((evt, idx) => {
      const meta = KIND_META[evt.kind];
      const dayNumber = daysBetween(start, evt.occurredAt) + 1;
      const baselineDays =
        baselineDaysByStage[evt.stage ?? ''] ?? defaultBaselineDays;
      const previous = sorted[idx - 1];
      const gap = previous
        ? daysBetween(previous.occurredAt, evt.occurredAt)
        : 0;

      let anomaly: RenderableEvent['anomaly'] | undefined;
      if (
        evt.status === 'delay' ||
        (previous && gap > baselineDays * 1.5 && evt.kind === 'no_response')
      ) {
        const daysOverBaseline = Math.max(gap - baselineDays, 0);
        const ratio = baselineDays > 0 ? gap / baselineDays : 0;
        const confidence =
          ratio > 3 ? 92 : ratio > 2 ? 85 : ratio > 1.5 ? 75 : 60;
        anomaly = {
          daysOverBaseline,
          baselineDays,
          confidence,
          reason: t('timeline.delayReason', {
            days: daysOverBaseline,
            baseline: baselineDays,
          }),
        };
      }

      return {
        ...evt,
        dayLabel: t('timeline.dayLabel', { day: dayNumber }),
        iconName: meta.icon,
        iconColor: meta.color,
        anomaly,
      };
    });
  }, [events, baselineDaysByStage, defaultBaselineDays, t]);

  if (renderable.length === 0) {
    return (
      <View style={styles.empty}>
        <Icon
          name="time-outline"
          size={20}
          color={zyrixTheme.textMuted}
          family="Ionicons"
        />
        <Text style={styles.emptyText}>{t('timeline.empty')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {renderable.map((evt, idx) => {
        const isLast = idx === renderable.length - 1;
        const status = evt.anomaly ? 'delay' : evt.status ?? 'complete';

        return (
          <View key={evt.id} style={styles.row}>
            <View style={styles.timelineRail}>
              <View style={styles.iconWrap}>
                <Icon
                  name={evt.iconName}
                  size={14}
                  color={evt.iconColor}
                  family="Ionicons"
                />
              </View>
              {!isLast ? <View style={styles.connector} /> : null}
            </View>

            <View style={styles.eventBody}>
              <View style={styles.eventHeader}>
                <Text style={styles.eventDay}>{evt.dayLabel}</Text>
                <View style={styles.statusChip}>
                  <Icon
                    name={STATUS_ICON[status]}
                    size={12}
                    color={STATUS_COLOR[status]}
                    family="Ionicons"
                  />
                </View>
              </View>
              <Text style={styles.eventLabel}>{evt.label}</Text>

              {evt.anomaly ? (
                <View style={styles.anomalyCard}>
                  <View style={styles.anomalyHeader}>
                    <Icon
                      name="sparkles-outline"
                      size={12}
                      color={zyrixTheme.primary}
                      family="Ionicons"
                    />
                    <Text style={styles.anomalyAi}>
                      {t('timeline.aiTag').toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.anomalyReason}>{evt.anomaly.reason}</Text>
                  <AITrustBadge
                    confidence={evt.anomaly.confidence}
                    reason={evt.anomaly.reason}
                    signals={[
                      t('timeline.signalGap', {
                        days: evt.anomaly.daysOverBaseline,
                      }),
                      t('timeline.signalBaseline', {
                        baseline: evt.anomaly.baselineDays,
                      }),
                    ]}
                    recommendedAction={t('timeline.actionGenerateFollowup')}
                  />
                  <Pressable
                    onPress={() => onResolveAnomaly?.(evt)}
                    style={styles.anomalyCta}
                    accessibilityRole="button"
                  >
                    <Text style={styles.anomalyCtaText}>
                      {t('timeline.actionGenerateFollowup')}
                    </Text>
                    <Icon
                      name="arrow-forward"
                      size={14}
                      color={zyrixTheme.textInverse}
                      family="Ionicons"
                    />
                  </Pressable>
                </View>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    rowGap: zyrixSpacing.sm,
    padding: zyrixSpacing.sm,
  },
  empty: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 8,
    padding: zyrixSpacing.lg,
    backgroundColor: zyrixTheme.cardBg,
    borderRadius: zyrixRadius.lg,
    borderWidth: 1,
    borderColor: zyrixTheme.cardBorder,
  },
  emptyText: {
    color: zyrixTheme.textMuted,
    fontSize: 13,
  },
  row: {
    flexDirection: 'row',
    columnGap: zyrixSpacing.sm,
  },
  timelineRail: {
    width: 28,
    alignItems: 'center',
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: zyrixTheme.aiSurface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: zyrixTheme.aiBorder,
  },
  connector: {
    flex: 1,
    width: 2,
    backgroundColor: zyrixTheme.aiBorder,
    marginTop: 2,
  },
  eventBody: {
    flex: 1,
    rowGap: 4,
    paddingBottom: zyrixSpacing.sm + 4,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 6,
  },
  eventDay: {
    flex: 1,
    fontSize: 11,
    color: zyrixTheme.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statusChip: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: zyrixTheme.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: zyrixTheme.cardBorder,
  },
  eventLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: zyrixTheme.textHeading,
  },
  anomalyCard: {
    marginTop: 8,
    backgroundColor: 'rgba(245,158,11,0.08)',
    borderRadius: zyrixRadius.base,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.4)',
    padding: zyrixSpacing.sm + 4,
    rowGap: 8,
  },
  anomalyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 4,
  },
  anomalyAi: {
    fontSize: 10,
    fontWeight: '700',
    color: zyrixTheme.primary,
    letterSpacing: 1.1,
  },
  anomalyReason: {
    fontSize: 13,
    color: zyrixTheme.textBody,
    lineHeight: 18,
  },
  anomalyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: 6,
    backgroundColor: zyrixTheme.primary,
    borderRadius: zyrixRadius.base,
    paddingVertical: 9,
    ...zyrixShadows.card,
  },
  anomalyCtaText: {
    color: zyrixTheme.textInverse,
    fontSize: 13,
    fontWeight: '700',
  },
});

export default AIDealTimeline;
