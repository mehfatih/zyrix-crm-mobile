/**
 * CompaniesListScreen — search + filter + sort over all companies.
 */

import React, { useMemo, useState } from 'react';
import {
  FlatList,
  I18nManager,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import {
  DrawerActions,
  useNavigation,
} from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { CompanyCard } from '../../components/admin/CompanyCard';
import { Header } from '../../components/common/Header';
import { Icon } from '../../components/common/Icon';
import { SkeletonCard } from '../../components/common/SkeletonCard';
import { colors } from '../../constants/colors';
import { hitSlop, radius, shadows, spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';
import { useCompanies } from '../../hooks/useAdmin';
import type { Company, CompanyStatus, PlanTier } from '../../types/admin';
import type { AdminCompaniesStackParamList } from '../../navigation/types';

type Sort = 'name' | 'mrrDesc' | 'newest' | 'oldest';

type Navigation = NativeStackNavigationProp<
  AdminCompaniesStackParamList,
  'CompaniesList'
>;

const STATUS_FILTERS: readonly (CompanyStatus | 'all')[] = [
  'all',
  'active',
  'pending',
  'suspended',
];

const PLAN_FILTERS: readonly (PlanTier | 'all')[] = [
  'all',
  'free',
  'starter',
  'business',
  'enterprise',
];

export const CompaniesListScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<Navigation>();

  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<CompanyStatus | 'all'>('all');
  const [plan, setPlan] = useState<PlanTier | 'all'>('all');
  const [sort, setSort] = useState<Sort>('mrrDesc');

  const filters = useMemo(() => {
    const map: Record<string, string> = {};
    if (status !== 'all') map.status = status;
    if (plan !== 'all') map.plan = plan;
    return Object.keys(map).length > 0 ? map : undefined;
  }, [status, plan]);

  const companiesQuery = useCompanies({
    search: query,
    pageSize: 100,
    filters,
  });

  const sorted = useMemo(() => {
    const items = companiesQuery.data?.items ?? [];
    const copy = [...items];
    switch (sort) {
      case 'name':
        return copy.sort((a, b) => a.name.localeCompare(b.name));
      case 'newest':
        return copy.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      case 'oldest':
        return copy.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      case 'mrrDesc':
      default:
        return copy.sort((a, b) => b.mrr - a.mrr);
    }
  }, [companiesQuery.data, sort]);

  const open = (company: Company): void => {
    navigation.navigate('CompanyDetail', { companyId: company.id });
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <Header
        title={t('companies.title')}
        showBack={false}
        leftSlot={
          <Pressable
            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
            hitSlop={hitSlop.md}
            style={styles.headerBtn}
          >
            <Icon name="menu-outline" size={24} color={colors.textInverse} />
          </Pressable>
        }
      />

      <View style={styles.searchRow}>
        <Icon name="search-outline" size={18} color={colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('companies.searchCompanies')}
          placeholderTextColor={colors.textMuted}
          style={[
            styles.searchInput,
            { textAlign: I18nManager.isRTL ? 'right' : 'left' },
          ]}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {STATUS_FILTERS.map((entry) => (
          <Pressable
            key={`status-${entry}`}
            onPress={() => setStatus(entry)}
            style={[
              styles.chip,
              status === entry ? styles.chipActive : null,
            ]}
          >
            <Text
              style={[
                styles.chipText,
                status === entry ? { color: colors.textInverse } : null,
              ]}
            >
              {entry === 'all' ? t('customers.title') : t(`companies.${entry}`)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {PLAN_FILTERS.map((entry) => (
          <Pressable
            key={`plan-${entry}`}
            onPress={() => setPlan(entry)}
            style={[
              styles.planChip,
              plan === entry ? styles.planChipActive : null,
            ]}
          >
            <Text
              style={[
                styles.planChipText,
                plan === entry ? { color: colors.primaryDark } : null,
              ]}
            >
              {entry === 'all' ? t('customers.title') : entry}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.sortRow}>
        {(['mrrDesc', 'name', 'newest', 'oldest'] as Sort[]).map((key) => (
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
                sort === key
                  ? { color: colors.primaryDark, fontWeight: '700' }
                  : null,
              ]}
            >
              {key}
            </Text>
          </Pressable>
        ))}
      </View>

      {companiesQuery.isLoading ? (
        <View style={styles.list}>
          {Array.from({ length: 4 }).map((_, idx) => (
            <SkeletonCard key={idx} height={120} />
          ))}
        </View>
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={(company) => company.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <CompanyCard company={item} onPress={open} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Icon name="business-outline" size={48} color={colors.primary} />
              <Text style={styles.emptyTitle}>{t('companies.title')}</Text>
            </View>
          }
        />
      )}

      <Pressable
        onPress={() =>
          navigation.navigate('CompanyDetail', { companyId: 'comp_101' })
        }
        style={({ pressed }) => [
          styles.fab,
          pressed ? { opacity: 0.9 } : null,
        ]}
      >
        <Icon name="add" size={26} color={colors.textInverse} />
      </Pressable>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  headerBtn: {
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
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    ...shadows.xs,
  },
  searchInput: {
    flex: 1,
    ...textStyles.body,
    color: colors.textPrimary,
    paddingVertical: spacing.sm,
  },
  filterRow: {
    paddingHorizontal: spacing.base,
    columnGap: spacing.xs,
    paddingBottom: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    ...textStyles.caption,
    color: colors.textSecondary,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  planChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
  },
  planChipActive: { backgroundColor: colors.primarySoft },
  planChipText: {
    ...textStyles.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  sortRow: {
    flexDirection: 'row',
    columnGap: spacing.xs,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.xs,
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
  list: {
    padding: spacing.base,
    paddingBottom: spacing.xxxl * 2,
  },
  empty: {
    alignItems: 'center',
    paddingTop: spacing.xxxl,
    rowGap: spacing.sm,
  },
  emptyTitle: { ...textStyles.h4, color: colors.textPrimary },
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

export default CompaniesListScreen;
