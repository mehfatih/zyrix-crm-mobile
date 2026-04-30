/**
 * FeatureFlagsScreen — toggles platform-wide feature flags grouped by
 * category. The scope selector swaps between global defaults and the
 * per-company overrides for a chosen tenant.
 */

import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { DrawerActions, useNavigation } from '@react-navigation/native';

import { Header } from '../../components/common/Header';
import { Icon } from '../../components/common/Icon';
import {
  SearchableDropdown,
  type DropdownItem,
} from '../../components/forms/SearchableDropdown';
import { SkeletonCard } from '../../components/common/SkeletonCard';
import { darkColors } from '../../theme/dark';
import { hitSlop, radius, shadows, spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';
import {
  useCompanies,
  useFeatureFlags,
  useUpdateFeatureFlag,
} from '../../hooks/useAdmin';
import type { FeatureCategory, FeatureFlag } from '../../types/admin';

type Scope = 'global' | 'company';

const CATEGORY_ORDER: readonly FeatureCategory[] = [
  'sales',
  'growth',
  'ai',
  'operations',
  'security',
  'taxCompliance',
  'integrations',
  'platform',
  'advanced',
  'experience',
];

export const FeatureFlagsScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [scope, setScope] = useState<Scope>('global');
  const [company, setCompany] = useState<DropdownItem | null>(null);

  const flagsQuery = useFeatureFlags(
    scope === 'company' ? company?.id ?? null : null
  );
  const companiesQuery = useCompanies({ pageSize: 100 });
  const flagMut = useUpdateFeatureFlag();

  const companyOptions = useMemo<DropdownItem[]>(
    () =>
      (companiesQuery.data?.items ?? []).map((entry) => ({
        id: entry.id,
        label: entry.name,
        subtitle: entry.ownerEmail,
      })),
    [companiesQuery.data]
  );

  const grouped = useMemo(() => {
    const flags = flagsQuery.data ?? [];
    const groups = new Map<FeatureCategory, FeatureFlag[]>();
    for (const flag of flags) {
      const list = groups.get(flag.category) ?? [];
      list.push(flag);
      groups.set(flag.category, list);
    }
    return groups;
  }, [flagsQuery.data]);

  const toggle = (flag: FeatureFlag, enabled: boolean): void => {
    flagMut.mutate({
      companyId: scope === 'company' ? company?.id ?? null : null,
      flagKey: flag.key,
      enabled,
    });
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <Header
        title={t('featureFlags.title')}
        showBack={false}
        leftSlot={
          <Pressable
            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
            hitSlop={hitSlop.md}
            style={styles.headerBtn}
          >
            <Icon name="menu-outline" size={24} color={darkColors.textOnPrimary} />
          </Pressable>
        }
      />

      <View style={styles.scopeRow}>
        {(['global', 'company'] as Scope[]).map((entry) => (
          <Pressable
            key={entry}
            onPress={() => setScope(entry)}
            style={[styles.scopeChip, scope === entry ? styles.scopeChipActive : null]}
          >
            <Text
              style={[
                styles.scopeText,
                scope === entry ? { color: darkColors.textOnPrimary } : null,
              ]}
            >
              {t(`featureFlags.${entry}`)}
            </Text>
          </Pressable>
        ))}
      </View>

      {scope === 'company' ? (
        <View style={{ paddingHorizontal: spacing.base }}>
          <SearchableDropdown
            items={companyOptions}
            value={company}
            onChange={setCompany}
            label={t('admin.companies')}
            placeholder={t('companies.searchCompanies')}
          />
        </View>
      ) : null}

      <ScrollView contentContainerStyle={styles.scroll}>
        {flagsQuery.isLoading ? (
          Array.from({ length: 4 }).map((_, idx) => (
            <SkeletonCard key={idx} height={120} />
          ))
        ) : (
          CATEGORY_ORDER.map((category) => {
            const list = grouped.get(category) ?? [];
            if (list.length === 0) return null;
            return (
              <View key={category} style={styles.categoryCard}>
                <Text style={styles.categoryTitle}>
                  {t(`featureCategories.${category}`, category)}
                </Text>
                {list.map((flag) => (
                  <View key={flag.key} style={styles.flagRow}>
                    <View style={styles.flagBody}>
                      <Text style={styles.flagName}>{flag.name}</Text>
                      <Text style={styles.flagMeta}>
                        {`${t('featureFlags.category')}: ${flag.defaultEnabledFor}`}
                      </Text>
                    </View>
                    <Switch
                      value={flag.enabled}
                      onValueChange={(value) => toggle(flag, value)}
                      trackColor={{
                        false: darkColors.border,
                        true: darkColors.primary,
                      }}
                      thumbColor={darkColors.white}
                    />
                  </View>
                ))}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: darkColors.background },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scopeRow: {
    flexDirection: 'row',
    columnGap: spacing.sm,
    padding: spacing.base,
  },
  scopeChip: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: darkColors.primary,
    alignItems: 'center',
  },
  scopeChipActive: { backgroundColor: darkColors.primary },
  scopeText: {
    ...textStyles.caption,
    color: darkColors.primary,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  scroll: {
    padding: spacing.base,
    paddingBottom: spacing.xxxl,
    rowGap: spacing.base,
  },
  categoryCard: {
    backgroundColor: darkColors.surface,
    padding: spacing.base,
    borderRadius: radius.lg,
    rowGap: spacing.sm,
    ...shadows.xs,
  },
  categoryTitle: {
    ...textStyles.h4,
    color: darkColors.textPrimary,
    textTransform: 'capitalize',
  },
  flagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.sm,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: darkColors.divider,
  },
  flagBody: { flex: 1 },
  flagName: { ...textStyles.body, color: darkColors.textPrimary },
  flagMeta: { ...textStyles.caption, color: darkColors.textMuted },
});

export default FeatureFlagsScreen;
