/**
 * TabBar — a custom bottom tab bar rendered by React Navigation's
 * BottomTabs via the `tabBar` prop.
 *
 * Up to 5 slots. Each tab is a `BottomTabBarButtonItem` with an icon,
 * label, and optional notification badge. The active color is cyan,
 * inactive tabs are muted gray.
 */

import React, { useMemo } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

import { colors } from '../../constants/colors';
import { hitSlop, layout, radius, shadows, spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';
import { Icon, type AnyIconName, type IconFamily } from './Icon';

const MAX_SLOTS = 5;

export interface TabSlotDescriptor {
  /** Icon name passed to Icon */
  icon: AnyIconName;
  iconFamily?: IconFamily;
  /** Optional separate icon for the active (focused) state. */
  iconFocused?: AnyIconName;
  /** Visible label (already translated). */
  label: string;
  /** Numeric badge to render in the corner of the icon. */
  badge?: number;
  /** Accessible label, falls back to `label` if omitted. */
  accessibilityLabel?: string;
}

export type TabBarSlotResolver = (
  routeName: string,
  focused: boolean
) => TabSlotDescriptor;

export interface TabBarProps extends BottomTabBarProps {
  /** Maps a navigation route name + focus state to a visual descriptor. */
  getSlot: TabBarSlotResolver;
  style?: StyleProp<ViewStyle>;
}

export const TabBar: React.FC<TabBarProps> = ({
  state,
  descriptors,
  navigation,
  getSlot,
  style,
}) => {
  const routes = useMemo(
    () => state.routes.slice(0, MAX_SLOTS),
    [state.routes]
  );

  return (
    <SafeAreaView
      edges={['bottom']}
      style={[styles.safe, style]}
    >
      <View style={styles.bar}>
        {routes.map((route, index) => {
          const focused = state.index === index;
          const slot = getSlot(route.name, focused);
          const { options } = descriptors[route.key];

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          const iconName = focused ? slot.iconFocused ?? slot.icon : slot.icon;
          const tint = focused ? colors.primary : colors.textMuted;

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              accessibilityLabel={
                options.tabBarAccessibilityLabel ??
                slot.accessibilityLabel ??
                slot.label
              }
              testID={options.tabBarButtonTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              hitSlop={hitSlop.sm}
              style={({ pressed }) => [
                styles.slot,
                pressed ? styles.slotPressed : null,
              ]}
            >
              <View style={styles.iconWrap}>
                <Icon
                  name={iconName}
                  family={slot.iconFamily}
                  size={24}
                  color={tint}
                />
                {slot.badge && slot.badge > 0 ? (
                  <View style={styles.badge}>
                    <Text numberOfLines={1} style={styles.badgeText}>
                      {slot.badge > 99 ? '99+' : String(slot.badge)}
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text
                numberOfLines={1}
                style={[
                  textStyles.caption,
                  styles.label,
                  { color: tint },
                  focused ? styles.labelFocused : null,
                ]}
              >
                {slot.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    backgroundColor: colors.surface,
  },
  bar: {
    flexDirection: 'row',
    minHeight: layout.tabBarHeight,
    paddingHorizontal: spacing.xs,
    paddingTop: spacing.xs,
    paddingBottom: Platform.OS === 'android' ? spacing.xs : 0,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
    ...shadows.sm,
  },
  slot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
  },
  slotPressed: {
    backgroundColor: colors.overlay,
  },
  iconWrap: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    marginTop: 2,
  },
  labelFocused: {
    fontWeight: '600',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: colors.textInverse,
    fontSize: 10,
    fontWeight: '700',
  },
});

export default TabBar;
