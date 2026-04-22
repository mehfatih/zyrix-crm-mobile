/**
 * StatCard — icon + label + value with an optional trend chip. When
 * `loading` is true, collapses to a skeleton row. Pass `value` as a
 * `ReactNode` so callers can drop in `<CurrencyDisplay />` directly.
 */

import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { Icon, type AnyIconName } from './Icon';
import { colors } from '../../constants/colors';
import { radius, shadows, spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';

export interface StatCardProps {
  icon: AnyIconName;
  label: string;
  value: React.ReactNode;
  trend?: number;
  onPress?: () => void;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  icon,
  label,
  value,
  trend,
  onPress,
  loading = false,
  style,
  testID,
}) => {
  const body = (
    <>
      <View style={styles.iconCircle}>
        <Icon name={icon} size={20} color={colors.primary} />
      </View>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
      {loading ? (
        <View style={styles.skeletonValue} />
      ) : typeof value === 'string' || typeof value === 'number' ? (
        <Text style={styles.value} numberOfLines={1}>
          {value}
        </Text>
      ) : (
        <View style={styles.valueWrapper}>{value}</View>
      )}
      {typeof trend === 'number' ? (
        <View
          style={[
            styles.trend,
            trend >= 0 ? styles.trendPositive : styles.trendNegative,
          ]}
        >
          <Icon
            name={trend >= 0 ? 'arrow-up' : 'arrow-down'}
            size={12}
            color={trend >= 0 ? colors.success : colors.error}
          />
          <Text
            style={[
              styles.trendText,
              { color: trend >= 0 ? colors.success : colors.error },
            ]}
          >
            {`${Math.abs(trend)}%`}
          </Text>
        </View>
      ) : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        testID={testID}
        onPress={onPress}
        style={({ pressed }) => [
          styles.card,
          pressed ? { opacity: 0.85 } : null,
          style,
        ]}
        accessibilityRole="button"
      >
        {body}
      </Pressable>
    );
  }

  return (
    <View testID={testID} style={[styles.card, style]}>
      {body}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.base,
    rowGap: spacing.xs,
    minWidth: 150,
    ...shadows.xs,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  label: {
    ...textStyles.caption,
    color: colors.textMuted,
  },
  value: {
    ...textStyles.h2,
    color: colors.primaryDark,
  },
  valueWrapper: {
    minHeight: 30,
  },
  skeletonValue: {
    height: 22,
    width: '60%',
    borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
  },
  trend: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 4,
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
  },
  trendPositive: {},
  trendNegative: {},
  trendText: {
    ...textStyles.caption,
    fontWeight: '700',
  },
});

export default StatCard;
