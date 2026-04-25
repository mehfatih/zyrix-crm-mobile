/**
 * AIAgentCard — placeholder (AI Sprint 1, section 15).
 *
 * Future sprints render a single agent's status, permission level, and
 * last action/output.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { zyrixRadius, zyrixShadows, zyrixSpacing, zyrixTheme } from '../../theme/zyrixTheme';

export interface AIAgentCardProps {
  name?: string;
  role?: string;
}

export const AIAgentCard: React.FC<AIAgentCardProps> = ({
  name = 'Agent',
  role = 'placeholder',
}) => (
  <View style={styles.root}>
    <Text style={styles.name}>{name}</Text>
    <Text style={styles.role}>{role}</Text>
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
  name: {
    color: zyrixTheme.textHeading,
    fontSize: 16,
    fontWeight: '700',
  },
  role: {
    color: zyrixTheme.textMuted,
    marginTop: zyrixSpacing.xs,
  },
});

export default AIAgentCard;
