/**
 * AIPriorityCard — placeholder (AI Sprint 1, section 15).
 *
 * Future sprints render a priority action suggested by the decision engine.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { zyrixRadius, zyrixShadows, zyrixSpacing, zyrixTheme } from '../../theme/zyrixTheme';

export interface AIPriorityCardProps {
  title?: string;
  reason?: string;
}

export const AIPriorityCard: React.FC<AIPriorityCardProps> = ({
  title = 'Priority action',
  reason = 'Placeholder reason',
}) => (
  <View style={styles.root}>
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.reason}>{reason}</Text>
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
    fontSize: 16,
    fontWeight: '700',
  },
  reason: {
    color: zyrixTheme.textMuted,
    marginTop: zyrixSpacing.xs,
  },
});

export default AIPriorityCard;
