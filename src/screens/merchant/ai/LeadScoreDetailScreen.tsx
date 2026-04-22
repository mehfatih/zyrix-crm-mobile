/**
 * LeadScoreDetailScreen — full breakdown for a single lead: score
 * ring, all contributing factors, AI recommendation block, and quick
 * action buttons (call, email, schedule, qualify).
 */

import React, { useMemo } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';

import { Header } from '../../../components/common/Header';
import { Icon, type AnyIconName } from '../../../components/common/Icon';
import { colors } from '../../../constants/colors';
import { radius, shadows, spacing } from '../../../constants/spacing';
import { textStyles } from '../../../constants/typography';
import { useAIScoreLeads } from '../../../hooks/useAI';
import type { MerchantAIStackParamList } from '../../../navigation/types';

type Route = RouteProp<MerchantAIStackParamList, 'LeadScoreDetail'>;

const toneFor = (score: number): string => {
  if (score >= 70) return colors.success;
  if (score >= 40) return colors.warning;
  return colors.error;
};

const QUICK_ACTIONS: readonly { key: string; icon: AnyIconName; tone: string }[] = [
  { key: 'call', icon: 'call-outline', tone: colors.success },
  { key: 'email', icon: 'mail-outline', tone: colors.info },
  { key: 'schedule', icon: 'calendar-outline', tone: colors.primary },
  { key: 'qualify', icon: 'checkmark-done-outline', tone: colors.primaryDark },
];

export const LeadScoreDetailScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute<Route>();
  const leadId = route.params.leadId;
  const leadsQuery = useAIScoreLeads();

  const lead = useMemo(
    () => leadsQuery.data?.items.find((item) => item.leadId === leadId),
    [leadsQuery.data, leadId]
  );

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <Header
        title={lead?.leadName ?? t('ai.leadScoring')}
        onBack={() => navigation.goBack()}
      />
      {lead ? (
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.heroCard}>
            <View style={styles.heroHeader}>
              <Text style={styles.hero}>{lead.leadName}</Text>
              <Text style={styles.company}>{lead.company}</Text>
            </View>
            <View
              style={[
                styles.scoreRing,
                { borderColor: toneFor(lead.score) },
              ]}
            >
              <Text
                style={[styles.scoreValue, { color: toneFor(lead.score) }]}
              >
                {lead.score}
              </Text>
              <Text style={styles.scoreLabel}>
                {t('leadScoring.score').toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              {t('leadScoring.factors')}
            </Text>
            {lead.factors.map((factor, idx) => (
              <View key={idx} style={styles.factorRow}>
                <Icon
                  name={
                    factor.kind === 'positive' ? 'arrow-up' : 'arrow-down'
                  }
                  size={14}
                  color={
                    factor.kind === 'positive'
                      ? colors.success
                      : colors.error
                  }
                />
                <Text style={styles.factorLabel}>{factor.label}</Text>
                <Text
                  style={[
                    styles.factorDelta,
                    {
                      color:
                        factor.kind === 'positive'
                          ? colors.success
                          : colors.error,
                    },
                  ]}
                >
                  {`${factor.delta > 0 ? '+' : ''}${factor.delta}`}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.recommendationCard}>
            <Icon
              name="sparkles-outline"
              size={20}
              color={colors.primary}
            />
            <Text style={styles.recommendationTitle}>
              {t('leadScoring.suggestedAction')}
            </Text>
            <Text style={styles.recommendationBody}>
              {lead.suggestedAction}
            </Text>
          </View>

          <View style={styles.quickRow}>
            {QUICK_ACTIONS.map((action) => (
              <Pressable
                key={action.key}
                onPress={() => Alert.alert(t(`leadScoring.${action.key}`, action.key))}
                style={({ pressed }) => [
                  styles.quickBtn,
                  pressed ? { opacity: 0.85 } : null,
                ]}
              >
                <View
                  style={[
                    styles.quickIcon,
                    { backgroundColor: `${action.tone}20` },
                  ]}
                >
                  <Icon name={action.icon} size={22} color={action.tone} />
                </View>
                <Text style={styles.quickLabel}>
                  {t(`leadScoring.${action.key}`, action.key)}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      ) : (
        <View style={styles.loading}>
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: {
    padding: spacing.base,
    paddingBottom: spacing.xxl,
    rowGap: spacing.base,
  },
  heroCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.base,
    ...shadows.sm,
  },
  heroHeader: { flex: 1, rowGap: 4 },
  hero: {
    ...textStyles.h2,
    color: colors.textPrimary,
  },
  company: {
    ...textStyles.body,
    color: colors.textMuted,
  },
  scoreRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreValue: {
    ...textStyles.display,
    fontWeight: '800',
  },
  scoreLabel: {
    ...textStyles.caption,
    color: colors.textMuted,
    letterSpacing: 1,
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.base,
    borderRadius: radius.lg,
    rowGap: spacing.sm,
    ...shadows.xs,
  },
  sectionTitle: {
    ...textStyles.h4,
    color: colors.textPrimary,
  },
  factorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.sm,
  },
  factorLabel: {
    flex: 1,
    ...textStyles.body,
    color: colors.textPrimary,
  },
  factorDelta: {
    ...textStyles.label,
    fontWeight: '800',
  },
  recommendationCard: {
    backgroundColor: colors.primarySoft,
    padding: spacing.base,
    borderRadius: radius.lg,
    rowGap: spacing.xs,
  },
  recommendationTitle: {
    ...textStyles.label,
    color: colors.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  recommendationBody: {
    ...textStyles.body,
    color: colors.primaryDark,
  },
  quickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  quickBtn: {
    flex: 1,
    alignItems: 'center',
    rowGap: spacing.xs,
    padding: spacing.base,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    minWidth: 140,
    ...shadows.xs,
  },
  quickIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: {
    ...textStyles.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...textStyles.body,
    color: colors.textMuted,
  },
});

export default LeadScoreDetailScreen;
