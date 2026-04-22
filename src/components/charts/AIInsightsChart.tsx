/**
 * AIInsightsChart — thin wrapper on `LineChart` that overlays
 * AI-highlighted annotations ("Unusual drop on March 15") as dots +
 * badge callouts. Reuses the existing chart primitives to keep the
 * rendering code small.
 */

import React, { useMemo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { colors } from '../../constants/colors';
import { radius, shadows, spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';
import { useCountryConfig } from '../../hooks/useCountryConfig';

export interface AIInsightsChartAnnotation {
  x: string;
  note: string;
  tone?: 'warning' | 'success' | 'info' | 'critical';
}

export interface AIInsightsChartPoint {
  x: string;
  y: number;
}

export interface AIInsightsChartProps {
  data: readonly AIInsightsChartPoint[];
  annotations?: readonly AIInsightsChartAnnotation[];
  title?: string;
  currency?: boolean;
  height?: number;
}

const PADDING = { top: 14, right: 14, bottom: 30, left: 48 };

const TONE_COLOR = (
  tone: AIInsightsChartAnnotation['tone'] = 'info'
): string => {
  switch (tone) {
    case 'warning':
      return colors.warning;
    case 'success':
      return colors.success;
    case 'critical':
      return colors.error;
    case 'info':
    default:
      return colors.primary;
  }
};

const buildSmoothPath = (points: { x: number; y: number }[]): string => {
  if (points.length === 0) return '';
  if (points.length === 1) {
    const first = points[0] as { x: number; y: number };
    return `M ${first.x} ${first.y}`;
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

export const AIInsightsChart: React.FC<AIInsightsChartProps> = ({
  data,
  annotations = [],
  title,
  currency = false,
  height = 220,
}) => {
  const { formatCurrency, formatNumber } = useCountryConfig();
  const [width, setWidth] = useState(0);
  const [activeAnnotation, setActiveAnnotation] = useState<string | null>(null);

  const onLayout = (event: LayoutChangeEvent): void => {
    setWidth(event.nativeEvent.layout.width);
  };

  const values = data.map((d) => d.y);
  const maxY = Math.max(...values, 1);
  const minY = Math.min(...values, 0);
  const range = maxY - minY || 1;

  const innerWidth = Math.max(width - PADDING.left - PADDING.right, 0);
  const innerHeight = height - PADDING.top - PADDING.bottom;
  const xStep =
    data.length > 1 ? innerWidth / (data.length - 1) : innerWidth;

  const points = useMemo(
    () =>
      data.map((point, index) => ({
        x: PADDING.left + index * xStep,
        y:
          PADDING.top +
          innerHeight -
          ((point.y - minY) / range) * innerHeight,
        label: point.x,
      })),
    [data, xStep, innerHeight, minY, range]
  );

  const annotationPoints = annotations
    .map((annotation) => {
      const idx = data.findIndex((d) => d.x === annotation.x);
      if (idx === -1) return null;
      const point = points[idx];
      if (!point) return null;
      return { ...annotation, point };
    })
    .filter(
      (a): a is AIInsightsChartAnnotation & { point: (typeof points)[number] } =>
        a !== null
    );

  const smooth = buildSmoothPath(points);

  const formatValue = (v: number): string =>
    currency ? formatCurrency(v) : formatNumber(v);

  const activeNote =
    annotationPoints.find((annotation) => annotation.x === activeAnnotation)?.note;

  return (
    <View style={styles.container} onLayout={onLayout}>
      {title ? <Text style={styles.title}>{title}</Text> : null}

      {width > 0 ? (
        <Svg width={width} height={height} accessibilityLabel={title}>
          <Path
            d={smooth}
            stroke={colors.primary}
            strokeWidth={2.5}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {annotationPoints.map((annotation) => (
            <Circle
              key={annotation.x}
              cx={annotation.point.x}
              cy={annotation.point.y}
              r={7}
              stroke={TONE_COLOR(annotation.tone)}
              strokeWidth={2.5}
              fill={colors.surface}
            />
          ))}
        </Svg>
      ) : null}

      <View style={styles.annotationRow}>
        {annotationPoints.map((annotation) => (
          <Pressable
            key={annotation.x}
            onPress={() =>
              setActiveAnnotation((prev) =>
                prev === annotation.x ? null : annotation.x
              )
            }
            style={[
              styles.annotationChip,
              {
                backgroundColor: `${TONE_COLOR(annotation.tone)}22`,
                borderColor: TONE_COLOR(annotation.tone),
              },
            ]}
          >
            <Text
              style={[
                styles.annotationText,
                { color: TONE_COLOR(annotation.tone) },
              ]}
            >
              {annotation.x}
            </Text>
          </Pressable>
        ))}
      </View>

      {activeNote ? (
        <View style={styles.note}>
          <Text style={styles.noteText}>{activeNote}</Text>
        </View>
      ) : null}

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
    borderRadius: radius.lg,
    padding: spacing.base,
    rowGap: spacing.xs,
    ...shadows.xs,
  },
  title: {
    ...textStyles.label,
    color: colors.textSecondary,
  },
  annotationRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  annotationChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  annotationText: {
    ...textStyles.caption,
    fontWeight: '700',
  },
  note: {
    padding: spacing.sm,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.base,
  },
  noteText: {
    ...textStyles.caption,
    color: colors.primaryDark,
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

export default AIInsightsChart;
