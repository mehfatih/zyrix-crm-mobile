/**
 * AdminSettingsScreen — personal admin settings: profile, security,
 * notification preferences, language, timezone, logout.
 */

import React from 'react';
import {
  Alert,
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
import { Icon, type AnyIconName } from '../../components/common/Icon';
import { LanguageSwitcher } from '../../components/common/LanguageSwitcher';
import { colors } from '../../constants/colors';
import { hitSlop, radius, shadows, spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';
import { useAuthStore } from '../../store/authStore';
import { useUserStore } from '../../store/userStore';

export const AdminSettingsScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const currentUser = useUserStore((state) => state.currentUser);
  const logout = useAuthStore((state) => state.logout);

  const onLogout = (): void => {
    Alert.alert(t('common.signOut'), undefined, [
      { text: t('common.cancel') },
      {
        text: t('common.signOut'),
        style: 'destructive',
        onPress: () => void logout(),
      },
    ]);
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <Header
        title={t('admin.settings')}
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
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(currentUser?.name ?? 'A')
                .split(/\s+/)
                .map((part) => part.charAt(0).toUpperCase())
                .slice(0, 2)
                .join('')}
            </Text>
          </View>
          <Text style={styles.name}>{currentUser?.name ?? 'Admin'}</Text>
          <Text style={styles.email}>{currentUser?.email ?? '—'}</Text>
          <Text style={styles.role}>{currentUser?.role}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('common.welcome')}</Text>
          <SettingsRow
            icon="person-outline"
            label="Profile"
            onPress={() => Alert.alert('Edit profile')}
          />
          <SettingsRow
            icon="lock-closed-outline"
            label="Password"
            onPress={() => Alert.alert('Change password')}
          />
          <SettingsRow
            icon="shield-checkmark-outline"
            label="Two-factor auth"
            onPress={() => Alert.alert('Enable 2FA')}
            trailing={
              <Switch
                value
                disabled
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.white}
              />
            }
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('language.select')}</Text>
          <LanguageSwitcher variant="inline" />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('admin.systemNotifications')}
          </Text>
          <SettingsRow
            icon="notifications-outline"
            label="Email notifications"
            trailing={
              <Switch
                value
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.white}
              />
            }
          />
          <SettingsRow
            icon="phone-portrait-outline"
            label="Mobile push"
            trailing={
              <Switch
                value
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.white}
              />
            }
          />
        </View>

        <Pressable
          onPress={onLogout}
          style={({ pressed }) => [
            styles.logoutBtn,
            pressed ? { opacity: 0.85 } : null,
          ]}
        >
          <Icon name="log-out-outline" size={20} color={colors.error} />
          <Text style={styles.logoutText}>{t('common.signOut')}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};

const SettingsRow: React.FC<{
  icon: AnyIconName;
  label: string;
  onPress?: () => void;
  trailing?: React.ReactNode;
}> = ({ icon, label, onPress, trailing }) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      styles.settingsRow,
      pressed && onPress ? { opacity: 0.85 } : null,
    ]}
  >
    <Icon name={icon} size={20} color={colors.primary} />
    <Text style={styles.settingsLabel}>{label}</Text>
    {trailing}
  </Pressable>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    padding: spacing.base,
    rowGap: spacing.base,
    paddingBottom: spacing.xxxl,
  },
  profileCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.xl,
    rowGap: spacing.xs,
    ...shadows.sm,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...textStyles.h2,
    color: colors.textInverse,
    fontWeight: '800',
  },
  name: { ...textStyles.h3, color: colors.textPrimary },
  email: { ...textStyles.body, color: colors.textMuted },
  role: {
    ...textStyles.label,
    color: colors.primary,
    fontWeight: '700',
  },
  section: {
    backgroundColor: colors.surface,
    padding: spacing.base,
    borderRadius: radius.lg,
    rowGap: spacing.sm,
    ...shadows.xs,
  },
  sectionTitle: { ...textStyles.h4, color: colors.textPrimary },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  settingsLabel: {
    flex: 1,
    ...textStyles.body,
    color: colors.textPrimary,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: spacing.sm,
    backgroundColor: colors.errorSoft,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    marginTop: spacing.base,
  },
  logoutText: {
    ...textStyles.button,
    color: colors.error,
  },
});

export default AdminSettingsScreen;
