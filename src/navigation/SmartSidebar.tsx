/**
 * SmartSidebar — App Sprint 2 drawer content for the merchant app.
 *
 * Replaces the generic "list of links" with a curated layout:
 *   1. UserCard (avatar + name + company · plan badge)
 *   2. Pinned section (user-customisable, default: Home / Tasks / Deals)
 *   3. WORK / ENGAGE / GROW / SYSTEM grouped sections, each with its
 *      own accent colour applied to the active item's left bar
 *   4. Bottom: 3-pill language switcher + version + log out row
 *
 * Behaviours:
 *   - Long-pressing any item shows a Pin / Unpin alert.
 *   - The magnifier at the top expands an inline search input that
 *     filters all items by label.
 *   - Conversations carries a coral "12" badge to demonstrate live
 *     state (mocked for the sprint).
 */

import React, { useCallback, useMemo, useState } from 'react';
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
import type { DrawerContentComponentProps } from '@react-navigation/drawer';

import { Icon, type AnyIconName } from '../components/common/Icon';
import { PinnedSection } from '../components/sidebar/PinnedSection';
import { SidebarGroup } from '../components/sidebar/SidebarGroup';
import { SidebarItem, type SidebarAccent } from '../components/sidebar/SidebarItem';
import { SidebarLanguagePills } from '../components/sidebar/SidebarLanguagePills';
import { SidebarSearch } from '../components/sidebar/SidebarSearch';
import { UserCard, type PlanTier } from '../components/sidebar/UserCard';
import { colors } from '../constants/colors';
import { hitSlop, spacing } from '../constants/spacing';
import { textStyles } from '../constants/typography';
import { useAuthStore } from '../store/authStore';
import { usePinnedStore } from '../store/pinnedStore';
import { useUserStore } from '../store/userStore';

interface ItemDef {
  route: string;
  labelKey: string;
  icon: AnyIconName;
  accent: SidebarAccent;
  badge?: number;
  badgeTone?: 'coral' | 'peach';
}

const HOME_ITEM: ItemDef = {
  route: 'Home',
  labelKey: 'sidebar.home',
  icon: 'home-outline',
  accent: 'cyan',
};

const WORK_ITEMS: readonly ItemDef[] = [
  { route: 'Contacts', labelKey: 'sidebar.contacts', icon: 'people-outline', accent: 'mint' },
  { route: 'Companies', labelKey: 'sidebar.companies', icon: 'business-outline', accent: 'mint' },
  { route: 'Deals', labelKey: 'sidebar.deals', icon: 'briefcase-outline', accent: 'mint' },
  { route: 'Tasks', labelKey: 'sidebar.tasks', icon: 'checkmark-done-outline', accent: 'mint', badge: 3, badgeTone: 'peach' },
  { route: 'Tickets', labelKey: 'sidebar.tickets', icon: 'ticket-outline', accent: 'mint' },
];

const ENGAGE_ITEMS: readonly ItemDef[] = [
  { route: 'Conversations', labelKey: 'sidebar.conversations', icon: 'chatbubbles-outline', accent: 'coral', badge: 12, badgeTone: 'coral' },
  { route: 'MarketingEmail', labelKey: 'sidebar.marketingEmail', icon: 'mail-outline', accent: 'coral' },
  { route: 'Calls', labelKey: 'sidebar.calls', icon: 'call-outline', accent: 'coral' },
  { route: 'MeetingLinks', labelKey: 'sidebar.meetingLinks', icon: 'videocam-outline', accent: 'coral' },
  { route: 'Feeds', labelKey: 'sidebar.feeds', icon: 'radio-outline', accent: 'coral' },
];

const GROW_ITEMS: readonly ItemDef[] = [
  { route: 'Dashboards', labelKey: 'sidebar.dashboards', icon: 'bar-chart-outline', accent: 'lavender' },
  { route: 'Segments', labelKey: 'sidebar.segments', icon: 'pie-chart-outline', accent: 'lavender' },
];

const SYSTEM_ITEMS: readonly ItemDef[] = [
  { route: 'Settings', labelKey: 'sidebar.settings', icon: 'settings-outline', accent: 'sky' },
  { route: 'Help', labelKey: 'sidebar.help', icon: 'help-buoy-outline', accent: 'sky' },
];

const ALL_ITEMS: readonly ItemDef[] = [
  HOME_ITEM,
  ...WORK_ITEMS,
  ...ENGAGE_ITEMS,
  ...GROW_ITEMS,
  ...SYSTEM_ITEMS,
];

const inferPlan = (planRaw: string | null | undefined): PlanTier => {
  switch ((planRaw ?? '').toLowerCase()) {
    case 'starter':
      return 'starter';
    case 'pro':
      return 'pro';
    case 'enterprise':
      return 'enterprise';
    case 'free':
      return 'free';
    case 'business':
    default:
      return 'business';
  }
};

