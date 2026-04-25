/**
 * AIFloatingButton — Floating Action Button (AI Sprint 2 §7).
 *
 * Sits in the bottom-right (bottom-left in RTL) above the bottom tab
 * bar and pulses softly to invite use. Tapping it fires haptic feedback
 * and opens the AI Command Center via the zustand store.
 *
 * The button is rendered by main-tab screens only — auth / onboarding
 * mount it via `RootNavigator`. The pulse loop is cancelled on unmount
 * to avoid the React Native "setState on unmounted component" warning.
 */

import React, { useEffect, useRef } from 'react';
import {
  Animated,
  I18nManager,
  Pressable,
  StyleSheet,
  Text,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { Icon } from '../common/Icon';
import {
  zyrixShadows,
  zyrixSpacing,
  zyrixTheme,
} from '../../theme/zyrixTheme';
import { useAIStore } from '../../store/aiStore';

const PULSE_DURATION = 2000;

export interface AIFloatingButtonProps {
  bottom?: number;
  hidden?: boolean;
}

export const AIFloatingButton: React.FC<AIFloatingButtonProps> = ({
  bottom = 88,
  hidden = false,
}) => {
  const openCommandCenter = useAIStore((s) => s.openCommandCenter);
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.08,
          duration: PULSE_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: PULSE_DURATION,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => {
      animation.stop();
    };
  }, [pulse]);

  if (hidden) return null;

  const handlePress = (): void => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {
      // haptics may be unavailable on some devices/emulators
    });
    openCommandCenter();
  };

  const positionStyle = I18nManager.isRTL
    ? { left: zyrixSpacing.lg, bottom }
    : { right: zyrixSpacing.lg, bottom };

  return (
    <Animated.View
      style={[styles.wrap, positionStyle, { transform: [{ scale: pulse }] }]}
      pointerEvents="box-none"
    >
      <Pressable
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel="Open AI Command Center"
        style={({ pressed }) => (pressed ? { opacity: 0.85 } : null)}
      >
        <LinearGradient
          colors={[zyrixTheme.primaryLight, zyrixTheme.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.button}
        >
          <Icon
            name="sparkles"
            size={26}
            color={zyrixTheme.textInverse}
            family="Ionicons"
          />
          <Text style={styles.label}>AI</Text>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    zIndex: 999,
    ...zyrixShadows.aiGlow,
  },
  button: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.55)',
  },
  label: {
    color: zyrixTheme.textInverse,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 2,
  },
});

export default AIFloatingButton;
