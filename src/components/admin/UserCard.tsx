/**
 * UserCard — admin-facing user row with role badge and company name.
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { colors } from '../../constants/colors';
import { radius, shadows, spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';
import type { AdminUser } from '../../types/admin';
import type { UserRole } from '../../types/auth';
import { useCountryConfig } from '../../hooks/useCountryConfig';

export interface UserCardProps {
  user: AdminUser;
  onPress?: (user: AdminUser) => void;
}

const ROLE_TONE: Record<UserRole, { background: string; color: string }> = {
  super_admin: { background: colors.errorSoft, color: colors.error },
  admin: { background: colors.warningSoft, color: colors.warning },
  merchant_owner: { background: colors.primarySoft, color: colors.primaryDark },
  merchant_admin: { background: colors.primarySoft, color: colors.primary },
  merchant_manager: { background: colors.surfaceAlt, color: colors.textSecondary },
  merchant_employee: { background: colors.surfaceAlt, color: colors.textMuted },
  customer: { background: colors.surfaceAlt, color: colors.textMuted },
};

export const UserCard: React.FC<UserCardProps> = ({ user, onPress }) => {
  const { t } = useTranslation();
  const { formatDate } = useCountryConfig();
  const tone = ROLE_TONE[user.role];

  return (
    <Pressable
      onPress={() => onPress?.(user)}
      style={({ pressed }) => [
        styles.card,
        pressed ? { opacity: 0.85 } : null,
      ]}
      accessibilityRole="button"
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{user.avatarInitials}</Text>
      </View>
      <View style={styles.body}>
        <View style={styles.headerRow}>
          <Text style={styles.name} numberOfLines={1}>
            {user.name}
          </Text>
          <View style={[styles.roleBadge, { backgroundColor: tone.background }]}>
            <Text style={[styles.roleText, { color: tone.color }]}>
              {t(`roles.${roleKey(user.role)}`)}
            </Text>
          </View>
        </View>
        <Text style={styles.email} numberOfLines={1}>
          {user.email}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaText} numberOfLines={1}>
            {user.companyName ?? t('admin.adminPanel')}
          </Text>
          {user.lastLoginAt ? (
            <Text style={styles.metaText}>
              {formatDate(user.lastLoginAt)}
            </Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
};

const roleKey = (
  role: UserRole
): 'superAdmin' | 'admin' | 'merchantOwner' | 'merchantAdmin' | 'merchantManager' | 'merchantEmployee' | 'customer' => {
  switch (role) {
    case 'super_admin':
      return 'superAdmin';
    case 'admin':
      return 'admin';
    case 'merchant_owner':
      return 'merchantOwner';
    case 'merchant_admin':
      return 'merchantAdmin';
    case 'merchant_manager':
      return 'merchantManager';
    case 'merchant_employee':
      return 'merchantEmployee';
    case 'customer':
      return 'customer';
  }
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.base,
    borderRadius: radius.lg,
    columnGap: spacing.sm,
    marginBottom: spacing.sm,
    ...shadows.xs,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...textStyles.label,
    color: colors.primaryDark,
    fontWeight: '700',
  },
  body: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    columnGap: spacing.xs,
  },
  name: {
    flex: 1,
    ...textStyles.bodyMedium,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  roleBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  roleText: {
    ...textStyles.caption,
    fontWeight: '700',
  },
  email: {
    ...textStyles.caption,
    color: colors.textMuted,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
    columnGap: spacing.xs,
  },
  metaText: {
    ...textStyles.caption,
    color: colors.textSecondary,
  },
});

export default UserCard;
