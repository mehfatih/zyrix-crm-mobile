/**
 * UsersManagementScreen — platform-wide user list with role filter,
 * search and the standard admin batch-actions affordances.
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
import { DrawerActions, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Header } from '../../components/common/Header';
import { Icon } from '../../components/common/Icon';
import { SkeletonCard } from '../../components/common/SkeletonCard';
import { UserCard } from '../../components/admin/UserCard';
import { colors } from '../../constants/colors';
import { hitSlop, radius, shadows, spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';
import { useAllUsers } from '../../hooks/useAdmin';
import type { AdminUser } from '../../types/admin';
import type { UserRole } from '../../types/auth';
import type { AdminUsersStackParamList } from '../../navigation/types';

type RoleFilter = UserRole | 'all';

const ROLE_FILTERS: readonly RoleFilter[] = [
  'all',
  'super_admin',
  'admin',
  'merchant_owner',
  'merchant_manager',
  'merchant_employee',
];

type Navigation = NativeStackNavigationProp<
  AdminUsersStackParamList,
  'UsersList'
>;

export const UsersManagementScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<Navigation>();
  const [query, setQuery] = useState('');
  const [role, setRole] = useState<RoleFilter>('all');

  const filters = useMemo(
    () => (role === 'all' ? undefined : { role }),
    [role]
  );
  const usersQuery = useAllUsers({ search: query, filters, pageSize: 100 });

  const items = useMemo(() => {
    return [...(usersQuery.data?.items ?? [])].sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [usersQuery.data]);

  const open = (user: AdminUser): void => {
    navigation.navigate('UserDetail', { userId: user.id });
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <Header
        title={t('usersAdmin.allUsers')}
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
          placeholder={t('forms.searchCountry')}
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
        {ROLE_FILTERS.map((entry) => (
          <Pressable
            key={entry}
            onPress={() => setRole(entry)}
            style={[styles.chip, role === entry ? styles.chipActive : null]}
          >
            <Text
              style={[
                styles.chipText,
                role === entry ? { color: colors.textInverse } : null,
              ]}
            >
              {entry === 'all' ? t('customers.title') : entry}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {usersQuery.isLoading ? (
        <View style={styles.list}>
          {Array.from({ length: 5 }).map((_, idx) => (
            <SkeletonCard key={idx} height={88} />
          ))}
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(user) => user.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <UserCard user={item} onPress={open} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Icon name="people-outline" size={48} color={colors.primary} />
              <Text style={styles.emptyTitle}>{t('usersAdmin.allUsers')}</Text>
            </View>
          }
        />
      )}

      <Pressable
        onPress={() =>
          navigation.navigate('UserDetail', { userId: 'user_111' })
        }
        style={({ pressed }) => [
          styles.fab,
          pressed ? { opacity: 0.9 } : null,
        ]}
      >
        <Icon name="person-add-outline" size={24} color={colors.textInverse} />
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

export default UsersManagementScreen;
