/**
 * QuickAddTile — single coloured tile inside the quick-add bottom sheet.
 *
 * Renders a 1:1 square with a tinted background (12% opacity of the
 * accent), the icon centered in the full accent colour, and a 2-line
 * label. Press scales briefly to 0.96 for a satisfying tap.
 */

import React, { useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';

import { Icon, type AnyIconName } from './common/Icon';
import { colors } from '../constants/colors';
import { radius } from '../constants/spacing';
import { textStyles } from '../constants/typography';

const tintBackground = (hex: string): string => {
  // Convert #RRGGBB to rgba(r,g,b,0.12)
  if (hex.length !== 7 || hex[0] !== '#') return hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, 0.12)`;
};

export interface QuickAddTileProps {
  icon: AnyIconName;
  label: string;
  accent: string;
  pinned?: boolean;
  onPress: () => void;
  onLongPress?: () => void;
  testID?: string;
}

export const QuickAddTile: React.FC<QuickAddTileProps> = ({
  icon,
  label,
  accent,
  pinned = false,
  onPress,
  onLongPress,
  testID,
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (value: number, duration: number): void => {
    Animated.timing(scale, {
      toValue: value,
      duration,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = (): void => {
    void Haptics.selectionAsync();
    onPress();
  };

  const handleLongPress = (): void => {
    if (!onLongPress) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onLongPress();
  };

  return (
    <Animated.View style={[styles.wrapper, { transform: [{ scale }] }]}>
      <Pressable
        onPress={handlePress}
        onLongPress={handleLongPress}
        delayLongPress={350}
        onPressIn={() => animateTo(0.96, 100)}
        onPressOut={() => animateTo(1, 120)}
        accessibilityRole="button"
        accessibilityLabel={label}
        testID={testID}
        style={[styles.tile, { backgroundColor: tintBackground(accent) }]}
      >
        <View style={styles.iconWrap}>
          <Icon name={icon} size={28} color={accent} />
        </View>
        <Text
          style={styles.label}
          numberOfLines={2}
          ellipsizeMode="tail"
          allowFontScaling
        >
          {label}
        </Text>
        {pinned ? (
          <View
            style={[styles.pinDot, { backgroundColor: accent }]}
            accessibilityElementsHidden
          />
        ) : null}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    aspectRatio: 1,
  },
  tile: {
    flex: 1,
    borderRadius: radius.lg,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...textStyles.caption,
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: 6,
  },
  pinDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export default QuickAddTile;
