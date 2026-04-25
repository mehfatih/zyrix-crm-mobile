/**
 * AICommandCenter — placeholder (AI Sprint 1, section 15).
 *
 * Future sprints replace this with the full modal overlay that houses
 * ranked actions, agent status, and natural-language command input.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { zyrixRadius, zyrixShadows, zyrixSpacing, zyrixTheme } from '../../theme/zyrixTheme';

export const AICommandCenter: React.FC = () => (
  <View style={styles.root}>
    <Text style={styles.title}>AI Command Center</Text>
    <Text style={styles.body}>Coming in a later sprint.</Text>
  </View>
);

const styles = StyleSheet.create({
  root: {
    backgroundColor: zyrixTheme.cardBg,
    borderRadius: zyrixRadius.xl,
    padding: zyrixSpacing.lg,
    borderWidth: 1,
    borderColor: zyrixTheme.cardBorder,
    ...zyrixShadows.card,
  },
  title: {
    color: zyrixTheme.textHeading,
    fontSize: 18,
    fontWeight: '700',
  },
  body: {
    color: zyrixTheme.textMuted,
    marginTop: zyrixSpacing.xs,
  },
});

export default AICommandCenter;
