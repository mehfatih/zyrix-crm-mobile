/**
 * LeadScoringScreen — AI-scored lead list with filter tabs for Hot /
 * Warm / Cold segments and a Refresh button that re-runs scoring.
 */

import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Header } from '../../../components/common/Header';
import { Icon } from '../../../components/common/Icon';
import { LeadScoreCard } from '../../../components/feature-specific/LeadScoreCard';
import { SkeletonCard } from '../../../components/common/SkeletonCard';
import { darkColors } from '../../../theme/dark';
import { hitSlop, radius, spacing } from '../../../constants/spacing';
import { textStyles } from '../../../constants/typography';
import { useAIScoreLeads } from '../../../hooks/useAI';
import type { LeadScore } from '../../../types/ai';
import type { MerchantAIStackParamList } from '../../../navigation/types';

type Bucket = 'all' | 'hot' | 'warm' | 'cold';
type Sort = 'score' | 'name' | 'recent';

type Navigation = NativeStackNavigationProp<
  MerchantAIStackParamList,
  'LeadScoring'
>;

const bucket = (score: number): 'hot' | 'warm' | 'cold' => {
  if (score >= 70) return 'hot';
  if (score >= 40) return 'warm';
  return 'cold';
};

export const LeadScoringScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<Navigation>();
  const leadsQuery = useAIScoreLeads();
  const [filter, setFilter] = useState<Bucket>('all');
  const [sort, setSort] = useState<Sort>('score');

  const items = useMemo(() => {
    const raw = leadsQuery.data?.items ?? [];
    const filtered =
      filter === 'all'
        ? raw
        : raw.filter((lead) => bucket(lead.score) === filter);
    const sorted = [...filtered];
    switch (sort) {
      case 'name':
        sorted.sort((a, b) => a.leadName.localeCompare(b.leadName));
        break;
      case 'recent':
        sorted.sort(
          (a, b) =>
            new Date(b.lastActivity ?? 0).getTime() -
            new Date(a.lastActivity ?? 0).getTime()
        );
        break;
      case 'score':
      default:
        sorted.sort((a, b) => b.score - a.score);
    }
    return sorted;
  }, [leadsQuery.data, filter, sort]);

  const openDetail = (lead: LeadScore): void => {
    navigation.navigate('LeadScoreDetail', { leadId: lead.leadId });
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <Header
        title={t('ai.leadScoring')}
        showBack={false}
        rightSlot={
          <Pressable
            onPress={() => void leadsQuery.refetch()}
            hitSlop={hitSlop.md}
            style={styles.refreshBtn}
            accessibilityLabel={t('leadScoring.rescoreAll')}
          >
            <Icon name="refresh" size={22} color={darkColors.textOnPrimary} />
          </Pressable>
        }
      />

      <View style={styles.filterRow}>
        {(
          [
            { key: 'all', label: 'customers.title' },
            { key: 'hot', label: 'leadScoring.hot' },
            { key: 'warm', label: 'leadScoring.warm' },
            { key: 'cold', label: 'leadScoring.cold' },
          ] as const
        ).map((chip) => (
          <Pressable
            key={chip.key}
            onPress={() => setFilter(chip.key)}
            style={[
              styles.chip,
              filter === chip.key ? styles.chipActive : null,
            ]}
          >
            <Text
              style={[
                styles.chipText,
                filter === chip.key ? styles.chipTextActive : null,
              ]}
            >
              {t(chip.label)}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.sortRow}>
        {(
          [
            { key: 'score', label: 'leadScoring.score' },
            { key: 'name', label: 'forms.fullName' },
            { key: 'recent', label: 'dashboard.recentActivity' },
          ] as const
        ).map((option) => (
          <Pressable
            key={option.key}
            onPress={() => setSort(option.key)}
            style={[
              styles.sortChip,
              sort === option.key ? styles.sortChipActive : null,
            ]}
          >
            <Text
              style={[
                styles.sortText,
                sort === option.key
                  ? { color: darkColors.primaryDark, fontWeight: '700' }
                  : null,
              ]}
            >
              {t(option.label)}
            </Text>
          </Pressable>
        ))}
      </View>

      {leadsQuery.isLoading ? (
        <View style={styles.list}>
          {Array.from({ length: 4 }).map((_, idx) => (
            <SkeletonCard key={idx} height={120} />
          ))}
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(lead) => lead.leadId}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <LeadScoreCard lead={item} onPress={openDetail} />
          )}
          refreshControl={
            <RefreshControl
              refreshing={leadsQuery.isRefetching}
              onRefresh={() => void leadsQuery.refetch()}
              tintColor={darkColors.primary}
              colors={[darkColors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Icon
                name="sparkles-outline"
                size={48}
                color={darkColors.primary}
              />
              <Text style={styles.emptyTitle}>
                {t('leadScoring.rescoreAll')}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: darkColors.background },
  refreshBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: darkColors.border,
    backgroundColor: darkColors.surface,
  },
  chipActive: {
    backgroundColor: darkColors.primary,
    borderColor: darkColors.primary,
  },
  chipText: {
    ...textStyles.caption,
    color: darkColors.textSecondary,
    fontWeight: '600',
  },
  chipTextActive: { color: darkColors.textOnPrimary },
  sortRow: {
    flexDirection: 'row',
    columnGap: spacing.xs,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
  },
  sortChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    backgroundColor: darkColors.surface,
  },
  sortChipActive: {
    backgroundColor: darkColors.primarySoft,
  },
  sortText: {
    ...textStyles.caption,
    color: darkColors.textMuted,
  },
  list: {
    padding: spacing.base,
    paddingBottom: spacing.xxxl,
  },
  empty: {
    alignItems: 'center',
    paddingTop: spacing.xxxl,
    rowGap: spacing.sm,
  },
  emptyTitle: {
    ...textStyles.h4,
    color: darkColors.textPrimary,
  },
});

export default LeadScoringScreen;
