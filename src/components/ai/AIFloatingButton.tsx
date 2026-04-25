/**
 * AIFloatingButton — placeholder (AI Sprint 1, section 15).
 *
 * Future sprints render the sparkle-icon FAB that opens the command center.
 */

import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { zyrixShadows, zyrixSpacing, zyrixTheme } from '../../theme/zyrixTheme';

export interface AIFloatingButtonProps {
  onPress?: () => void;
}

export const AIFloatingButton: React.FC<AIFloatingButtonProps> = ({ onPress }) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel="Open AI"
    style={({ pressed }) => [styles.fab, pressed ? { opacity: 0.9 } : null]}
  >
    <Text style={styles.icon}>AI</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: zyrixSpacing.lg,
    bottom: zyrixSpacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: zyrixTheme.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...zyrixShadows.aiGlow,
  },
  icon: {
    color: zyrixTheme.textInverse,
    fontWeight: '800',
    fontSize: 14,
  },
});

export default AIFloatingButton;
