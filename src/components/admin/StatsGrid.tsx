/**
 * StatsGrid — responsive grid of stat cards used by admin dashboards.
 * Each cell shows a label, an icon, a primary value, and an optional
 * trend percentage. Layout: 2 columns on phones, 3 on tablets.
 */

import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { Icon, type AnyIconName } from '../common/Icon';
import { colors } from '../../constants/colors';
import { radius, shadows, spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';

export interface StatsGridItem {
  key: string;
  label: string;
  value: React.ReactNode;
  icon: AnyIconName;
  tone?: string;
  trend?: number;
}

export interface StatsGridProps {
  items: readonly StatsGridItem[];
  style?: StyleProp<ViewStyle>;
}

export const StatsGrid: React.FC<StatsGridProps> = ({ items, style }) => (
  <View style={[styles.grid, style]}>
    {items.map((item) => (
      <View key={item.key} style={styles.card}>
        <View
          style={[
            styles.iconCircle,
            {
              backgroundColor: `${item.tone ?? colors.primary}1A`,
            },
          ]}
        >
          <Icon
            name={item.icon}
            size={20}
            color={item.tone ?? colors.primary}
          />
        </View>
        <Text style={styles.label} numberOfLines={1}>
          {item.label}
        </Text>
        {typeof item.value === 'string' || typeof item.value === 'number' ? (
          <Text style={[styles.value, { color: item.tone ?? colors.primaryDark }]}>
            {item.value}
          </Text>
        ) : (
          <View style={styles.valueWrap}>{item.value}</View>
        )}
        {typeof item.trend === 'number' ? (
          <View style={styles.trendRow}>
            <Icon
              name={item.trend >= 0 ? 'arrow-up' : 'arrow-down'}
              size={12}
              color={item.trend >= 0 ? colors.success : colors.error}
            />
            <Text
              style={[
                styles.trendText,
                { color: item.trend >= 0 ? colors.success : colors.error },
              ]}
            >
              {`${Math.abs(item.trend)}%`}
            </Text>
          </View>
        ) : null}
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  card: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: colors.surface,
    padding: spacing.base,
    borderRadius: radius.lg,
    rowGap: spacing.xs,
    minWidth: 150,
    ...shadows.xs,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...textStyles.caption,
    color: colors.textMuted,
  },
  value: {
    ...textStyles.h2,
    fontWeight: '800',
  },
  valueWrap: {
    minHeight: 28,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 4,
  },
  trendText: {
    ...textStyles.caption,
    fontWeight: '700',
  },
});

export default StatsGrid;
