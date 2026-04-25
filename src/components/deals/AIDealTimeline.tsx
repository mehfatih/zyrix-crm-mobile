/**
 * AIDealTimeline — placeholder (AI Sprint 1, section 15).
 *
 * Future sprints render the per-deal timeline with AI-inferred stage
 * transitions, risk flags, and next-step recommendations.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { zyrixSpacing, zyrixTheme } from '../../theme/zyrixTheme';

export const AIDealTimeline: React.FC = () => (
  <View style={styles.root}>
    <Text style={styles.title}>AI Deal Timeline</Text>
    <Text style={styles.body}>Coming in a later sprint.</Text>
  </View>
);

const styles = StyleSheet.create({
  root: {
    padding: zyrixSpacing.lg,
  },
  title: {
    color: zyrixTheme.textHeading,
    fontSize: 20,
    fontWeight: '800',
  },
  body: {
    color: zyrixTheme.textMuted,
    marginTop: zyrixSpacing.xs,
  },
});

export default AIDealTimeline;
