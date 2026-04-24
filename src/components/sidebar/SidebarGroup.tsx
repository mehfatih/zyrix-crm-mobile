/**
 * SidebarGroup — uppercase, letter-spaced section header used to break
 * the SmartSidebar into "WORK / ENGAGE / GROW / SYSTEM" buckets.
 *
 * Renders a thin slate-200 separator above the label so groups feel
 * structured without painting heavy chrome onto the sidebar.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';

export interface SidebarGroupProps {
  label: string;
  children: React.ReactNode;
}

export const SidebarGroup: React.FC<SidebarGroupProps> = ({
  label,
  children,
}) => (
  <View style={styles.group}>
    <View style={styles.divider} />
    <Text style={styles.label}>{label}</Text>
    <View style={styles.items}>{children}</View>
  </View>
);

const styles = StyleSheet.create({
  group: {
    marginTop: spacing.lg,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginHorizontal: spacing.base,
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    color: colors.textMuted,
    textTransform: 'uppercase',
    paddingHorizontal: spacing.base,
    marginBottom: spacing.xs,
  },
  items: {
    rowGap: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
});

export default SidebarGroup;
