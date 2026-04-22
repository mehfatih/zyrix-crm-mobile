/**
 * PipelineScreen — Kanban view of the deal pipeline. Horizontal scroll
 * of stage columns; each deal card has a long-press menu to move the
 * deal into a different column (simpler than full drag-drop, which
 * lands in Sprint 5 alongside reanimated gestures).
 */

import React, { useMemo } from 'react';
import {
  ActionSheetIOS,
  Alert,
  Platform,
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

import { CurrencyDisplay } from '../../../components/forms/CurrencyDisplay';
import { DEAL_PIPELINE, groupDealsByStage } from '../../../api/deals';
import { DEALS_BY_STAGE_COLORS } from '../../../api/mockData';
import { DealCard } from '../../../components/feature-specific/DealCard';
import { Header } from '../../../components/common/Header';
import { Icon } from '../../../components/common/Icon';
import { colors } from '../../../constants/colors';
import { radius, shadows, spacing } from '../../../constants/spacing';
import { textStyles } from '../../../constants/typography';
import { useDeals, useMoveDealStage } from '../../../hooks/useDeals';
import type { Deal, DealStage } from '../../../api/deals';
import type { MerchantSalesStackParamList } from '../../../navigation/types';

type Navigation = NativeStackNavigationProp<
  MerchantSalesStackParamList,
  'Pipeline'
>;

const COLUMN_WIDTH = 280;

export const PipelineScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<Navigation>();
  const dealsQuery = useDeals({ pageSize: 100 });
  const moveStage = useMoveDealStage();

  const grouped = useMemo(
    () => groupDealsByStage(dealsQuery.data?.items ?? []),
    [dealsQuery.data]
  );

  const onLongPress = (deal: Deal): void => {
    const stages = DEAL_PIPELINE;
    const labels = stages.map((s) => t(`stages.${s}`));
    const pickStage = (index: number): void => {
      const newStage = stages[index];
      if (newStage && newStage !== deal.stage) {
        moveStage.mutate({ id: deal.id, stage: newStage });
      }
    };
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: t('deals.moveToNextStage'),
          options: [...labels, t('common.cancel')],
          cancelButtonIndex: labels.length,
        },
        (chosen) => {
          if (chosen !== labels.length) pickStage(chosen);
        }
      );
    } else {
      Alert.alert(
        t('deals.moveToNextStage'),
        undefined,
        labels
          .map((label, idx) => ({
            text: label,
            onPress: () => pickStage(idx),
          }))
          .concat({ text: t('common.cancel'), onPress: () => undefined })
      );
    }
  };

  const openDetail = (deal: Deal): void => {
    navigation.navigate('DealDetail', { dealId: deal.id });
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <Header
        title={t('deals.pipeline')}
        rightSlot={
          <Pressable
            onPress={() => void dealsQuery.refetch()}
            style={styles.iconBtn}
          >
            <Icon name="refresh" size={22} color={colors.textInverse} />
          </Pressable>
        }
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.board}
        refreshControl={
          <RefreshControl
            refreshing={dealsQuery.isRefetching}
            onRefresh={() => void dealsQuery.refetch()}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {DEAL_PIPELINE.map((stage) => {
          const list = grouped[stage] ?? [];
          const total = list.reduce((sum, d) => sum + d.value, 0);
          return (
            <View key={stage} style={styles.column}>
              <View style={styles.columnHeader}>
                <View style={styles.columnTitleRow}>
                  <View
                    style={[
                      styles.colorDot,
                      { backgroundColor: DEALS_BY_STAGE_COLORS[stage] },
                    ]}
                  />
                  <Text style={styles.columnTitle}>
                    {t(`stages.${stage}`)}
                  </Text>
                </View>
                <View style={styles.columnMetaRow}>
                  <Text style={styles.count}>{`${list.length} deals`}</Text>
                  <CurrencyDisplay amount={total} size="small" />
                </View>
              </View>

              <ScrollView
                style={styles.columnScroll}
                contentContainerStyle={styles.columnContent}
                showsVerticalScrollIndicator={false}
              >
                {list.length === 0 ? (
                  <Text style={styles.emptyText}>—</Text>
                ) : (
                  list.map((deal) => (
                    <Pressable
                      key={deal.id}
                      onLongPress={() => onLongPress(deal)}
                      delayLongPress={350}
                    >
                      <DealCard
                        deal={deal}
                        onPress={openDetail}
                        compact
                      />
                    </Pressable>
                  ))
                )}
              </ScrollView>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  board: {
    padding: spacing.base,
    columnGap: spacing.base,
  },
  column: {
    width: COLUMN_WIDTH,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.sm,
    ...shadows.xs,
  },
  columnHeader: {
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    rowGap: 2,
  },
  columnTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.xs,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  columnTitle: {
    ...textStyles.h4,
    color: colors.textPrimary,
  },
  columnMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  count: {
    ...textStyles.caption,
    color: colors.textMuted,
  },
  columnScroll: {
    marginTop: spacing.sm,
    maxHeight: 600,
  },
  columnContent: {
    paddingBottom: spacing.sm,
  },
  emptyText: {
    ...textStyles.caption,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
});

export default PipelineScreen;
