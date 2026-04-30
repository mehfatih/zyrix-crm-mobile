/**
 * ContractsScreen — list of contracts with status badges, filter chips
 * and a FAB for creating a new contract.
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
import { darkColors } from '../../../theme/dark';
import { listContracts, type Contract } from '../../../api/contracts';
import { radius, shadows, spacing } from '../../../constants/spacing';
import { textStyles } from '../../../constants/typography';
import { useCountryConfig } from '../../../hooks/useCountryConfig';
import type { MerchantSalesStackParamList } from '../../../navigation/types';

type Navigation = NativeStackNavigationProp<
  MerchantSalesStackParamList,
  'Contracts'
>;

type Bucket = 'all' | 'active' | 'expiring' | 'expired' | 'terminated';

const STATUS_COLOR: Record<Contract['status'] | 'expiring', { bg: string; fg: string }> = {
  draft: { bg: darkColors.surfaceAlt, fg: darkColors.textMuted },
  active: { bg: darkColors.successSoft, fg: darkColors.success },
  expired: { bg: darkColors.errorSoft, fg: darkColors.error },
  terminated: { bg: darkColors.surfaceAlt, fg: darkColors.textMuted },
  expiring: { bg: darkColors.warningSoft, fg: darkColors.warning },
};

const daysUntil = (iso: string): number => {
  const diff = new Date(iso).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export const ContractsScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<Navigation>();
  const { formatDate } = useCountryConfig();
  const [bucket, setBucket] = useState<Bucket>('all');

  const contractsQuery = useQuery({
    queryKey: ['contracts', 'list'],
    queryFn: () => listContracts({ pageSize: 100 }),
  });

  const items = useMemo(() => {
    const raw = contractsQuery.data?.items ?? [];
    if (bucket === 'all') return raw;
    return raw.filter((c) => {
      if (bucket === 'expiring') {
        return c.status === 'active' && daysUntil(c.endDate) <= 30;
      }
      if (bucket === 'active') {
        return c.status === 'active' && daysUntil(c.endDate) > 30;
      }
      return c.status === bucket;
    });
  }, [contractsQuery.data, bucket]);

  const onNew = (): void => {
    navigation.navigate('ContractBuilder', undefined);
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <Header title={t('navigation.contracts')} showBack={false} />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
      >
        {(['all', 'active', 'expiring', 'expired', 'terminated'] as Bucket[]).map(
          (key) => (
            <Pressable
              key={key}
              onPress={() => setBucket(key)}
              style={[
                styles.chip,
                bucket === key ? styles.chipActive : null,
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  bucket === key ? styles.chipTextActive : null,
                ]}
              >
                {t(`contractBuckets.${key}`)}
              </Text>
            </Pressable>
          )
        )}
      </ScrollView>

      {contractsQuery.isLoading ? (
        <View style={styles.list}>
          {Array.from({ length: 4 }).map((_, idx) => (
            <SkeletonCard key={idx} height={110} />
          ))}
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(c) => c.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={contractsQuery.isRefetching}
              onRefresh={() => void contractsQuery.refetch()}
              tintColor={darkColors.primary}
              colors={[darkColors.primary]}
            />
          }
          renderItem={({ item }) => {
            const days = daysUntil(item.endDate);
            const isExpiring = item.status === 'active' && days <= 30 && days >= 0;
            const key = isExpiring ? 'expiring' : item.status;
            const tone = STATUS_COLOR[key];
            return (
              <Pressable
                onPress={() =>
                  navigation.navigate('ContractDetail', { contractId: item.id })
                }
                style={({ pressed }) => [
                  styles.card,
                  pressed ? { opacity: 0.85 } : null,
                ]}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.number}>{item.contractNumber}</Text>
                  <View style={[styles.status, { backgroundColor: tone.bg }]}>
                    <Text style={[styles.statusText, { color: tone.fg }]}>
                      {isExpiring
                        ? `${days}d`
                        : t(`contractStatus.${item.status}`)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.customer} numberOfLines={1}>
                  {item.customerName}
                </Text>
                <View style={styles.metaRow}>
                  <CurrencyDisplay amount={item.amount} size="medium" />
                  <Text style={styles.date}>
                    {`${formatDate(item.startDate)} → ${formatDate(item.endDate)}`}
                  </Text>
                </View>
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Icon
                name="document-text-outline"
                size={48}
                color={darkColors.primary}
              />
              <Text style={styles.emptyTitle}>{t('navigation.contracts')}</Text>
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
        <Icon name="add" size={28} color={darkColors.textOnPrimary} />
      </Pressable>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: darkColors.background },
  filters: {
    columnGap: spacing.xs,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
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
  list: {
    padding: spacing.base,
    paddingBottom: spacing.xxxl * 2,
    rowGap: spacing.sm,
  },
  card: {
    backgroundColor: darkColors.surface,
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
  number: {
    ...textStyles.bodyMedium,
    color: darkColors.textPrimary,
    fontWeight: '700',
  },
  status: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  statusText: {
    ...textStyles.caption,
    fontWeight: '700',
  },
  customer: { ...textStyles.caption, color: darkColors.textSecondary },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  date: {
    ...textStyles.caption,
    color: darkColors.textMuted,
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

export default ContractsScreen;
