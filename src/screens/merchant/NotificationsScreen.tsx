/**
 * NotificationsScreen — merchant notifications inbox.
 *
 * Sprint 1 (app) fix: tapping the bell badge on the dashboard now opens
 * this screen. Features:
 *   • Unread bubble up (bolded, left cyan dot, white background)
 *   • Read items (muted background, regular weight)
 *   • "Mark all as read" action in the right slot of the header
 *   • Pull-to-refresh
 *   • Swipe-left to delete (RN Animated + PanResponder, no extra deps)
 *   • Empty state with a friendly illustration and message
 *   • Relative time ago localized to AR / EN / TR
 *
 * When the backend `/api/notifications` endpoint ships, swap the local
 * state here for React Query against the real list — the row renderer
 * and swipe-delete logic stay identical.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  PanResponder,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Header } from '../../components/common/Header';
import { Icon } from '../../components/common/Icon';
import { colors } from '../../constants/colors';
import { radius, shadows, spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';
import type { SupportedLanguage } from '../../i18n';
import { useUiStore } from '../../store/uiStore';

type NotificationKind = 'deal_won' | 'payment_received' | 'task_due' | 'meeting' | 'system';

interface NotificationItem {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  /** ISO date string. */
  createdAt: string;
  read: boolean;
  /** Optional navigation hint for when the row is tapped. */
  deepLink?: string;
}

const ICON_BY_KIND: Record<NotificationKind, { icon: 'trophy-outline' | 'cash-outline' | 'checkmark-circle-outline' | 'calendar-outline' | 'information-circle-outline'; tint: string; soft: string }> = {
  deal_won: { icon: 'trophy-outline', tint: colors.mint, soft: colors.mintSoft },
  payment_received: { icon: 'cash-outline', tint: colors.teal, soft: colors.tealSoft },
  task_due: { icon: 'checkmark-circle-outline', tint: colors.peach, soft: colors.peachSoft },
  meeting: { icon: 'calendar-outline', tint: colors.lavender, soft: colors.lavenderSoft },
  system: { icon: 'information-circle-outline', tint: colors.primary, soft: colors.primarySoft },
};

// Mock seed data — replace with an API-backed list once the endpoint exists.
const seedNotifications = (): NotificationItem[] => {
  const now = Date.now();
  return [
    {
      id: 'n1',
      kind: 'deal_won',
      title: 'Deal won',
      body: 'Acme Corp accepted your quote for $12,400',
      createdAt: new Date(now - 1000 * 60 * 15).toISOString(),
      read: false,
      deepLink: 'deal:1234',
    },
    {
      id: 'n2',
      kind: 'payment_received',
      title: 'Payment received',
      body: 'Invoice INV-1042 paid by Globex Ltd',
      createdAt: new Date(now - 1000 * 60 * 60 * 2).toISOString(),
      read: false,
      deepLink: 'invoice:1042',
    },
    {
      id: 'n3',
      kind: 'task_due',
      title: 'Follow up with Ibrahim',
      body: 'Task due tomorrow 10:00',
      createdAt: new Date(now - 1000 * 60 * 60 * 6).toISOString(),
      read: true,
    },
    {
      id: 'n4',
      kind: 'meeting',
      title: 'Upcoming meeting',
      body: 'Ayşe Demir · Product demo · 14:30',
      createdAt: new Date(now - 1000 * 60 * 60 * 20).toISOString(),
      read: true,
    },
    {
      id: 'n5',
      kind: 'system',
      title: 'Welcome to Zyrix',
      body: 'Finish onboarding in Settings → Profile',
      createdAt: new Date(now - 1000 * 60 * 60 * 24 * 2).toISOString(),
      read: true,
    },
  ];
};

const formatTimeAgo = (
  iso: string,
  lang: SupportedLanguage
): string => {
  const then = new Date(iso).getTime();
  const diff = Math.max(0, Date.now() - then);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (lang === 'ar') {
    if (minutes < 1) return 'الآن';
    if (minutes < 60) return `قبل ${minutes} دقيقة`;
    if (hours < 24) return `قبل ${hours} ساعة`;
    return `قبل ${days} يوم`;
  }
  if (lang === 'tr') {
    if (minutes < 1) return 'şimdi';
    if (minutes < 60) return `${minutes} dakika önce`;
    if (hours < 24) return `${hours} saat önce`;
    return `${days} gün önce`;
  }
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  return `${days} day${days === 1 ? '' : 's'} ago`;
};

interface RowProps {
  item: NotificationItem;
  onPress: (item: NotificationItem) => void;
  onDelete: (id: string) => void;
  language: SupportedLanguage;
}

const SWIPE_THRESHOLD = 96;
const SWIPE_VELOCITY = 0.35;

