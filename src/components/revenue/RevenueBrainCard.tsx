/**
 * RevenueBrainCard — dashboard summary surface for the Revenue Brain
 * (AI Sprint 3 §10 / Task 6).
 *
 * Shows expected monthly revenue, target progress, top leakage, and
 * the highest-impact next action. Tapping the CTA escalates to the
 * full Revenue Brain screen (wired by Sprint 4).
 *
 * Loads on mount via `aiRevenueBrain.forecast()`. Displays a soft
 * skeleton while the forecast resolves so the dashboard layout
 * doesn't pop.
 */

import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

import { Icon } from '../common/Icon';
import { AITrustBadge } from '../ai/AITrustBadge';
import {
  zyrixRadius,
  zyrixShadows,
  zyrixSpacing,
  zyrixTheme,
} from '../../theme/zyrixTheme';
import {
  aiRevenueBrain,
  type RevenueBrainOutput,
} from '../../services/aiRevenueBrain';

export interface RevenueBrainCardProps {
  workspaceId?: string;
  currency?: string;
  onOpen?: () => void;
}

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

const clampProgress = (value: number, target: number): number => {
  if (target <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((value / target) * 100)));
};

export const RevenueBrainCard: React.FC<RevenueBrainCardProps> = ({
  workspaceId,
  currency = 'USD',
  onOpen,
}) => {
  const { t } = useTranslation();
  const [snapshot, setSnapshot] = useState<RevenueBrainOutput | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    aiRevenueBrain
      .forecast({ workspaceId: workspaceId ?? 'default', currency })
      .then((result) => {
        if (mounted) setSnapshot(result);
      })
      .catch((err) => {
        console.warn('[RevenueBrainCard] forecast failed', err);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [workspaceId, currency]);

  if (loading || !snapshot) {
    return (
      <View style={styles.skeleton}>
        <Text style={styles.skeletonText}>{t('revenueBrain.loading')}</Text>
      </View>
    );
  }

  const progressPct = clampProgress(
    snapshot.targetProgress.current,
    snapshot.targetProgress.target
  );
  const topLeakage = snapshot.leakage[0];
  const topAction = snapshot.nextBestActions[0];

  return (
    <View style={styles.card}>
      <LinearGradient
        colors={[zyrixTheme.aiSurface, zyrixTheme.cardBg]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.headerRow}>
          <View style={styles.titleWrap}>
            <View style={styles.titleBadge}>
              <Icon
                name="trending-up-outline"
                size={14}
                color={zyrixTheme.primary}
                family="Ionicons"
              />
              <Text style={styles.titleBadgeText}>
                {t('revenueBrain.title').toUpperCase()}
              </Text>
            </View>
            <Text style={styles.expectedLabel}>
              {t('revenueBrain.expectedMonth')}
            </Text>
            <Text style={styles.expectedValue}>
              {formatCurrency(snapshot.expectedMonthly, snapshot.currency)}
            </Text>
          </View>
          <AITrustBadge confidence={snapshot.confidence} compact />
        </View>

        <View style={styles.scenarios}>
          <ScenarioCell
            label={t('revenueBrain.bestCase')}
            value={formatCurrency(snapshot.bestCase, snapshot.currency)}
            color={zyrixTheme.success}
          />
          <ScenarioCell
            label={t('revenueBrain.likely')}
            value={formatCurrency(snapshot.likely, snapshot.currency)}
            color={zyrixTheme.primary}
          />
          <ScenarioCell
            label={t('revenueBrain.riskCase')}
            value={formatCurrency(snapshot.riskCase, snapshot.currency)}
            color={zyrixTheme.warning}
          />
        </View>

        <View style={styles.progressBlock}>
          <View style={styles.progressLabels}>
            <Text style={styles.progressLabel}>
              {t('revenueBrain.target')}{' '}
              <Text style={styles.progressValue}>
                {formatCurrency(snapshot.targetProgress.target, snapshot.currency)}
              </Text>
            </Text>
            <Text style={styles.progressPct}>{progressPct}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progressPct}%`,
                  backgroundColor:
                    progressPct >= 90
                      ? zyrixTheme.success
                      : progressPct >= 60
                      ? zyrixTheme.primary
                      : zyrixTheme.warning,
                },
              ]}
            />
          </View>
          <Text style={styles.progressHint}>
            {snapshot.targetProgress.gap > 0
              ? t('revenueBrain.gapShort', {
                  amount: formatCurrency(
                    snapshot.targetProgress.gap,
                    snapshot.currency
                  ),
                })
              : t('revenueBrain.aboveTarget')}
          </Text>
        </View>

        {topLeakage ? (
          <View style={styles.leakageRow}>
            <Icon
              name="alert-circle-outline"
              size={16}
              color={zyrixTheme.warning}
              family="Ionicons"
            />
            <Text style={styles.leakageText}>
              {topLeakage.reason} ·{' '}
              {formatCurrency(topLeakage.valueAtRisk, snapshot.currency)}
            </Text>
          </View>
        ) : null}

        {topAction ? (
          <View style={styles.actionRow}>
            <Icon
              name="bulb-outline"
              size={16}
              color={zyrixTheme.primary}
              family="Ionicons"
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.actionText}>{topAction.action}</Text>
              <Text style={styles.actionImpact}>
                {t('revenueBrain.impact')}:{' '}
                {formatCurrency(topAction.impact, snapshot.currency)}
              </Text>
            </View>
          </View>
        ) : null}

        <Pressable
          onPress={onOpen}
          style={styles.cta}
          accessibilityRole="button"
          accessibilityLabel={t('revenueBrain.openFull')}
        >
          <Text style={styles.ctaText}>{t('revenueBrain.openFull')}</Text>
          <Icon
            name="chevron-forward"
            size={16}
            color={zyrixTheme.primary}
            family="Ionicons"
          />
        </Pressable>
      </LinearGradient>
    </View>
  );
};

const ScenarioCell: React.FC<{ label: string; value: string; color: string }> = ({
  label,
  value,
  color,
}) => (
  <View style={styles.scenarioCell}>
    <View style={[styles.scenarioDot, { backgroundColor: color }]} />
    <Text style={styles.scenarioLabel}>{label}</Text>
    <Text style={[styles.scenarioValue, { color }]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  card: {
    borderRadius: zyrixRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: zyrixTheme.cardBorder,
    ...zyrixShadows.card,
  },
  gradient: {
    padding: zyrixSpacing.base,
    rowGap: zyrixSpacing.sm + 4,
  },
  skeleton: {
    backgroundColor: zyrixTheme.cardBg,
    borderRadius: zyrixRadius.xl,
    padding: zyrixSpacing.lg,
    borderWidth: 1,
    borderColor: zyrixTheme.cardBorder,
    ...zyrixShadows.card,
  },
  skeletonText: {
    color: zyrixTheme.textMuted,
    fontSize: 13,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    columnGap: 8,
  },
  titleWrap: { flex: 1, rowGap: 4 },
  titleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: zyrixTheme.aiSurface,
    borderRadius: zyrixRadius.pill,
    borderWidth: 1,
    borderColor: zyrixTheme.aiBorder,
    marginBottom: 4,
  },
  titleBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: zyrixTheme.primary,
    letterSpacing: 1.1,
  },
  expectedLabel: {
    fontSize: 12,
    color: zyrixTheme.textMuted,
    fontWeight: '600',
  },
  expectedValue: {
    fontSize: 26,
    fontWeight: '800',
    color: zyrixTheme.textHeading,
  },
  scenarios: {
    flexDirection: 'row',
    columnGap: 8,
  },
  scenarioCell: {
    flex: 1,
    backgroundColor: zyrixTheme.cardBg,
    borderRadius: zyrixRadius.base,
    padding: 10,
    rowGap: 4,
    borderWidth: 1,
    borderColor: zyrixTheme.cardBorder,
  },
  scenarioDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  scenarioLabel: {
    fontSize: 10,
    color: zyrixTheme.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  scenarioValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  progressBlock: {
    rowGap: 6,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: 12,
    color: zyrixTheme.textMuted,
  },
  progressValue: {
    color: zyrixTheme.textBody,
    fontWeight: '700',
  },
  progressPct: {
    fontSize: 12,
    color: zyrixTheme.primary,
    fontWeight: '700',
  },
  progressBar: {
    height: 8,
    backgroundColor: zyrixTheme.surfaceAlt,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: 8,
    borderRadius: 4,
  },
  progressHint: {
    fontSize: 11,
    color: zyrixTheme.textMuted,
  },
  leakageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 6,
    backgroundColor: 'rgba(245,158,11,0.08)',
    borderRadius: zyrixRadius.base,
    padding: 10,
  },
  leakageText: {
    flex: 1,
    fontSize: 12,
    color: zyrixTheme.textBody,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    columnGap: 8,
    backgroundColor: zyrixTheme.aiSurface,
    borderRadius: zyrixRadius.base,
    padding: 10,
  },
  actionText: {
    fontSize: 13,
    color: zyrixTheme.textBody,
    fontWeight: '600',
  },
  actionImpact: {
    fontSize: 11,
    color: zyrixTheme.primary,
    fontWeight: '700',
    marginTop: 2,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: 4,
    paddingVertical: 8,
  },
  ctaText: {
    color: zyrixTheme.primary,
    fontSize: 13,
    fontWeight: '700',
  },
});

export default RevenueBrainCard;
