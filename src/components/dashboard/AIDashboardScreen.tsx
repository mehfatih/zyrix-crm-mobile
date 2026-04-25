/**
 * AIDashboardScreen — placeholder (AI Sprint 1, section 15).
 *
 * Future sprints replace this with the AI-first dashboard: priority
 * card stack, smart stat cards, revenue brain summary.
 */

import React from 'react';
import { StyleSheet, Text } from 'react-native';

import { AppScreen } from '../layout/AppScreen';
import { zyrixSpacing, zyrixTheme } from '../../theme/zyrixTheme';

export const AIDashboardScreen: React.FC = () => (
  <AppScreen>
    <Text style={styles.title}>AI Dashboard</Text>
    <Text style={styles.body}>Coming in a later sprint.</Text>
  </AppScreen>
);

const styles = StyleSheet.create({
  title: {
    color: zyrixTheme.textHeading,
    fontSize: 24,
    fontWeight: '800',
    padding: zyrixSpacing.lg,
  },
  body: {
    color: zyrixTheme.textMuted,
    paddingHorizontal: zyrixSpacing.lg,
  },
});

export default AIDashboardScreen;
