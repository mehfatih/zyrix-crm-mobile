import React, { ReactNode } from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { darkColors, spacing, typography } from '../../theme/dark';

type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  body?: string;
  cta?: ReactNode;
  style?: ViewStyle;
};

export function EmptyState({ icon, title, body, cta, style }: EmptyStateProps) {
  return (
    <View style={[styles.root, style]}>
      {icon && <View style={styles.icon}>{icon}</View>}
      <Text style={styles.title}>{title}</Text>
      {body && <Text style={styles.body}>{body}</Text>}
      {cta && <View style={styles.cta}>{cta}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xxl, paddingHorizontal: spacing.lg },
  icon: { marginBottom: spacing.base, opacity: 0.5 },
  title: {
    color: darkColors.textPrimary,
    fontSize: typography.size.lg,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  body: {
    color: darkColors.textMuted,
    fontSize: typography.size.sm,
    textAlign: 'center',
    maxWidth: 320,
  },
  cta: { marginTop: spacing.lg },
});
