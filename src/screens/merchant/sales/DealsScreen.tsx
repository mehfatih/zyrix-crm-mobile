/**
 * DealsScreen — list of deals with filter chips by stage and a FAB
 * for creating new deals (stubbed for Sprint 5).
 */

import React, { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { DealCard } from '../../../components/feature-specific/DealCard';
import { Header } from '../../../components/common/Header';
import { Icon } from '../../../components/common/Icon';
import { SkeletonCard } from '../../../components/common/SkeletonCard';
import { darkColors } from '../../../theme/dark';
import { radius, shadows, spacing } from '../../../constants/spacing';
import { textStyles } from '../../../constants/typography';
import { useDeals } from '../../../hooks/useDeals';
import type { Deal, DealStage } from '../../../api/deals';
import type { MerchantSalesStackParamList } from '../../../navigation/types';

type Navigation = NativeStackNavigationProp<
  MerchantSalesStackParamList,
  'Deals'
>;

type SortKey = 'newest' | 'highestValue' | 'closingSoon';

const STAGE_CHIPS: readonly (DealStage | 'all')[] = [
  'all',
  'lead',
  'qualified',
  'proposal',
  'negotiation',
  'won',
  'lost',
];

export const DealsScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<Navigation>();
  const [stage, setStage] = useState<DealStage | 'all'>('all');
  const [sort, setSort] = useState<SortKey>('newest');

  const filters = useMemo(
    () => (stage === 'all' ? undefined : { stage }),
    [stage]
  );
  const query = useDeals({ filters, pageSize: 50 });
  const raw = query.data?.items ?? [];

  const sorted = useMemo(() => {
    const copy = [...raw];
    switch (sort) {
      case 'highestValue':
        return copy.sort((a, b) => b.value - a.value);
      case 'closingSoon':
        return copy.sort(
          (a, b) =>
            new Date(a.expectedCloseDate).getTime() -
            new Date(b.expectedCloseDate).getTime()
        );
      case 'newest':
      default:
        return copy.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }
  }, [raw, sort]);

  const openDetail = (deal: Deal): void => {
    navigation.navigate('DealDetail', { dealId: deal.id });
  };

  const onNewDeal = (): void => {
    Alert.alert(t('deals.newDeal'), t('placeholders.workInProgress'));
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <Header title={t('deals.title')} showBack={false} />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsScroll}
      >
        {STAGE_CHIPS.map((key) => (
          <Pressable
            key={key}
            onPress={() => setStage(key)}
            style={[
              styles.chip,
              stage === key ? styles.chipActive : null,
            ]}
          >
            <Text
              style={[
                styles.chipText,
                stage === key ? styles.chipTextActive : null,
              ]}
            >
              {key === 'all' ? t('customers.title') : t(`stages.${key}`)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.sortRow}>
        {(
          [
            { key: 'newest', label: 'dashboard.recentActivity' },
            { key: 'highestValue', label: 'customers.totalRevenue' },
            { key: 'closingSoon', label: 'deals.expectedClose' },
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
                sort === option.key ? styles.sortTextActive : null,
              ]}
            >
              {t(option.label)}
            </Text>
          </Pressable>
        ))}
      </View>

      {query.isLoading ? (
        <View style={styles.list}>
          {Array.from({ length: 5 }).map((_, idx) => (
            <SkeletonCard key={idx} height={120} />
          ))}
        </View>
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <DealCard deal={item} onPress={openDetail} />
          )}
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching}
              onRefresh={() => void query.refetch()}
              tintColor={darkColors.primary}
              colors={[darkColors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Icon name="briefcase-outline" size={48} color={darkColors.primary} />
              <Text style={styles.emptyTitle}>
                {t('deals.title')}
              </Text>
            </View>
          }
        />
      )}

      <Pressable
        onPress={onNewDeal}
        style={({ pressed }) => [
          styles.fab,
          pressed ? { opacity: 0.9 } : null,
        ]}
      >
        <Icon name="add" size={28} color={darkColors.textOnPrimary} />
      </Pressable>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: darkColors.background },
  chipsScroll: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
    columnGap: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: darkColors.surface,
    borderWidth: 1,
    borderColor: darkColors.border,
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
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
    columnGap: spacing.xs,
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
  sortTextActive: {
    color: darkColors.primaryDark,
    fontWeight: '700',
  },
  list: {
    padding: spacing.base,
    paddingBottom: spacing.xxxl * 2,
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
  fab: {
    position: 'absolute',
    insetInlineEnd: spacing.lg,
    bottom: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: darkColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
});

export default DealsScreen;
