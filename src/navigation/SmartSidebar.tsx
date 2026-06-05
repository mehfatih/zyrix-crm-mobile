/**
 * SmartSidebar — drawer content for the merchant root navigator.
 *
 * M22 reorganized this from 4 groups (WORK / ENGAGE / GROW / SYSTEM) into
 * 7 groups (DAILY OPS / CRM CORE / SALES DOCS / FINANCE / GROWTH /
 * INTELLIGENCE / AI & AUTOMATION) matching the website. The single
 * source of truth is `src/lib/nav/sidebar-catalog.ts`.
 *
 * Layout:
 *   1. UserCard (avatar + name + company · plan badge)
 *   2. Search filter
 *   3. Pinned section (long-press to pin/unpin)
 *   4. HOME standalone
 *   5. 7 grouped sections, each rendered with its accent color
 *   6. Footer items (Settings/Help/Profile)
 *   7. Bottom: language pills · version · log out row
 *
 * Behaviours:
 *   - Real items navigate via top-level route or nested `{ nav, params }`.
 *   - SOON items show a toast (`Sidebar.soonToast`) and do not navigate.
 *   - Long-press shows a Pin / Unpin alert for pinnable items.
 *   - Search filter narrows the visible items to those matching the query.
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

import { Icon } from '../components/common/Icon';
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
import { useToast } from '../hooks/useToast';
import {
  SIDEBAR_FOOTER_ITEMS,
  SIDEBAR_GROUPS,
  SIDEBAR_HOME,
  getAllSidebarItems,
  type SidebarCatalogItem,
  type SidebarGroupAccent,
  type SidebarRouteTarget,
} from '../lib/nav/sidebar-catalog';

/**
 * Translate the catalog's logical accent name into the actual
 * SidebarAccent supported by the SidebarItem component.
 *
 * The catalog uses semantic names (matching the website's per-group
 * intent); the SidebarItem component supports a smaller fixed set of
 * design tokens.
 */
