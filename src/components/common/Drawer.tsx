/**
 * Drawer — custom drawer content used by @react-navigation/drawer.
 *
 * Layout (top → bottom):
 *   1. User card (avatar + name + role badge)
 *   2. Primary navigation items (icon + label, focused highlight)
 *   3. Secondary row: language switcher
 *   4. Logout button pinned to the bottom
 *
 * Pass to the drawer with `drawerContent={(props) => <Drawer {...props} items={...} />}`.
 */

import React from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import type { DrawerContentComponentProps } from '@react-navigation/drawer';

import { colors } from '../../constants/colors';
import { radius, shadows, spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';
import { useAuthStore } from '../../store/authStore';
import { useUserStore } from '../../store/userStore';
import { Button } from './Button';
import { Icon, type AnyIconName, type IconFamily } from './Icon';
import { LanguageSwitcher } from './LanguageSwitcher';

export interface DrawerItem {
  /** React Navigation route name to navigate to when tapped. */
  route: string;
  /** i18n key or already-translated label. */
  label: string;
  /** Optional secondary description (i18n key or literal). Sprint 1 (app):
   *  drawer items expand to 88px with a 2-line description so labels like
   *  "Paid / In Progress / Refunded" no longer clip. */
  description?: string;
  icon: AnyIconName;
  iconFamily?: IconFamily;
  badge?: number;
}

export interface DrawerProps extends DrawerContentComponentProps {
  items: readonly DrawerItem[];
  style?: StyleProp<ViewStyle>;
  /** Extra row rendered at the very top (optional). */
  header?: React.ReactNode;
  /** Optional override for the logout handler. Defaults to authStore.logout + userStore.clearUser. */
  onLogout?: () => Promise<void> | void;
}

const resolveLabel = (label: string, t: (k: string) => string): string => {
  // If the label looks like an i18n key, translate; otherwise return as-is.
  if (!label) return '';
  if (label.includes('.') && !label.includes(' ')) {
    const translated = t(label);
    return translated === label ? label : translated;
  }
  return label;
};

export const Drawer: React.FC<DrawerProps> = ({
  navigation,
  state,
  items,
  header,
  onLogout,
  style,
}) => {
  const { t } = useTranslation();
  const currentUser = useUserStore((s) => s.currentUser);
  const logoutAuth = useAuthStore((s) => s.logout);
  const clearUser = useUserStore((s) => s.clearUser);

  const activeRouteName = state.routeNames[state.index];

  const defaultLogout = async (): Promise<void> => {
    await clearUser();
    await logoutAuth();
  };

  const handleLogout = async (): Promise<void> => {
    if (onLogout) {
      await onLogout();
    } else {
      await defaultLogout();
    }
  };

  const handleNavigate = (route: string): void => {
    navigation.navigate(route);
  };

  const displayName = currentUser?.name?.trim() || t('common.appName');
  const initials = displayName
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const roleLabel = currentUser?.role ? t(`roles.${toCamel(currentUser.role)}`) : '';

  return (
    <SafeAreaView edges={['top', 'bottom']} style={[styles.safe, style]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.userCard}>
          {currentUser?.avatar ? (
            <Image
              source={{ uri: currentUser.avatar }}
              style={styles.avatar}
              accessibilityIgnoresInvertColors
            />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarInitials}>{initials || 'Z'}</Text>
            </View>
          )}
          <View style={styles.userText}>
            <Text numberOfLines={1} style={styles.userName}>
              {displayName}
            </Text>
            {roleLabel ? (
              <Text numberOfLines={1} style={styles.userRole}>
                {roleLabel}
              </Text>
            ) : currentUser?.email ? (
              <Text numberOfLines={1} style={styles.userRole}>
                {currentUser.email}
              </Text>
            ) : null}
          </View>
        </View>

        {header ? <View style={styles.headerSlot}>{header}</View> : null}

        <View style={styles.itemList}>
          {items.map((item) => {
            const focused = activeRouteName === item.route;
            return (
              <Pressable
                key={item.route}
                onPress={() => handleNavigate(item.route)}
                accessibilityRole="button"
                accessibilityState={{ selected: focused }}
                style={({ pressed }) => [
                  styles.item,
                  focused ? styles.itemFocused : null,
                  pressed ? styles.itemPressed : null,
                ]}
              >
                <Icon
                  name={item.icon}
                  family={item.iconFamily}
                  size={24}
                  color={focused ? colors.primary : colors.textSecondary}
                />
                <View style={styles.itemTextWrap}>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.itemLabel,
                      focused ? styles.itemLabelFocused : null,
                    ]}
                  >
                    {resolveLabel(item.label, t)}
                  </Text>
                  {item.description ? (
                    <Text
                      numberOfLines={2}
                      style={styles.itemDescription}
                    >
                      {resolveLabel(item.description, t)}
                    </Text>
                  ) : null}
                </View>
                {item.badge && item.badge > 0 ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {item.badge > 99 ? '99+' : String(item.badge)}
                    </Text>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.footerRow}>
          <LanguageSwitcher variant="inline" />
        </View>
        <Button
          label={t('navigation.logout')}
          variant="outline"
          fullWidth
          onPress={() => void handleLogout()}
          leftIcon={<Icon name="log-out-outline" size={20} color={colors.primary} />}
        />
      </View>
    </SafeAreaView>
  );
};

const toCamel = (snake: string): string =>
  snake
    .split('_')
    .map((part, idx) =>
      idx === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)
    )
    .join('');

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scroll: {
    paddingBottom: spacing.xxl,
  },
  userCard: {
    margin: spacing.base,
    padding: spacing.base,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.md,
    ...shadows.xs,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.surface,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  avatarInitials: {
    ...textStyles.h4,
    color: colors.textInverse,
  },
  userText: {
    flex: 1,
  },
  userName: {
    ...textStyles.bodyMedium,
    color: colors.textPrimary,
  },
  userRole: {
    ...textStyles.caption,
    color: colors.primaryDark,
    marginTop: 2,
  },
  headerSlot: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.sm,
  },
  itemList: {
    paddingHorizontal: spacing.sm,
    rowGap: spacing.xxs,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 88,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    borderRadius: radius.md,
    columnGap: spacing.md,
  },
  itemFocused: {
    backgroundColor: colors.primarySoft,
  },
  itemPressed: {
    backgroundColor: colors.overlay,
  },
  itemTextWrap: {
    flex: 1,
    rowGap: 2,
  },
  itemLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.1,
  },
  itemLabelFocused: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  itemDescription: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 16,
  },
  badge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: colors.textInverse,
    fontSize: 11,
    fontWeight: '700',
  },
  footer: {
    padding: spacing.base,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
    rowGap: spacing.md,
  },
  footerRow: {
    alignItems: 'flex-start',
  },
});

export default Drawer;
