/**
 * QuickAddSheet — bottom-sheet modal triggered by the "+" header icon.
 *
 * Renders a 4×3 grid of vibrant accent tiles for the most common create
 * actions. Tile order is driven by `quickAddUsageTracker` (pinned first,
 * then by recent + total usage). Long-pressing a tile toggles its pin.
 *
 * Spring-opens from the bottom, has a swipe-down + overlay-tap close,
 * and a full-width Cancel pill at the foot.
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

import { QuickAddTile } from './QuickAddTile';
import type { AnyIconName } from './common/Icon';
import { colors } from '../constants/colors';
import { radius, shadows, spacing } from '../constants/spacing';
import { textStyles } from '../constants/typography';
import { useToast } from '../hooks/useToast';
import {
  QUICK_ADD_TILE_KEYS,
  type QuickAddTileKey,
  getSortedTiles,
  recordUsage,
  togglePin,
} from '../services/quickAddUsageTracker';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = Math.round(SCREEN_HEIGHT * 0.65);

interface TileMeta {
  key: QuickAddTileKey;
  icon: AnyIconName;
  accent: string;
}

const TILE_META: Record<QuickAddTileKey, TileMeta> = {
  contact: { key: 'contact', icon: 'person-add-outline', accent: colors.mint },
  company: { key: 'company', icon: 'business-outline', accent: colors.sky },
  deal: { key: 'deal', icon: 'briefcase-outline', accent: colors.coral },
  task: { key: 'task', icon: 'checkbox-outline', accent: colors.lavender },
  ticket: { key: 'ticket', icon: 'help-buoy-outline', accent: colors.rose },
  email: { key: 'email', icon: 'mail-outline', accent: colors.peach },
  note: { key: 'note', icon: 'create-outline', accent: colors.sunshine },
  meeting: { key: 'meeting', icon: 'calendar-outline', accent: colors.teal },
  campaign: { key: 'campaign', icon: 'megaphone-outline', accent: colors.coral },
  segment: { key: 'segment', icon: 'people-outline', accent: colors.lavender },
  scanQR: { key: 'scanQR', icon: 'qr-code-outline', accent: colors.mint },
  voiceNote: {
    key: 'voiceNote',
    icon: 'mic-outline',
    accent: colors.peach,
  },
};

interface NavRoute {
  parent: string;
  screen: string;
}

const NAV_TARGETS: Partial<Record<QuickAddTileKey, NavRoute>> = {
  contact: { parent: 'SalesTab', screen: 'NewCustomer' },
  company: { parent: 'SalesTab', screen: 'NewCustomer' },
  deal: { parent: 'SalesTab', screen: 'NewDeal' },
  campaign: { parent: 'GrowthTab', screen: 'NewCampaign' },
  segment: { parent: 'GrowthTab', screen: 'Campaigns' },
};

export interface QuickAddSheetProps {
  visible: boolean;
  onClose: () => void;
  /**
   * Optional override invoked after the sheet starts closing — lets the
   * dashboard open a modal screen (Scan / VoiceNote) rather than navigating.
   */
  onTileSelect?: (key: QuickAddTileKey) => boolean | void;
}

