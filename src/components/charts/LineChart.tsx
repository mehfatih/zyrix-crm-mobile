/**
 * LineChart — minimal SVG line chart tuned for Zyrix's cyan theme.
 *
 * Uses `react-native-svg` directly rather than `victory-native` so we
 * keep control over RTL/formatting details. Renders a smooth (cubic
 * Bézier) line with a soft cyan fill below it. Y-axis values are
 * formatted via `useCountryConfig.formatCurrency` when `currency` is
 * truthy; otherwise they fall back to locale numbers.
 */

import React, { useState } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';
import { useCountryConfig } from '../../hooks/useCountryConfig';

export interface LinePoint {
  x: string;
  y: number;
}

export interface LineChartProps {
  data: readonly LinePoint[];
  title?: string;
  color?: string;
  currency?: boolean;
  height?: number;
}

const CHART_PADDING = { top: 12, right: 12, bottom: 28, left: 44 };

const buildSmoothPath = (
  points: { x: number; y: number }[]
): string => {
  if (points.length === 0) return '';
  if (points.length === 1) {
    const p = points[0] as { x: number; y: number };
    return `M ${p.x} ${p.y}`;
  }
  const first = points[0] as { x: number; y: number };
  let d = `M ${first.x} ${first.y}`;
  for (let i = 1; i < points.length; i += 1) {
    const prev = points[i - 1] as { x: number; y: number };
    const curr = points[i] as { x: number; y: number };
    const midX = (prev.x + curr.x) / 2;
    d += ` C ${midX} ${prev.y}, ${midX} ${curr.y}, ${curr.x} ${curr.y}`;
  }
  return d;
};

export const LineChart: React.FC<LineChartProps> = ({
  data,
  title,
  color = colors.primary,
  currency = false,
  height = 200,
}) => {
  const { formatCurrency, formatNumber } = useCountryConfig();
  const [width, setWidth] = useState(0);

  const onLayout = (event: LayoutChangeEvent): void => {
    setWidth(event.nativeEvent.layout.width);
  };

  const formatValue = (v: number): string =>
    currency ? formatCurrency(v) : formatNumber(v);

  if (data.length === 0) {
    return (
      <View style={[styles.container, { height }]}>
        {title ? <Text style={styles.title}>{title}</Text> : null}
        <View style={styles.empty}>
          <Text style={styles.emptyText}>—</Text>
        </View>
      </View>
    );
  }

  const values = data.map((d) => d.y);
  const maxY = Math.max(...values, 1);
  const minY = Math.min(...values, 0);
  const range = maxY - minY || 1;

  const innerWidth = Math.max(width - CHART_PADDING.left - CHART_PADDING.right, 0);
  const innerHeight = height - CHART_PADDING.top - CHART_PADDING.bottom;

  const xStep = data.length > 1 ? innerWidth / (data.length - 1) : innerWidth;

  const points = data.map((point, index) => ({
    x: CHART_PADDING.left + index * xStep,
    y:
      CHART_PADDING.top +
      innerHeight -
      ((point.y - minY) / range) * innerHeight,
  }));

  const smooth = buildSmoothPath(points);
  const lastPoint = points[points.length - 1] as { x: number; y: number };
  const firstPoint = points[0] as { x: number; y: number };
  const area = `${smooth} L ${lastPoint.x} ${CHART_PADDING.top + innerHeight} L ${firstPoint.x} ${CHART_PADDING.top + innerHeight} Z`;

  return (
    <View style={styles.container} onLayout={onLayout}>
      {title ? <Text style={styles.title}>{title}</Text> : null}

      {width > 0 ? (
        <Svg width={width} height={height} accessibilityLabel={title}>
          <Defs>
            <LinearGradient id="zyrixLineFill" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={color} stopOpacity={0.28} />
              <Stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </LinearGradient>
          </Defs>
          <Path d={area} fill="url(#zyrixLineFill)" />
          <Path
            d={smooth}
            stroke={color}
            strokeWidth={2.5}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      ) : null}

      <View style={styles.axisRow}>
        {data.map((point) => (
          <Text key={point.x} style={styles.axisLabel} numberOfLines={1}>
            {point.x}
          </Text>
        ))}
      </View>

      <View style={styles.rangeRow}>
        <Text style={styles.axisLabel}>{formatValue(minY)}</Text>
        <Text style={styles.axisLabel}>{formatValue(maxY)}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.base,
    rowGap: spacing.xs,
  },
  title: {
    ...textStyles.label,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  empty: {
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    ...textStyles.h3,
    color: colors.textMuted,
  },
  axisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: CHART_PADDING.left,
    marginTop: -spacing.xs,
  },
  rangeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  axisLabel: {
    ...textStyles.caption,
    color: colors.textMuted,
  },
});

export default LineChart;