const accentMap: Record<SidebarGroupAccent, SidebarAccent> = {
  cyan: 'cyan',
  violet: 'lavender',
  sky: 'sky',
  emerald: 'mint',
  rose: 'coral',
};

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
  const toast = useToast();
  const currentUser = useUserStore((s) => s.currentUser);
  const logoutAuth = useAuthStore((s) => s.logout);
  const clearUser = useUserStore((s) => s.clearUser);
  const pins = usePinnedStore((s) => s.pins);
  const togglePin = usePinnedStore((s) => s.togglePin);
  const isPinned = usePinnedStore((s) => s.isPinned);

  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');

  const activeRoute = state.routeNames[state.index] ?? null;

  /**
   * Navigate to either a top-level drawer route (string) or a nested
   * route (`{ nav, params }`). Always closes the drawer afterwards.
   */
  const navigateToItem = useCallback(
    (item: SidebarCatalogItem): void => {
      if (item.status === 'soon' || !item.route) {
        toast.info(t('Sidebar.soonBadge'), t('Sidebar.soonToast'));
        return;
      }

      const nav = navigation as unknown as {
        navigate: (name: string, params?: unknown) => void;
      };
      if (typeof item.route === 'string') {
        nav.navigate(item.route);
      } else {
        const target = item.route as SidebarRouteTarget;
        nav.navigate(target.nav, target.params);
      }
      navigation.closeDrawer();
    },
    [navigation, toast, t]
  );

  const onLongPress = useCallback(
    (item: SidebarCatalogItem): void => {
      if (item.pinnable === false) return;
      const pinned = isPinned(item.id);
      Alert.alert(
        pinned ? t('sidebar.unpin') : t('sidebar.pinToTop'),
        t(item.labelKey),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: pinned ? t('sidebar.unpin') : t('sidebar.pinToTop'),
            onPress: () => void togglePin(item.id),
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
    return getAllSidebarItems().filter((item) =>
      t(item.labelKey).toLowerCase().includes(needle)
    );
  }, [query, t]);

  const pinnedEntries = useMemo(() => {
    const allItems = getAllSidebarItems();
    return pins
      .map((id) => allItems.find((i) => i.id === id))
      .filter((item): item is SidebarCatalogItem => Boolean(item))
      .map((item) => {
        // Pinned entries inherit the accent of the group they belong to;
        // for HOME and footer items we fall back to cyan.
        const group = SIDEBAR_GROUPS.find((g) =>
          g.items.some((i) => i.id === item.id)
        );
        const accent: SidebarAccent = group ? accentMap[group.accent] : 'cyan';
        return {
          route: item.id,
          label: t(item.labelKey),
          icon: item.icon,
          accent,
        };
      });
  }, [pins, t]);

  const displayName = currentUser?.name?.trim() || t('common.appName');
  const companyName = currentUser?.companyName?.trim() || t('common.appName');
  const plan = inferPlan(currentUser?.plan ?? 'free');
  const planLabel = t(`plansBadge.${plan}`);

  const renderItem = (
    item: SidebarCatalogItem,
    accent: SidebarAccent
  ): React.ReactElement => {
    const isSoon = item.status === 'soon';
    return (
      <View key={item.id} style={styles.itemRow}>
        <View style={styles.itemMain}>
          <SidebarItem
            label={t(item.labelKey)}
            icon={item.icon}
            accent={accent}
            active={activeRoute === item.id}
            pinned={isPinned(item.id)}
            onPress={() => navigateToItem(item)}
            onLongPress={() => onLongPress(item)}
          />
        </View>
        {isSoon ? (
          <View style={styles.soonBadge} pointerEvents="none">
            <Text style={styles.soonBadgeText}>{t('Sidebar.soonBadge')}</Text>
          </View>
        ) : null}
      </View>
    );
  };

  /** Render a sidebar entry by looking up its accent from the parent group. */
  const renderPinnedItem = (item: SidebarCatalogItem): React.ReactElement => {
    const group = SIDEBAR_GROUPS.find((g) =>
      g.items.some((i) => i.id === item.id)
    );
    const accent: SidebarAccent = group ? accentMap[group.accent] : 'cyan';
    return renderItem(item, accent);
  };

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
            const nav = navigation as unknown as {
              navigate: (name: string, params?: unknown) => void;
            };
            nav.navigate('Home', { screen: 'MoreTab', params: { screen: 'Profile' } });
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
              filtered.map(renderPinnedItem)
            )}
          </View>
        ) : (
          <>
            <View style={styles.homeBlock}>
              {renderItem(SIDEBAR_HOME, accentMap.cyan)}
            </View>

            <PinnedSection
              entries={pinnedEntries}
              activeRoute={activeRoute}
              onSelect={(id) => {
                const item = getAllSidebarItems().find((i) => i.id === id);
                if (item) navigateToItem(item);
              }}
              onLongPress={(id) => {
                const item = getAllSidebarItems().find((i) => i.id === id);
                if (item) onLongPress(item);
              }}
            />

            {SIDEBAR_GROUPS.map((group) => {
              const accent = accentMap[group.accent];
              return (
                <SidebarGroup key={group.id} label={t(group.labelKey)}>
                  {group.items.map((item) => renderItem(item, accent))}
                </SidebarGroup>
              );
            })}

            <SidebarGroup label={t('Sidebar.groups.system')}>
              {SIDEBAR_FOOTER_ITEMS.map((item) => renderItem(item, accentMap.sky))}
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
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemMain: {
    flex: 1,
  },
  soonBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: colors.warningSoft,
    marginEnd: spacing.sm,
  },
  soonBadgeText: {
    ...textStyles.caption,
    color: colors.warning,
    fontWeight: '700',
    fontSize: 10,
    letterSpacing: 0.5,
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
