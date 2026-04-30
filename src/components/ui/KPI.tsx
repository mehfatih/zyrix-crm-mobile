import React, { ReactNode } from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { darkColors, accents, type AccentColor, spacing, radius, typography } from '../../theme/dark';

type KPIProps = {
  label: string;
  value: string | number;
  delta?: { value: string; positive?: boolean };
  accent: AccentColor;
  icon?: ReactNode;
  style?: ViewStyle;
};

export function KPI({ label, value, delta, accent, icon, style }: KPIProps) {
  const shade = accents[accent];

  return (
    <View
      style={[
        styles.tile,
        { backgroundColor: shade.bgSoft, borderColor: shade.border },
        style,
      ]}
    >
      <View style={styles.header}>
        <Text style={styles.label} numberOfLines={1}>{label}</Text>
        {icon && <View>{icon}</View>}
      </View>

      <Text style={[styles.value, { color: shade.text }]} numberOfLines={1}>
        {value}
      </Text>

      {delta && (
        <Text
          style={[
            styles.delta,
            { color: delta.positive ? darkColors.success : darkColors.error },
          ]}
        >
          {delta.value}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minHeight: 100,
    padding: spacing.base,
    borderRadius: radius.lg,
    borderWidth: 1,
    justifyContent: 'space-between',
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: {
    color: darkColors.textMuted,
    fontSize: typography.size.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: typography.size['3xl'],
    fontWeight: '700',
    marginTop: 8,
  },
  delta: { fontSize: typography.size.xs, fontWeight: '600', marginTop: 4 },
});
