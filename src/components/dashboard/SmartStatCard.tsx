/**
 * SmartStatCard — placeholder (AI Sprint 1, section 15).
 *
 * Future sprints render a stat tile with AI-derived delta / insight.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { zyrixRadius, zyrixShadows, zyrixSpacing, zyrixTheme } from '../../theme/zyrixTheme';

export interface SmartStatCardProps {
  label?: string;
  value?: string;
  insight?: string;
}

export const SmartStatCard: React.FC<SmartStatCardProps> = ({
  label = 'Stat',
  value = '—',
  insight,
}) => (
  <View style={styles.root}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value}</Text>
    {insight ? <Text style={styles.insight}>{insight}</Text> : null}
  </View>
);

const styles = StyleSheet.create({
  root: {
    backgroundColor: zyrixTheme.cardBg,
    borderRadius: zyrixRadius.lg,
    padding: zyrixSpacing.base,
    borderWidth: 1,
    borderColor: zyrixTheme.cardBorder,
    ...zyrixShadows.card,
  },
  label: {
    color: zyrixTheme.textMuted,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    color: zyrixTheme.textHeading,
    fontSize: 24,
    fontWeight: '800',
    marginTop: zyrixSpacing.xs,
  },
  insight: {
    color: zyrixTheme.primary,
    fontSize: 12,
    marginTop: zyrixSpacing.xs,
  },
});

export default SmartStatCard;
