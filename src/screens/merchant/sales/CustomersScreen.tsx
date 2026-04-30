/**
 * CustomersScreen — searchable, filterable list of customers.
 *
 * Sprint 4 ships the core interactions — search bar (collapsible),
 * sort chips, pull-to-refresh, FAB to create a new customer, and
 * `onPress` navigation into `CustomerDetail`. The filters sheet and
 * swipe-row actions are stubbed as Alerts for now so the navigation
 * surface is complete without over-engineering.
 */

import React, { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  I18nManager,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { CustomerCard } from '../../../components/feature-specific/CustomerCard';
import { Header } from '../../../components/common/Header';
import { Icon } from '../../../components/common/Icon';
import { SkeletonCard } from '../../../components/common/SkeletonCard';
import { darkColors } from '../../../theme/dark';
import { hitSlop, radius, shadows, spacing } from '../../../constants/spacing';
import { textStyles } from '../../../constants/typography';
import { useCustomers } from '../../../hooks/useCustomers';
import type { Customer } from '../../../api/customers';
import type { MerchantSalesStackParamList } from '../../../navigation/types';

type SortKey = 'name' | 'revenueDesc' | 'revenueAsc' | 'lastContact';
type Navigation = NativeStackNavigationProp<
  MerchantSalesStackParamList,
  'Customers'
>;

export const CustomersScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<Navigation>();

  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('name');

  const customersQuery = useCustomers({ search: query, pageSize: 50 });
  const rawItems = customersQuery.data?.items ?? [];

  const sorted = useMemo(() => {
    const copy = [...rawItems];
    switch (sortKey) {
      case 'revenueDesc':
        return copy.sort((a, b) => b.totalRevenue - a.totalRevenue);
      case 'revenueAsc':
        return copy.sort((a, b) => a.totalRevenue - b.totalRevenue);
      case 'lastContact':
        return copy.sort(
          (a, b) =>
            new Date(b.lastContactAt).getTime() -
            new Date(a.lastContactAt).getTime()
        );
      case 'name':
      default:
        return copy.sort((a, b) => a.name.localeCompare(b.name));
    }
  }, [rawItems, sortKey]);

  const openDetail = (customer: Customer): void => {
    navigation.navigate('CustomerDetail', { customerId: customer.id });
  };

  const openFilters = (): void => {
    Alert.alert(t('common.cancel'), t('placeholders.workInProgress'));
  };

  const onAddCustomer = (): void => {
    Alert.alert(t('customers.addFirstCustomer'), t('placeholders.workInProgress'));
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <Header
        title={t('customers.title')}
        showBack={false}
        rightSlot={
          <View style={styles.actionsRow}>
            <Pressable
              onPress={() => setSearchOpen((s) => !s)}
              hitSlop={hitSlop.md}
              style={styles.iconBtn}
              accessibilityLabel={t('customers.searchCustomers')}
            >
              <Icon name="search-outline" size={22} color={darkColors.textOnPrimary} />
            </Pressable>
            <Pressable
              onPress={openFilters}
              hitSlop={hitSlop.md}
              style={styles.iconBtn}
              accessibilityLabel={t('common.edit')}
            >
              <Icon name="funnel-outline" size={22} color={darkColors.textOnPrimary} />
            </Pressable>
          </View>
        }
      />

      {searchOpen ? (
        <View style={styles.searchRow}>
          <Icon name="search-outline" size={18} color={darkColors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('customers.searchCustomers')}
            placeholderTextColor={darkColors.textMuted}
            autoFocus
            style={[
              styles.searchInput,
              { textAlign: I18nManager.isRTL ? 'right' : 'left' },
            ]}
          />
          {query ? (
            <Pressable
              onPress={() => setQuery('')}
              hitSlop={hitSlop.sm}
            >
              <Icon name="close-circle" size={18} color={darkColors.textMuted} />
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <View style={styles.chipsRow}>
        {(
          [
            { key: 'name', label: 'common.save' },
            { key: 'revenueDesc', label: 'customers.totalRevenue' },
            { key: 'lastContact', label: 'dashboard.recentActivity' },
          ] as const
        ).map((chip) => (
          <Pressable
            key={chip.key}
            onPress={() => setSortKey(chip.key)}
            style={[
              styles.chip,
              sortKey === chip.key ? styles.chipActive : null,
            ]}
          >
            <Text
              style={[
                styles.chipText,
                sortKey === chip.key ? styles.chipTextActive : null,
              ]}
            >
              {chip.key === 'name' ? 'A–Z' : t(chip.label)}
            </Text>
          </Pressable>
        ))}
      </View>

      {customersQuery.isLoading ? (
        <View style={styles.list}>
          {Array.from({ length: 6 }).map((_, idx) => (
            <SkeletonCard key={idx} />
          ))}
        </View>
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <CustomerCard customer={item} onPress={openDetail} />
          )}
          refreshControl={
            <RefreshControl
              refreshing={customersQuery.isRefetching}
              onRefresh={() => void customersQuery.refetch()}
              tintColor={darkColors.primary}
              colors={[darkColors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Icon name="people-outline" size={48} color={darkColors.primary} />
              <Text style={styles.emptyTitle}>{t('customers.noCustomers')}</Text>
              <Text style={styles.emptyBody}>
                {t('customers.addFirstCustomer')}
              </Text>
            </View>
          }
        />
      )}

      <Pressable
        onPress={onAddCustomer}
        style={({ pressed }) => [
          styles.fab,
          pressed ? { opacity: 0.9 } : null,
        ]}
        accessibilityRole="button"
        accessibilityLabel={t('customers.addFirstCustomer')}
      >
        <Icon name="add" size={28} color={darkColors.textOnPrimary} />
      </Pressable>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: darkColors.background },
  actionsRow: { flexDirection: 'row', columnGap: spacing.xs },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.sm,
    margin: spacing.base,
    backgroundColor: darkColors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    ...shadows.xs,
  },
  searchInput: {
    flex: 1,
    ...textStyles.body,
    color: darkColors.textPrimary,
    paddingVertical: spacing.sm,
  },
  chipsRow: {
    flexDirection: 'row',
    columnGap: spacing.xs,
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
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
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.xxxl * 2,
  },
  empty: {
    alignItems: 'center',
    paddingTop: spacing.xxxl,
    rowGap: spacing.xs,
  },
  emptyTitle: {
    ...textStyles.h4,
    color: darkColors.textPrimary,
    marginTop: spacing.sm,
  },
  emptyBody: {
    ...textStyles.body,
    color: darkColors.textMuted,
    textAlign: 'center',
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

export default CustomersScreen;
