/**
 * PieChart — SVG-only pie with a legend. Supports drill-down by firing
 * `onSlicePress(slice)` when a segment is tapped.
 */

import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { G, Path } from 'react-native-svg';

import { colors } from '../../constants/colors';
import { radius, spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';

export interface PieSlice {
  label: string;
  value: number;
  color?: string;
}

export interface PieChartProps {
  data: readonly PieSlice[];
  size?: number;
  title?: string;
  onSlicePress?: (slice: PieSlice) => void;
}

const DEFAULT_PALETTE: readonly string[] = [
  colors.primary,
  colors.primaryDark,
  colors.primaryLight,
  colors.info,
  colors.success,
  colors.warning,
  colors.error,
];

const polarToCartesian = (
  cx: number,
  cy: number,
  radius: number,
  angleRad: number
): { x: number; y: number } => ({
  x: cx + radius * Math.cos(angleRad),
  y: cy + radius * Math.sin(angleRad),
});

const arcPath = (
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number
): string => {
  const start = polarToCartesian(cx, cy, radius, startAngle);
  const end = polarToCartesian(cx, cy, radius, endAngle);
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  return [
    `M ${cx} ${cy}`,
    `L ${start.x} ${start.y}`,
    `A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`,
    'Z',
  ].join(' ');
};

export const PieChart: React.FC<PieChartProps> = ({
  data,
  size = 180,
  title,
  onSlicePress,
}) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (total === 0) {
    return (
      <View style={styles.container}>
        {title ? <Text style={styles.title}>{title}</Text> : null}
        <Text style={styles.empty}>—</Text>
      </View>
    );
  }

  const cx = size / 2;
  const cy = size / 2;
  const radiusValue = size / 2 - 4;

  let cursor = -Math.PI / 2;
  const slices = data.map((slice, index) => {
    const share = slice.value / total;
    const start = cursor;
    const end = cursor + share * Math.PI * 2;
    cursor = end;
    return {
      ...slice,
      color: slice.color ?? DEFAULT_PALETTE[index % DEFAULT_PALETTE.length],
      path: arcPath(cx, cy, radiusValue, start, end),
      sharePct: Math.round(share * 100),
    };
  });

  return (
    <View style={styles.container}>
      {title ? <Text style={styles.title}>{title}</Text> : null}

      <View style={styles.body}>
        <Svg width={size} height={size} accessibilityLabel={title}>
          <G>
            {slices.map((slice, index) => (
              <Path
                key={`${slice.label}-${index}`}
                d={slice.path}
                fill={slice.color}
                opacity={activeIndex === null || activeIndex === index ? 1 : 0.4}
                onPressIn={() => setActiveIndex(index)}
                onPressOut={() => setActiveIndex(null)}
              />
            ))}
          </G>
        </Svg>

        <View style={styles.legend}>
          {slices.map((slice, index) => (
            <Pressable
              key={`${slice.label}-legend-${index}`}
              onPress={() => onSlicePress?.(slice)}
              style={styles.legendRow}
              accessibilityRole="button"
            >
              <View
                style={[styles.legendSwatch, { backgroundColor: slice.color }]}
              />
              <Text style={styles.legendLabel} numberOfLines={1}>
                {slice.label}
              </Text>
              <Text style={styles.legendPct}>{`${slice.sharePct}%`}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.base,
  },
  title: {
    ...textStyles.label,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.base,
  },
  legend: {
    flex: 1,
    rowGap: spacing.xs,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.sm,
  },
  legendSwatch: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendLabel: {
    flex: 1,
    ...textStyles.caption,
    color: colors.textPrimary,
  },
  legendPct: {
    ...textStyles.caption,
    color: colors.textMuted,
    fontWeight: '600',
  },
  empty: {
    ...textStyles.h3,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
});

export default PieChart;