const NotificationRow: React.FC<RowProps> = ({
  item,
  onPress,
  onDelete,
  language,
}) => {
  const { t } = useTranslation();
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const icon = ICON_BY_KIND[item.kind];

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, g) =>
          Math.abs(g.dx) > 8 && Math.abs(g.dy) < 16,
        onPanResponderMove: (_, g) => {
          if (g.dx < 0) translateX.setValue(Math.max(g.dx, -160));
        },
        onPanResponderRelease: (_, g) => {
          const shouldDelete =
            g.dx < -SWIPE_THRESHOLD || g.vx < -SWIPE_VELOCITY;
          if (shouldDelete) {
            Animated.parallel([
              Animated.timing(translateX, {
                toValue: -400,
                duration: 180,
                useNativeDriver: true,
              }),
              Animated.timing(opacity, {
                toValue: 0,
                duration: 180,
                useNativeDriver: true,
              }),
            ]).start(() => onDelete(item.id));
          } else {
            Animated.spring(translateX, {
              toValue: 0,
              useNativeDriver: true,
            }).start();
          }
        },
      }),
    [item.id, onDelete, translateX, opacity]
  );

  return (
    <View style={styles.rowWrap}>
      <View style={styles.deleteBg}>
        <Icon name="trash-outline" size={20} color={colors.white} />
        <Text style={styles.deleteLabel}>{t('common.delete')}</Text>
      </View>
      <Animated.View
        {...responder.panHandlers}
        style={[
          styles.rowCard,
          item.read ? styles.rowCardRead : styles.rowCardUnread,
          { transform: [{ translateX }], opacity },
        ]}
      >
        <Pressable
          onPress={() => onPress(item)}
          style={styles.rowInner}
          accessibilityRole="button"
        >
          {!item.read ? <View style={styles.unreadDot} /> : null}
          <View
            style={[
              styles.rowIcon,
              { backgroundColor: icon.soft },
            ]}
          >
            <Icon name={icon.icon} size={20} color={icon.tint} />
          </View>
          <View style={styles.rowBody}>
            <Text
              style={[
                styles.rowTitle,
                item.read ? styles.rowTitleRead : styles.rowTitleUnread,
              ]}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            <Text style={styles.rowSubtitle} numberOfLines={2}>
              {item.body}
            </Text>
            <Text style={styles.rowTime}>
              {formatTimeAgo(item.createdAt, language)}
            </Text>
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
};

export interface NotificationsScreenProps {
  onClose?: () => void;
}

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({
  onClose,
}) => {
  const { t } = useTranslation();
  const language = useUiStore((s) => s.language) as SupportedLanguage;

  const [items, setItems] = useState<NotificationItem[]>(() =>
    seedNotifications()
  );
  const [refreshing, setRefreshing] = useState(false);

  const sorted = useMemo(() => {
    // Unread first, newest within each group.
    const byRecency = (a: NotificationItem, b: NotificationItem): number =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    const unread = items.filter((i) => !i.read).sort(byRecency);
    const read = items.filter((i) => i.read).sort(byRecency);
    return [...unread, ...read];
  }, [items]);

  const unreadCount = useMemo(
    () => items.filter((i) => !i.read).length,
    [items]
  );

  useEffect(() => {
    // Placeholder for GET /api/notifications — no-op for now.
  }, []);

  const markAllRead = useCallback((): void => {
    setItems((prev) => prev.map((i) => ({ ...i, read: true })));
    // TODO: POST /api/notifications/mark-all-read
  }, []);

  const markOneRead = useCallback((id: string): void => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, read: true } : i))
    );
    // TODO: POST /api/notifications/:id/read
  }, []);

  const deleteOne = useCallback((id: string): void => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    // TODO: DELETE /api/notifications/:id
  }, []);

  const handlePress = useCallback(
    (item: NotificationItem): void => {
      markOneRead(item.id);
      // TODO: resolve deepLink → navigate to deal/invoice/meeting. Stub for now.
    },
    [markOneRead]
  );

  const onRefresh = useCallback((): void => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 700);
    // TODO: re-fetch via React Query when the endpoint exists.
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <Header
        title={t('notifications.title')}
        showBack={Boolean(onClose)}
        onBack={onClose}
        rightSlot={
          unreadCount > 0 ? (
            <Pressable
              onPress={markAllRead}
              accessibilityRole="button"
              style={styles.markAllBtn}
              hitSlop={8}
            >
              <Icon
                name="checkmark-done-outline"
                size={18}
                color={colors.textInverse}
              />
              <Text style={styles.markAllText}>
                {t('notifications.markAllRead')}
              </Text>
            </Pressable>
          ) : null
        }
      />

      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <NotificationRow
            item={item}
            onPress={handlePress}
            onDelete={deleteOne}
            language={language}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIllustration}>
              <Icon
                name="notifications-off-outline"
                size={56}
                color={colors.primary}
              />
            </View>
            <Text style={styles.emptyTitle}>
              {t('notifications.emptyTitle')}
            </Text>
            <Text style={styles.emptyBody}>
              {t('notifications.emptySubtitle')}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    padding: spacing.base,
    paddingBottom: spacing.xxxl,
    flexGrow: 1,
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  markAllText: {
    ...textStyles.label,
    color: colors.textInverse,
    fontWeight: '600',
  },
  rowWrap: {
    position: 'relative',
  },
  deleteBg: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 96,
    backgroundColor: colors.error,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    rowGap: 2,
  },
  deleteLabel: {
    ...textStyles.caption,
    color: colors.white,
    fontWeight: '700',
  },
  rowCard: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  rowCardUnread: {
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  rowCardRead: {
    backgroundColor: '#F9FAFB',
  },
  rowInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.base,
    columnGap: spacing.md,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginTop: 8,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: {
    flex: 1,
    rowGap: 2,
  },
  rowTitle: {
    ...textStyles.bodyMedium,
  },
  rowTitleUnread: {
    color: colors.textHeading,
    fontWeight: '700',
  },
  rowTitleRead: {
    color: colors.textSecondary,
    fontWeight: '500',
  },
  rowSubtitle: {
    ...textStyles.caption,
    color: colors.textSecondary,
  },
  rowTime: {
    ...textStyles.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.xxxl,
    rowGap: spacing.sm,
  },
  emptyIllustration: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    ...textStyles.h4,
    color: colors.textHeading,
  },
  emptyBody: {
    ...textStyles.body,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
});

export default NotificationsScreen;
