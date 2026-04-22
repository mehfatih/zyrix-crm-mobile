/**
 * QuotesScreen — list of quotes with status badges, quick filters and
 * sort options. FAB opens `QuoteBuilder`.
 */

import React, { useMemo, useState } from 'react';
import {
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
import { useQuery } from '@tanstack/react-query';

import { CurrencyDisplay } from '../../../components/forms/CurrencyDisplay';
import { Header } from '../../../components/common/Header';
import { Icon } from '../../../components/common/Icon';
import { SkeletonCard } from '../../../components/common/SkeletonCard';
import { colors } from '../../../constants/colors';
import { listQuotes, type Quote } from '../../../api/quotes';
import { radius, shadows, spacing } from '../../../constants/spacing';
import { textStyles } from '../../../constants/typography';
import { useCountryConfig } from '../../../hooks/useCountryConfig';
import type { MerchantSalesStackParamList } from '../../../navigation/types';

type Navigation = NativeStackNavigationProp<
  MerchantSalesStackParamList,
  'Quotes'
>;

type Status = Quote['status'];
type Sort = 'newest' | 'largest' | 'closingSoon';

const STATUS_STYLE: Record<
  Status,
  { background: string; color: string }
> = {
  draft: { background: colors.surfaceAlt, color: colors.textMuted },
  sent: { background: colors.infoSoft, color: colors.info },
  viewed: { background: colors.warningSoft, color: colors.warning },
  accepted: { background: colors.successSoft, color: colors.success },
  expired: { background: colors.errorSoft, color: colors.error },
};

const STATUS_KEYS: readonly (Status | 'all')[] = [
  'all',
  'draft',
  'sent',
  'viewed',
  'accepted',
  'expired',
];

export const QuotesScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<Navigation>();
  const { formatDate } = useCountryConfig();
  const [status, setStatus] = useState<Status | 'all'>('all');
  const [sort, setSort] = useState<Sort>('newest');

  const quotesQuery = useQuery({
    queryKey: ['quotes', 'list', status],
    queryFn: () =>
      listQuotes({ filters: status === 'all' ? undefined : { status } }),
  });

  const items = useMemo(() => {
    const raw = quotesQuery.data?.items ?? [];
    const filtered = status === 'all' ? raw : raw.filter((q) => q.status === status);
    const sorted = [...filtered];
    switch (sort) {
      case 'largest':
        sorted.sort((a, b) => b.total - a.total);
        break;
      case 'closingSoon':
        sorted.sort(
          (a, b) =>
            new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime()
        );
        break;
      case 'newest':
      default:
        sorted.sort(
          (a, b) =>
            new Date(b.sentAt ?? b.expiresAt).getTime() -
            new Date(a.sentAt ?? a.expiresAt).getTime()
        );
    }
    return sorted;
  }, [quotesQuery.data, status, sort]);

  const open = (quote: Quote): void => {
    navigation.navigate('QuoteDetail', { quoteId: quote.id });
  };

  const onNew = (): void => {
    navigation.navigate('QuoteBuilder', undefined);
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <Header title={t('navigation.quotes')} showBack={false} />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
      >
        {STATUS_KEYS.map((key) => (
          <Pressable
            key={key}
            onPress={() => setStatus(key)}
            style={[
              styles.chip,
              status === key ? styles.chipActive : null,
            ]}
          >
            <Text
              style={[
                styles.chipText,
                status === key ? styles.chipTextActive : null,
              ]}
            >
              {key === 'all' ? t('customers.title') : t(`quoteStatus.${key}`)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.sortRow}>
        {(['newest', 'largest', 'closingSoon'] as Sort[]).map((key) => (
          <Pressable
            key={key}
            onPress={() => setSort(key)}
            style={[
              styles.sortChip,
              sort === key ? styles.sortChipActive : null,
            ]}
          >
            <Text
              style={[
                styles.sortText,
                sort === key ? styles.sortTextActive : null,
              ]}
            >
              {t(`quoteSort.${key}`)}
            </Text>
          </Pressable>
        ))}
      </View>

      {quotesQuery.isLoading ? (
        <View style={styles.list}>
          {Array.from({ length: 4 }).map((_, idx) => (
            <SkeletonCard key={idx} height={96} />
          ))}
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(q) => q.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const tone = STATUS_STYLE[item.status];
            return (
              <Pressable
                onPress={() => open(item)}
                style={({ pressed }) => [
                  styles.card,
                  pressed ? { opacity: 0.85 } : null,
                ]}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.quoteNumber}>{item.quoteNumber}</Text>
                  <View
                    style={[styles.statusBadge, { backgroundColor: tone.background }]}
                  >
                    <Text style={[styles.statusText, { color: tone.color }]}>
                      {t(`quoteStatus.${item.status}`)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.customerName} numberOfLines={1}>
                  {item.customerName}
                </Text>
                <View style={styles.metaRow}>
                  <CurrencyDisplay amount={item.total} size="medium" />
                  <Text style={styles.date}>{formatDate(item.expiresAt)}</Text>
                </View>
              </Pressable>
            );
          }}
          refreshControl={
            <RefreshControl
              refreshing={quotesQuery.isRefetching}
              onRefresh={() => void quotesQuery.refetch()}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Icon name="document-text-outline" size={48} color={colors.primary} />
              <Text style={styles.emptyTitle}>{t('navigation.quotes')}</Text>
            </View>
          }
        />
      )}

      <Pressable
        onPress={onNew}
        style={({ pressed }) => [
          styles.fab,
          pressed ? { opacity: 0.9 } : null,
        ]}
      >
        <Icon name="add" size={28} color={colors.textInverse} />
      </Pressable>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  filters: {
    columnGap: spacing.xs,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    ...textStyles.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  chipTextActive: { color: colors.textInverse },
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
    backgroundColor: colors.surface,
  },
  sortChipActive: { backgroundColor: colors.primarySoft },
  sortText: {
    ...textStyles.caption,
    color: colors.textMuted,
  },
  sortTextActive: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  list: {
    padding: spacing.base,
    paddingBottom: spacing.xxxl * 2,
    rowGap: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.base,
    borderRadius: radius.lg,
    rowGap: spacing.xs,
    ...shadows.xs,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quoteNumber: {
    ...textStyles.bodyMedium,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  statusText: {
    ...textStyles.caption,
    fontWeight: '700',
  },
  customerName: {
    ...textStyles.caption,
    color: colors.textSecondary,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  date: {
    ...textStyles.caption,
    color: colors.textMuted,
  },
  empty: {
    alignItems: 'center',
    paddingTop: spacing.xxxl,
    rowGap: spacing.sm,
  },
  emptyTitle: {
    ...textStyles.h4,
    color: colors.textPrimary,
  },
  fab: {
    position: 'absolute',
    insetInlineEnd: spacing.lg,
    bottom: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
});

export default QuotesScreen;
