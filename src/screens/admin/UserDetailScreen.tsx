/**
 * UserDetailScreen — admin view for a single user across the platform.
 * Tabs: Profile, Sessions, Activity, Permissions, Actions.
 */

import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';

import { Header } from '../../components/common/Header';
import { Icon, type AnyIconName } from '../../components/common/Icon';
import { SkeletonCard } from '../../components/common/SkeletonCard';
import { colors } from '../../constants/colors';
import { radius, shadows, spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';
import {
  useAdminUserDetail,
  useDeactivateUser,
  useImpersonateUser,
  useResetPassword,
} from '../../hooks/useAdmin';
import { useCountryConfig } from '../../hooks/useCountryConfig';
import type { AdminUsersStackParamList } from '../../navigation/types';

type Tab = 'profile' | 'sessions' | 'activity' | 'permissions' | 'actions';

type Route = RouteProp<AdminUsersStackParamList, 'UserDetail'>;

const TABS: readonly Tab[] = [
  'profile',
  'sessions',
  'activity',
  'permissions',
  'actions',
];

const MOCK_SESSIONS = [
  {
    id: 'sess_1',
    device: 'Pixel 8 Pro · Android 14',
    ip: '212.118.45.12',
    lastActive: '2026-04-22T14:00:00Z',
    location: 'Riyadh, SA',
  },
  {
    id: 'sess_2',
    device: 'MacBook Pro · Safari',
    ip: '85.140.23.99',
    lastActive: '2026-04-21T09:30:00Z',
    location: 'Istanbul, TR',
  },
];

export const UserDetailScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute<Route>();
  const { formatDate } = useCountryConfig();

  const { data: user, isLoading } = useAdminUserDetail(route.params.userId);
  const resetMut = useResetPassword();
  const deactivateMut = useDeactivateUser();
  const impersonateMut = useImpersonateUser();

  const [tab, setTab] = useState<Tab>('profile');

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <Header
        title={user?.name ?? t('usersAdmin.allUsers')}
        onBack={() => navigation.goBack()}
      />
      {isLoading || !user ? (
        <View style={{ padding: spacing.base }}>
          <SkeletonCard height={140} />
          <SkeletonCard height={120} />
        </View>
      ) : (
        <>
          <View style={styles.heroCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user.avatarInitials}</Text>
            </View>
            <View style={styles.heroBody}>
              <Text style={styles.heroName}>{user.name}</Text>
              <Text style={styles.heroMeta}>
                {`${user.email} · ${user.role}`}
              </Text>
              <Text style={styles.heroMeta}>
                {user.companyName ?? t('admin.adminPanel')}
              </Text>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabRow}
          >
            {TABS.map((entry) => (
              <Pressable
                key={entry}
                onPress={() => setTab(entry)}
                style={[styles.tab, tab === entry ? styles.tabActive : null]}
              >
                <Text
                  style={[
                    styles.tabText,
                    tab === entry ? { color: colors.textInverse } : null,
                  ]}
                >
                  {t(`userTabs.${entry}`, entry)}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <ScrollView contentContainerStyle={styles.scroll}>
            {tab === 'profile' ? (
              <View style={styles.card}>
                <InfoLine
                  icon="mail-outline"
                  label="Email"
                  value={user.email}
                />
                <InfoLine
                  icon="person-outline"
                  label="Role"
                  value={user.role}
                />
                <InfoLine
                  icon="business-outline"
                  label="Company"
                  value={user.companyName ?? '—'}
                />
                <InfoLine
                  icon="calendar-outline"
                  label="Created"
                  value={formatDate(user.createdAt)}
                />
                {user.lastLoginAt ? (
                  <InfoLine
                    icon="time-outline"
                    label="Last login"
                    value={formatDate(user.lastLoginAt)}
                  />
                ) : null}
              </View>
            ) : null}

            {tab === 'sessions' ? (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>
                  {`${MOCK_SESSIONS.length} active sessions`}
                </Text>
                {MOCK_SESSIONS.map((session) => (
                  <View key={session.id} style={styles.sessionRow}>
                    <View style={styles.sessionBody}>
                      <Text style={styles.sessionDevice}>{session.device}</Text>
                      <Text style={styles.sessionMeta}>
                        {`${session.ip} · ${session.location}`}
                      </Text>
                      <Text style={styles.sessionMeta}>
                        {formatDate(session.lastActive)}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() =>
                        Alert.alert(t('usersAdmin.sessionRevoked'))
                      }
                    >
                      <Text style={styles.revoke}>
                        {t('usersAdmin.activate', { defaultValue: 'Revoke' })}
                      </Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            ) : null}

            {tab === 'activity' ? (
              <View style={styles.card}>
                <Text style={styles.placeholderTitle}>
                  {t('placeholders.comingInSprint', { sprint: 9 })}
                </Text>
              </View>
            ) : null}

            {tab === 'permissions' ? (
              <View style={styles.card}>
                <Text style={styles.placeholderTitle}>
                  {t('placeholders.comingInSprint', { sprint: 9 })}
                </Text>
              </View>
            ) : null}

            {tab === 'actions' ? (
              <View style={styles.card}>
                <ActionRow
                  icon="key-outline"
                  label={t('usersAdmin.resetPassword')}
                  onPress={() => resetMut.mutate(user.id)}
                />
                <ActionRow
                  icon="ban-outline"
                  label={t('usersAdmin.deactivate')}
                  tone="warning"
                  onPress={() => deactivateMut.mutate(user.id)}
                />
                <ActionRow
                  icon="person-circle-outline"
                  label={t('usersAdmin.impersonate')}
                  onPress={() => impersonateMut.mutate(user.id)}
                />
                <ActionRow
                  icon="trash-outline"
                  label={t('usersAdmin.changeRole', { defaultValue: 'Delete' })}
                  tone="error"
                  onPress={() =>
                    Alert.alert(t('usersAdmin.deactivate'), user.email)
                  }
                />
              </View>
            ) : null}
          </ScrollView>
        </>
      )}
    </SafeAreaView>
  );
};

const InfoLine: React.FC<{ icon: AnyIconName; label: string; value: string }> = ({
  icon,
  label,
  value,
}) => (
  <View style={styles.infoLine}>
    <Icon name={icon} size={18} color={colors.primary} />
    <View style={styles.infoBody}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  </View>
);

const ActionRow: React.FC<{
  icon: AnyIconName;
  label: string;
  tone?: 'primary' | 'warning' | 'error';
  onPress: () => void;
}> = ({ icon, label, tone = 'primary', onPress }) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      styles.actionRow,
      pressed ? { opacity: 0.85 } : null,
    ]}
  >
    <Icon
      name={icon}
      size={20}
      color={
        tone === 'error'
          ? colors.error
          : tone === 'warning'
            ? colors.warning
            : colors.primary
      }
    />
    <Text
      style={[
        styles.actionLabel,
        tone === 'error'
          ? { color: colors.error }
          : tone === 'warning'
            ? { color: colors.warning }
            : null,
      ]}
    >
      {label}
    </Text>
  </Pressable>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    margin: spacing.base,
    padding: spacing.base,
    borderRadius: radius.xl,
    columnGap: spacing.base,
    ...shadows.sm,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...textStyles.h3,
    color: colors.primaryDark,
    fontWeight: '700',
  },
  heroBody: { flex: 1 },
  heroName: { ...textStyles.h2, color: colors.textPrimary },
  heroMeta: { ...textStyles.caption, color: colors.textMuted },
  tabRow: {
    paddingHorizontal: spacing.base,
    columnGap: spacing.xs,
  },
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  tabActive: { backgroundColor: colors.primary },
  tabText: {
    ...textStyles.caption,
    color: colors.primary,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  scroll: {
    padding: spacing.base,
    paddingBottom: spacing.xxxl,
    rowGap: spacing.base,
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.base,
    borderRadius: radius.lg,
    rowGap: spacing.sm,
    ...shadows.xs,
  },
  sectionTitle: { ...textStyles.h4, color: colors.textPrimary },
  placeholderTitle: {
    ...textStyles.body,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  infoLine: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.sm,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  infoBody: { flex: 1 },
  infoLabel: { ...textStyles.caption, color: colors.textMuted },
  infoValue: { ...textStyles.body, color: colors.textPrimary },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    columnGap: spacing.sm,
  },
  sessionBody: { flex: 1 },
  sessionDevice: {
    ...textStyles.bodyMedium,
    color: colors.textPrimary,
  },
  sessionMeta: { ...textStyles.caption, color: colors.textMuted },
  revoke: {
    ...textStyles.button,
    color: colors.error,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  actionLabel: {
    ...textStyles.body,
    color: colors.textPrimary,
  },
});

export default UserDetailScreen;
