/**
 * LoyaltyScreen — program overview + tabs (Members / Tiers / Rewards /
 * Activity). Mock data only for now; the "tiers" tab shows the four
 * standard tiers with thresholds and example perks.
 */

import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Header } from '../../../components/common/Header';
import { Icon } from '../../../components/common/Icon';
import { MOCK_LOYALTY_MEMBERS } from '../../../api/mockData';
import { colors } from '../../../constants/colors';
import { radius, shadows, spacing } from '../../../constants/spacing';
import { textStyles } from '../../../constants/typography';

type Tab = 'members' | 'tiers' | 'rewards' | 'activity';

const TIER_META: Record<
  'bronze' | 'silver' | 'gold' | 'platinum',
  { threshold: number; color: string }
> = {
  bronze: { threshold: 0, color: '#B45309' },
  silver: { threshold: 5000, color: '#64748B' },
  gold: { threshold: 15000, color: '#D4A017' },
  platinum: { threshold: 40000, color: '#0891B2' },
};

export const LoyaltyScreen: React.FC = () => {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>('members');

  const totalMembers = MOCK_LOYALTY_MEMBERS.length;
  const pointsIssued = MOCK_LOYALTY_MEMBERS.reduce(
    (sum, m) => sum + m.points,
    0
  );

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <Header title={t('growth.loyalty')} showBack={false} />

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.overviewCard}>
          <View style={styles.overviewCol}>
            <Text style={styles.overviewLabel}>{t('growth.totalMembers')}</Text>
            <Text style={styles.overviewValue}>{totalMembers}</Text>
          </View>
          <View style={styles.overviewCol}>
            <Text style={styles.overviewLabel}>{t('growth.pointsIssued')}</Text>
            <Text style={styles.overviewValue}>
              {pointsIssued.toLocaleString('en-US')}
            </Text>
          </View>
          <View style={styles.overviewCol}>
            <Text style={styles.overviewLabel}>{t('growth.redemptions')}</Text>
            <Text style={styles.overviewValue}>24</Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabs}
        >
          {(['members', 'tiers', 'rewards', 'activity'] as Tab[]).map((key) => (
            <Pressable
              key={key}
              onPress={() => setTab(key)}
              style={[
                styles.tabChip,
                tab === key ? styles.tabChipActive : null,
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  tab === key ? styles.tabTextActive : null,
                ]}
              >
                {t(`growth.${key}`)}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {tab === 'members' ? (
          <View style={styles.card}>
            {MOCK_LOYALTY_MEMBERS.map((m) => (
              <View key={m.id} style={styles.memberRow}>
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberInitials}>
                    {m.name.slice(0, 2).toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.memberName}>{m.name}</Text>
                <View
                  style={[
                    styles.tierBadge,
                    { backgroundColor: `${TIER_META[m.tier].color}22` },
                  ]}
                >
                  <Text
                    style={[
                      styles.tierText,
                      { color: TIER_META[m.tier].color },
                    ]}
                  >
                    {t(`loyalty.${m.tier}`)}
                  </Text>
                </View>
                <Text style={styles.memberPoints}>
                  {`${m.points.toLocaleString('en-US')} ${t('loyalty.points')}`}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {tab === 'tiers' ? (
          <View style={styles.card}>
            {(['bronze', 'silver', 'gold', 'platinum'] as const).map((tier) => (
              <View key={tier} style={styles.tierRow}>
                <View
                  style={[
                    styles.tierDot,
                    { backgroundColor: TIER_META[tier].color },
                  ]}
                />
                <View style={styles.tierBody}>
                  <Text style={styles.tierTitle}>{t(`loyalty.${tier}`)}</Text>
                  <Text style={styles.tierMeta}>
                    {`≥ ${TIER_META[tier].threshold.toLocaleString('en-US')} ${t('loyalty.points')}`}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {tab === 'rewards' ? (
          <View style={styles.emptyCard}>
            <Icon name="gift-outline" size={36} color={colors.primary} />
            <Text style={styles.emptyTitle}>{t('growth.rewards')}</Text>
            <Text style={styles.emptyBody}>
              {t('placeholders.comingInSprint', { sprint: 5 })}
            </Text>
          </View>
        ) : null}

        {tab === 'activity' ? (
          <View style={styles.emptyCard}>
            <Icon name="time-outline" size={36} color={colors.primary} />
            <Text style={styles.emptyTitle}>{t('growth.activity')}</Text>
            <Text style={styles.emptyBody}>
              {t('placeholders.comingInSprint', { sprint: 5 })}
            </Text>
          </View>
        ) : null}
      </ScrollView>
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
  overviewCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.base,
    ...shadows.sm,
  },
  overviewCol: {
    flex: 1,
    alignItems: 'center',
    rowGap: 2,
  },
  overviewLabel: {
    ...textStyles.caption,
    color: colors.textMuted,
  },
  overviewValue: {
    ...textStyles.h3,
    color: colors.primaryDark,
  },
  tabs: {
    columnGap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  tabChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabText: {
    ...textStyles.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  tabTextActive: { color: colors.textInverse },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.base,
    rowGap: spacing.sm,
    ...shadows.xs,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberInitials: {
    ...textStyles.caption,
    color: colors.primaryDark,
    fontWeight: '700',
  },
  memberName: {
    flex: 1,
    ...textStyles.bodyMedium,
    color: colors.textPrimary,
  },
  tierBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  tierText: {
    ...textStyles.caption,
    fontWeight: '700',
  },
  memberPoints: {
    ...textStyles.caption,
    color: colors.textMuted,
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  tierDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  tierBody: { flex: 1 },
  tierTitle: {
    ...textStyles.bodyMedium,
    color: colors.textPrimary,
  },
  tierMeta: {
    ...textStyles.caption,
    color: colors.textMuted,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    rowGap: spacing.xs,
    ...shadows.xs,
  },
  emptyTitle: {
    ...textStyles.h4,
    color: colors.textPrimary,
  },
  emptyBody: {
    ...textStyles.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },
});

export default LoyaltyScreen;