export const QuickAddSheet: React.FC<QuickAddSheetProps> = ({
  visible,
  onClose,
  onTileSelect,
}) => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const toast = useToast();

  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  const [order, setOrder] = useState<QuickAddTileKey[]>(
    QUICK_ADD_TILE_KEYS.slice()
  );
  const [pinned, setPinned] = useState<ReadonlySet<QuickAddTileKey>>(
    new Set()
  );

  const refreshOrder = useCallback(async () => {
    const sorted = await getSortedTiles();
    setOrder(sorted.order);
    setPinned(sorted.pinned);
  }, []);

  useEffect(() => {
    if (!visible) return;
    void refreshOrder();
    void Haptics.selectionAsync();
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        damping: 15,
        stiffness: 180,
        mass: 1,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible, translateY, overlayOpacity, refreshOrder]);

  const close = useCallback(
    (afterClose?: () => void): void => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: SHEET_HEIGHT,
          duration: 220,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 200,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start(() => {
        onClose();
        afterClose?.();
      });
    },
    [translateY, overlayOpacity, onClose]
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dy) > 6 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
        onPanResponderMove: (_, gesture) => {
          if (gesture.dy > 0) {
            translateY.setValue(gesture.dy);
          }
        },
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dy > 100 || gesture.vy > 0.6) {
            close();
          } else {
            Animated.spring(translateY, {
              toValue: 0,
              damping: 15,
              stiffness: 180,
              useNativeDriver: true,
            }).start();
          }
        },
      }),
    [translateY, close]
  );

  const onTilePress = useCallback(
    (key: QuickAddTileKey): void => {
      void recordUsage(key);
      const handled = onTileSelect?.(key) === true;
      const target = NAV_TARGETS[key];
      close(() => {
        if (handled) return;
        if (!target) return;
        try {
          (navigation as unknown as {
            navigate: (route: string, params?: unknown) => void;
          }).navigate(target.parent, { screen: target.screen });
        } catch {
          // ignore — route may not be wired yet
        }
      });
    },
    [close, navigation, onTileSelect]
  );

  const onTileLongPress = useCallback(
    async (key: QuickAddTileKey): Promise<void> => {
      const nowPinned = await togglePin(key);
      await refreshOrder();
      toast.info(t(nowPinned ? 'quickAdd.pinned' : 'quickAdd.unpinned'));
    },
    [refreshOrder, toast, t]
  );

  const onCancel = useCallback((): void => {
    void Haptics.selectionAsync();
    close();
  }, [close]);

  const rows = useMemo<QuickAddTileKey[][]>(() => {
    const out: QuickAddTileKey[][] = [];
    for (let i = 0; i < order.length; i += 4) {
      out.push(order.slice(i, i + 4));
    }
    return out;
  }, [order]);

  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      animationType="none"
      onRequestClose={() => close()}
    >
      {Platform.OS === 'android' ? (
        <StatusBar
          barStyle="light-content"
          backgroundColor="rgba(0,0,0,0.45)"
        />
      ) : null}
      <View style={styles.root}>
        <Animated.View
          style={[styles.overlay, { opacity: overlayOpacity }]}
          pointerEvents={visible ? 'auto' : 'none'}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={() => close()} />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            { height: SHEET_HEIGHT, transform: [{ translateY }] },
          ]}
          {...panResponder.panHandlers}
        >
          <View style={styles.handle} />

          <Text style={styles.title}>{t('quickAdd.title')}</Text>

          <View style={styles.grid}>
            {rows.map((row, rowIdx) => (
              <View key={`row-${rowIdx}`} style={styles.row}>
                {row.map((key) => {
                  const meta = TILE_META[key];
                  return (
                    <QuickAddTile
                      key={key}
                      icon={meta.icon}
                      accent={meta.accent}
                      label={t(`quickAdd.tiles.${key}`)}
                      pinned={pinned.has(key)}
                      onPress={() => onTilePress(key)}
                      onLongPress={() => {
                        void onTileLongPress(key);
                      }}
                      testID={`quick-add-tile-${key}`}
                    />
                  );
                })}
                {row.length < 4
                  ? Array.from({ length: 4 - row.length }).map((_, i) => (
                      <View
                        key={`spacer-${rowIdx}-${i}`}
                        style={styles.tileSpacer}
                      />
                    ))
                  : null}
              </View>
            ))}
          </View>

          <Text style={styles.hint} numberOfLines={1}>
            {t('quickAdd.hint')}
          </Text>

          <Pressable
            onPress={onCancel}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.cancel,
              pressed ? { opacity: 0.85 } : null,
            ]}
          >
            <Text style={styles.cancelText}>{t('quickAdd.cancel')}</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: 12,
    ...shadows.xl,
  },
  handle: {
    width: 48,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.borderStrong,
    alignSelf: 'center',
    marginTop: 12,
  },
  title: {
    ...textStyles.h3,
    fontSize: 22,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 28,
  },
  grid: {
    paddingHorizontal: 16,
    rowGap: 12,
  },
  row: {
    flexDirection: 'row',
    columnGap: 12,
  },
  tileSpacer: {
    flex: 1,
    aspectRatio: 1,
  },
  hint: {
    ...textStyles.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.base,
    marginHorizontal: spacing.base,
  },
  cancel: {
    height: 56,
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    marginHorizontal: 16,
    marginTop: spacing.base,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
});

export default QuickAddSheet;