export const SmartSidebar: React.FC<DrawerContentComponentProps> = ({
  navigation,
  state,
}) => {
  const { t } = useTranslation();
  const currentUser = useUserStore((s) => s.currentUser);
  const logoutAuth = useAuthStore((s) => s.logout);
  const clearUser = useUserStore((s) => s.clearUser);
  const pins = usePinnedStore((s) => s.pins);
  const togglePin = usePinnedStore((s) => s.togglePin);
  const isPinned = usePinnedStore((s) => s.isPinned);

  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');

  const activeRoute = state.routeNames[state.index] ?? null;

  const navigate = useCallback(
    (route: string): void => {
      navigation.navigate(route);
      navigation.closeDrawer();
    },
    [navigation]
  );

  const onLongPress = useCallback(
    (route: string): void => {
      const pinned = isPinned(route);
      Alert.alert(
        pinned ? t('sidebar.unpin') : t('sidebar.pinToTop'),
        ALL_ITEMS.find((i) => i.route === route)?.route ?? route,
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: pinned ? t('sidebar.unpin') : t('sidebar.pinToTop'),
            onPress: () => void togglePin(route),
          },
        ]
      );
    },
    [isPinned, togglePin, t]
  );

  const onLogout = async (): Promise<void> => {
    await clearUser();
    await logoutAuth();
  };

  const handleToggleSearch = (): void => {
    setSearchOpen((prev) => {
      if (prev) setQuery('');
      return !prev;
    });
  };

  const filtered = useMemo(() => {
    if (!query.trim()) return null;
    const needle = query.trim().toLowerCase();
    return ALL_ITEMS.filter((item) =>
      t(item.labelKey).toLowerCase().includes(needle)
    );
  }, [query, t]);

  const pinnedEntries = useMemo(
    () =>
      pins
        .map((route) => ALL_ITEMS.find((i) => i.route === route))
        .filter((item): item is ItemDef => Boolean(item))
        .map((item) => ({
          route: item.route,
          label: t(item.labelKey),
          icon: item.icon,
          accent: item.accent,
        })),
    [pins, t]
  );

  const displayName = currentUser?.name?.trim() || t('common.appName');
  const companyName =
    currentUser?.companyId === null
      ? t('common.appName')
      : 'Levana Cosmetics';
  const plan = inferPlan('business');
  const planLabel = t(`plansBadge.${plan}`);

  const renderItem = (item: ItemDef): React.ReactElement => (
    <SidebarItem
      key={item.route}
      label={t(item.labelKey)}
      icon={item.icon}
      accent={item.accent}
      active={activeRoute === item.route}
      badge={item.badge}
      badgeTone={item.badgeTone}
      pinned={isPinned(item.route)}
      onPress={() => navigate(item.route)}
      onLongPress={() => onLongPress(item.route)}
    />
  );

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
      <View style={styles.topRow}>
        <UserCard
          name={displayName}
          companyName={companyName}
          plan={plan}
          planLabel={planLabel}
          avatarUri={currentUser?.avatar ?? null}
          onPress={() => {
            navigation.navigate('Profile');
            navigation.closeDrawer();
          }}
        />
      </View>

      <SidebarSearch
        expanded={searchOpen}
        onToggle={handleToggleSearch}
        query={query}
        onChangeQuery={setQuery}
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {filtered ? (
          <View style={styles.searchResults}>
            {filtered.length === 0 ? (
              <Text style={styles.empty}>{t('common.error')}</Text>
            ) : (
              filtered.map(renderItem)
            )}
          </View>
        ) : (
          <>
            <View style={styles.homeBlock}>
              {renderItem(HOME_ITEM)}
            </View>

            <PinnedSection
              entries={pinnedEntries}
              activeRoute={activeRoute}
              onSelect={navigate}
              onLongPress={onLongPress}
            />

            <SidebarGroup label={t('sidebar.groupWork')}>
              {WORK_ITEMS.map(renderItem)}
            </SidebarGroup>

            <SidebarGroup label={t('sidebar.groupEngage')}>
              {ENGAGE_ITEMS.map(renderItem)}
            </SidebarGroup>

            <SidebarGroup label={t('sidebar.groupGrow')}>
              {GROW_ITEMS.map(renderItem)}
            </SidebarGroup>

            <SidebarGroup label={t('sidebar.groupSystem')}>
              {SYSTEM_ITEMS.map(renderItem)}
            </SidebarGroup>
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <SidebarLanguagePills />
        <View style={styles.footerMeta}>
          <Text style={styles.versionText}>{t('sidebar.version')}</Text>
          <Pressable
            onPress={() => void onLogout()}
            hitSlop={hitSlop.md}
            accessibilityRole="button"
            accessibilityLabel={t('sidebar.logout')}
            style={({ pressed }) => [
              styles.logoutBtn,
              pressed ? { opacity: 0.85 } : null,
            ]}
          >
            <Icon name="log-out-outline" size={16} color={colors.primary} />
            <Text style={styles.logoutText}>{t('sidebar.logout')}</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  topRow: {
    paddingTop: spacing.xs,
  },
  scroll: {
    paddingBottom: spacing.xl,
  },
  homeBlock: {
    paddingHorizontal: spacing.sm,
    marginTop: spacing.xs,
  },
  searchResults: {
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    rowGap: spacing.xs,
  },
  empty: {
    ...textStyles.body,
    color: colors.textMuted,
    paddingHorizontal: spacing.base,
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    rowGap: spacing.sm,
  },
  footerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  versionText: {
    ...textStyles.caption,
    color: colors.textMuted,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.xs,
  },
  logoutText: {
    ...textStyles.label,
    color: colors.primary,
    fontWeight: '700',
  },
});

export default SmartSidebar;
