/**
 * BarChart — horizontal bars, best for "deals by rep" / "revenue by
 * category" where labels want room. Bars are animated on mount.
 */

import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors } from '../../constants/colors';
import { radius, spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';
import { useCountryConfig } from '../../hooks/useCountryConfig';

export interface BarDatum {
  label: string;
  value: number;
  color?: string;
}

export interface BarChartProps {
  data: readonly BarDatum[];
  currency?: boolean;
  style?: StyleProp<ViewStyle>;
  barHeight?: number;
  title?: string;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  currency = false,
  style,
  barHeight = 14,
  title,
}) => {
  const { formatCurrency, formatNumber } = useCountryConfig();
  const progress = useRef(new Animated.Value(0)).current;

  const max = useMemo(() => {
    const vals = data.map((d) => d.value);
    return Math.max(...vals, 1);
  }, [data]);

  useEffect(() => {
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress, data]);

  const formatValue = (v: number): string =>
    currency ? formatCurrency(v) : formatNumber(v);

  return (
    <View style={[styles.container, style]}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {data.map((datum) => {
        const widthPct = `${Math.max((datum.value / max) * 100, 4)}%` as const;
        return (
          <View key={datum.label} style={styles.row}>
            <View style={styles.labelRow}>
              <Text style={styles.label} numberOfLines={1}>
                {datum.label}
              </Text>
              <Text style={styles.value}>{formatValue(datum.value)}</Text>
            </View>
            <View style={[styles.track, { height: barHeight }]}>
              <Animated.View
                style={[
                  styles.bar,
                  {
                    height: barHeight,
                    backgroundColor: datum.color ?? colors.primary,
                    width: progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', widthPct],
                    }),
                  },
                ]}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.base,
    rowGap: spacing.sm,
  },
  title: {
    ...textStyles.label,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  row: {
    rowGap: spacing.xs,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    ...textStyles.caption,
    color: colors.textSecondary,
    flex: 1,
  },
  value: {
    ...textStyles.caption,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  track: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  bar: {
    borderRadius: radius.pill,
  },
});

export default BarChart;
