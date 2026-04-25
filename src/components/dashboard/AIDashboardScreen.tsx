/**
 * AIDashboardScreen — AI-first mobile dashboard (AI Sprint 3 §4 / Task 1).
 *
 * Section order is non-negotiable per spec:
 *   1. Greeting + date + locale badge
 *   2. Today's AI Focus (top 5 ranked actions)
 *   3. AI Insight (top action with explain)
 *   4. Smart Stats (context-rich, never raw numbers)
 *   5. Revenue Brain summary
 *   6. Recent activities
 *   7. Charts (small, AI-explained — never the hero)
 *
 * Charts are intentionally tiny and live below everything else; the
 * AI annotations explain what they mean. The floating AI button comes
 * from `AICommandCenter` mounted at the App root.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppScreen } from '../layout/AppScreen';
import { AIPriorityCard } from './AIPriorityCard';
import { SmartStatCard } from './SmartStatCard';
import { RevenueBrainCard } from '../revenue/RevenueBrainCard';
import { AITrustBadge } from '../ai/AITrustBadge';
import { Icon } from '../common/Icon';
import {
  zyrixRadius,
  zyrixShadows,
  zyrixSpacing,
  zyrixTheme,
} from '../../theme/zyrixTheme';
import { aiDecisionEngine } from '../../services/aiDecisionEngine';
import { useUserStore } from '../../store/userStore';
import type { RankedAction } from '../../types/ai';

const greetingKey = (date: Date): string => {
  const hour = date.getHours();
  if (hour < 12) return 'common.goodMorning';
  if (hour < 17) return 'common.goodAfternoon';
  return 'common.goodEvening';
};

const formatDate = (date: Date, locale: string): string => {
  try {
    return new Intl.DateTimeFormat(locale, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(date);
  } catch {
    return date.toDateString();
  }
};

interface MockActivity {
  id: string;
  icon: 'mail-outline' | 'call-outline' | 'briefcase-outline' | 'people-outline';
  title: string;
  subtitle: string;
  at: string;
}

const MOCK_ACTIVITIES: MockActivity[] = [
  {
    id: 'a1',
    icon: 'mail-outline',
    title: 'Proposal sent · Anatolia Logistics',
    subtitle: '$38,500 · negotiation stage',
    at: '2h ago',
  },
  {
    id: 'a2',
    icon: 'call-outline',
    title: 'Discovery call · Gulf Builders',
    subtitle: '12 minutes · positive sentiment',
    at: 'yesterday',
  },
  {
    id: 'a3',
    icon: 'people-outline',
    title: 'New customer · Sara Khalid',
    subtitle: 'Riyadh boutique · lead score 88',
    at: '2 days ago',
  },
];

export const AIDashboardScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const currentUser = useUserStore((s) => s.currentUser);
  const [actions, setActions] = useState<RankedAction[]>([]);
  const [loading, setLoading] = useState(false);

  const workspaceId = currentUser?.companyId ?? 'default-workspace';
  const userId = currentUser?.id ?? 'anonymous';
  const localeBadge = (currentUser?.country ?? 'GLOBAL').toUpperCase();
  const firstName = currentUser?.name?.split(' ')[0] ?? t('common.welcome');

  const loadActions = useCallback(async () => {
    setLoading(true);
    try {
      const result = await aiDecisionEngine.generateDailyActions({
        workspaceId,
        userId,
      });
      setActions(result);
    } catch (err) {
      console.warn('[AIDashboardScreen] decision engine failed', err);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, userId]);

  useEffect(() => {
    void loadActions();
  }, [loadActions]);

  const greeting = useMemo(() => t(greetingKey(new Date())), [t]);
  const today = useMemo(
    () => formatDate(new Date(), i18n.language),
    [i18n.language]
  );
  const topAction = actions[0];
  const focus = actions.slice(0, 5);

  return (
    <AppScreen>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadActions}
            tintColor={zyrixTheme.primary}
          />
        }
      >
        {/* 1. Greeting + locale badge */}
        <View style={styles.greetingRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>
              {greeting}, {firstName}
            </Text>
            <Text style={styles.date}>{today}</Text>
          </View>
          <View style={styles.localeBadge}>
            <Text style={styles.localeBadgeText}>{localeBadge}</Text>
          </View>
        </View>

        {/* 2. Today's AI Focus */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('dashboard.todaysFocus')}</Text>
          <Text style={styles.sectionSubtitle}>
            {t('dashboard.topActionsForToday')}
          </Text>
          {focus.length > 0 ? (
            focus.map((action) => (
              <AIPriorityCard
                key={action.id}
                action={action}
                onResolve={() => loadActions()}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Icon
                name="sparkles-outline"
                size={20}
                color={zyrixTheme.primary}
                family="Ionicons"
              />
              <Text style={styles.emptyText}>
                {loading ? t('common.loading') : t('dashboard.allClear')}
              </Text>
            </View>
          )}
        </View>

        {/* 3. AI Insight (highlighted top action) */}
        {topAction ? (
          <View style={styles.insightCard}>
            <View style={styles.insightHeader}>
              <View style={styles.insightLabelWrap}>
                <Icon
                  name="bulb-outline"
                  size={12}
                  color={zyrixTheme.primary}
                  family="Ionicons"
                />
                <Text style={styles.insightLabel}>
                  {t('dashboard.aiInsight')}
                </Text>
              </View>
            </View>
            <Text style={styles.insightTitle}>{topAction.title}</Text>
            <Text style={styles.insightReason}>{topAction.reason}</Text>
            <AITrustBadge
              confidence={topAction.confidence}
              reason={topAction.reason}
              signals={topAction.signals}
              recommendedAction={topAction.recommendedAction}
            />
          </View>
        ) : null}

        {/* 4. Smart Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('dashboard.smartStats')}</Text>
          <View style={styles.statsGrid}>
            <SmartStatCard
              metric="customers"
              value={8}
              change={t('dashboard.changeCustomers')}
              warningContext={t('dashboard.warnInactiveCustomers')}
              highlightContext={t('dashboard.hotHighValue')}
            />
            <SmartStatCard
              metric="deals"
              value={14}
              change="$42,800 pipeline"
              warningContext={t('dashboard.warnAtRiskDeals')}
              highlightContext={t('dashboard.hotLikelyClose')}
            />
            <SmartStatCard
              metric="revenue"
              value="$18,400"
              change={t('dashboard.changeRevenue')}
              highlightContext={t('dashboard.forecastRevenue')}
            />
            <SmartStatCard
              metric="tasks"
              value={6}
              change={t('dashboard.changeTasks')}
              warningContext={t('dashboard.warnOverdueTasks')}
            />
          </View>
        </View>

        {/* 5. Revenue Brain summary */}
        <RevenueBrainCard workspaceId={workspaceId} />

        {/* 6. Recent activities */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('dashboard.recentActivity')}
          </Text>
          <View style={styles.activityList}>
            {MOCK_ACTIVITIES.map((activity) => (
              <View key={activity.id} style={styles.activityRow}>
                <View style={styles.activityIcon}>
                  <Icon
                    name={activity.icon}
                    size={14}
                    color={zyrixTheme.primary}
                    family="Ionicons"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.activityTitle} numberOfLines={1}>
                    {activity.title}
                  </Text>
                  <Text style={styles.activitySubtitle} numberOfLines={1}>
                    {activity.subtitle}
                  </Text>
                </View>
                <Text style={styles.activityAt}>{activity.at}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 7. Charts (secondary, smaller — AI explained) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('dashboard.trendOverview')}
          </Text>
          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartTitle}>
                {t('dashboard.revenueTrend')}
              </Text>
              <Text style={styles.chartSubtitle}>
                {t('dashboard.last6Months')}
              </Text>
            </View>
            <View style={styles.miniChart}>
              {[12, 18, 15, 22, 19, 24].map((v, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.bar,
                    {
                      height: v * 2.4,
                      backgroundColor:
                        idx === 5 ? zyrixTheme.primary : zyrixTheme.aiBorder,
                    },
                  ]}
                />
              ))}
            </View>
            <View style={styles.chartExplain}>
              <Icon
                name="sparkles-outline"
                size={12}
                color={zyrixTheme.primary}
                family="Ionicons"
              />
              <Text style={styles.chartExplainText}>
                {t('dashboard.chartExplain')}
              </Text>
            </View>
          </View>
        </View>

        {/* breathing room for floating AI button */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: zyrixSpacing.base,
    rowGap: zyrixSpacing.lg,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: zyrixSpacing.sm,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: zyrixTheme.textHeading,
  },
  date: {
    fontSize: 13,
    color: zyrixTheme.textMuted,
    marginTop: 2,
  },
  localeBadge: {
    backgroundColor: zyrixTheme.aiSurface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: zyrixRadius.base,
    borderWidth: 1,
    borderColor: zyrixTheme.aiBorder,
  },
  localeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: zyrixTheme.primary,
    letterSpacing: 1.2,
  },
  section: { rowGap: 8 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: zyrixTheme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: zyrixTheme.textMuted,
    marginBottom: 6,
  },
  emptyState: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 8,
    backgroundColor: zyrixTheme.aiSurface,
    padding: zyrixSpacing.base,
    borderRadius: zyrixRadius.lg,
    borderWidth: 1,
    borderColor: zyrixTheme.aiBorder,
  },
  emptyText: {
    color: zyrixTheme.textBody,
    fontSize: 13,
  },
  insightCard: {
    backgroundColor: zyrixTheme.cardBg,
    borderRadius: zyrixRadius.xl,
    padding: zyrixSpacing.lg - 6,
    borderLeftWidth: 4,
    borderLeftColor: zyrixTheme.primary,
    borderWidth: 1,
    borderColor: zyrixTheme.cardBorder,
    rowGap: 8,
    ...zyrixShadows.card,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  insightLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 4,
  },
  insightLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: zyrixTheme.primary,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  insightTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: zyrixTheme.textHeading,
  },
  insightReason: {
    fontSize: 13,
    color: zyrixTheme.textBody,
    lineHeight: 19,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  activityList: {
    backgroundColor: zyrixTheme.cardBg,
    borderRadius: zyrixRadius.lg,
    borderWidth: 1,
    borderColor: zyrixTheme.cardBorder,
    overflow: 'hidden',
    ...zyrixShadows.card,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 10,
    padding: zyrixSpacing.base - 4,
    borderBottomWidth: 1,
    borderBottomColor: zyrixTheme.cardBorder,
  },
  activityIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: zyrixTheme.aiSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: zyrixTheme.textHeading,
  },
  activitySubtitle: {
    fontSize: 11,
    color: zyrixTheme.textMuted,
    marginTop: 1,
  },
  activityAt: {
    fontSize: 10,
    color: zyrixTheme.textMuted,
    fontWeight: '600',
  },
  chartCard: {
    backgroundColor: zyrixTheme.cardBg,
    borderRadius: zyrixRadius.lg,
    padding: zyrixSpacing.base - 2,
    borderWidth: 1,
    borderColor: zyrixTheme.cardBorder,
    rowGap: 10,
    ...zyrixShadows.card,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  chartTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: zyrixTheme.textHeading,
  },
  chartSubtitle: {
    fontSize: 11,
    color: zyrixTheme.textMuted,
  },
  miniChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    columnGap: 6,
    height: 70,
  },
  bar: {
    flex: 1,
    borderRadius: 3,
    minHeight: 6,
  },
  chartExplain: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: zyrixTheme.cardBorder,
  },
  chartExplainText: {
    flex: 1,
    fontSize: 11,
    color: zyrixTheme.textBody,
    lineHeight: 15,
  },
});

export default AIDashboardScreen;
