/**
 * SkeletonCard — pulse-loading placeholder used while list data is in
 * flight. Uses `Animated` opacity instead of the shimmer gradient so it
 * stays dependency-free.
 */

import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors } from '../../constants/colors';
import { radius, spacing } from '../../constants/spacing';

export interface SkeletonCardProps {
  height?: number;
  style?: StyleProp<ViewStyle>;
  showAvatar?: boolean;
  lines?: number;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  height = 88,
  style,
  showAvatar = true,
  lines = 2,
}) => {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const opacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.55, 0.95],
  });

  return (
    <View style={[styles.card, { height }, style]}>
      {showAvatar ? (
        <Animated.View style={[styles.avatar, { opacity }]} />
      ) : null}
      <View style={styles.textColumn}>
        {Array.from({ length: lines }).map((_, idx) => (
          <Animated.View
            key={idx}
            style={[
              styles.line,
              idx === 0 ? styles.lineLong : styles.lineShort,
              { opacity },
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.base,
    marginBottom: spacing.sm,
    columnGap: spacing.base,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primarySoft,
  },
  textColumn: {
    flex: 1,
    rowGap: spacing.xs,
  },
  line: {
    height: 10,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
  },
  lineLong: { width: '75%' },
  lineShort: { width: '55%' },
});

export default SkeletonCard;
