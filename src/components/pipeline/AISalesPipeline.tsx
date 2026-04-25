/**
 * AISalesPipeline — placeholder (AI Sprint 1, section 15).
 *
 * Future sprints render the AI-augmented kanban pipeline with risk/opp
 * signals on each deal card.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { zyrixSpacing, zyrixTheme } from '../../theme/zyrixTheme';

export const AISalesPipeline: React.FC = () => (
  <View style={styles.root}>
    <Text style={styles.title}>AI Sales Pipeline</Text>
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

export default AISalesPipeline;
