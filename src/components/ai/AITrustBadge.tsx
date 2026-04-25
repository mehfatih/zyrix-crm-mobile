/**
 * AITrustBadge — placeholder (AI Sprint 1, section 15).
 *
 * Future sprints render the trust/confidence badge that appears next to
 * AI-generated content.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { zyrixRadius, zyrixSpacing, zyrixTheme } from '../../theme/zyrixTheme';

export interface AITrustBadgeProps {
  confidence?: number;
  label?: string;
}

export const AITrustBadge: React.FC<AITrustBadgeProps> = ({
  confidence = 0,
  label = 'AI',
}) => (
  <View style={styles.root}>
    <Text style={styles.label}>
      {label} · {Math.round(confidence * 100)}%
    </Text>
  </View>
);

const styles = StyleSheet.create({
  root: {
    alignSelf: 'flex-start',
    paddingHorizontal: zyrixSpacing.sm,
    paddingVertical: 2,
    borderRadius: zyrixRadius.pill,
    backgroundColor: zyrixTheme.aiSurface,
    borderWidth: 1,
    borderColor: zyrixTheme.aiBorder,
  },
  label: {
    color: zyrixTheme.primaryDark,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

export default AITrustBadge;
