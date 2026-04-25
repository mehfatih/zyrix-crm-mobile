/**
 * SmartStatCard — context-rich stat tile (AI Sprint 3 §4 / Task 3).
 *
 * Stats must include context. NEVER raw numbers alone.
 * Example: "Customers: 8 / +2 this week / Warning: 3 inactive / Hot: 2 high-value"
 *
 * Renders a compact card per metric with: icon, metric label, value,
 * change line, optional warning row, optional highlight row. Designed
 * to live in a flex-wrap grid (`flexBasis: '48%'`).
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Icon, type AnyIconName } from '../common/Icon';
import {
  zyrixRadius,
  zyrixShadows,
  zyrixSpacing,
  zyrixTheme,
} from '../../theme/zyrixTheme';

export type SmartStatMetric = 'customers' | 'deals' | 'revenue' | 'tasks';

export interface SmartStatCardProps {
  metric: SmartStatMetric;
  value: string | number;
  change?: string;
  warningContext?: string;
  highlightContext?: string;
}

const METRIC_ICONS: Record<SmartStatMetric, AnyIconName> = {
  customers: 'people-outline',
  deals: 'briefcase-outline',
  revenue: 'cash-outline',
  tasks: 'checkbox-outline',
};

export const SmartStatCard: React.FC<SmartStatCardProps> = ({
  metric,
  value,
  change,
  warningContext,
  highlightContext,
}) => {
  const { t } = useTranslation();

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Icon
          name={METRIC_ICONS[metric]}
          size={16}
          color={zyrixTheme.primary}
          family="Ionicons"
        />
        <Text style={styles.metricLabel}>{t(`dashboard.${metric}`).toUpperCase()}</Text>
      </View>
      <Text style={styles.value}>{value}</Text>
      {change ? <Text style={styles.change}>{change}</Text> : null}
      {warningContext ? (
        <View style={styles.contextRow}>
          <Icon
            name="alert-circle-outline"
            size={11}
            color={zyrixTheme.warning}
            family="Ionicons"
          />
          <Text style={[styles.contextText, { color: zyrixTheme.warning }]}>
            {warningContext}
          </Text>
        </View>
      ) : null}
      {highlightContext ? (
        <View style={styles.contextRow}>
          <Icon
            name="trending-up-outline"
            size={11}
            color={zyrixTheme.success}
            family="Ionicons"
          />
          <Text style={[styles.contextText, { color: zyrixTheme.success }]}>
            {highlightContext}
          </Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexBasis: '48%',
    flexGrow: 1,
    backgroundColor: zyrixTheme.cardBg,
    borderRadius: zyrixRadius.lg,
    padding: zyrixSpacing.base - 2,
    rowGap: 4,
    borderWidth: 1,
    borderColor: zyrixTheme.cardBorder,
    ...zyrixShadows.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 6,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: zyrixTheme.textMuted,
    letterSpacing: 1.2,
  },
  value: {
    fontSize: 22,
    fontWeight: '800',
    color: zyrixTheme.textHeading,
    marginVertical: 2,
  },
  change: {
    fontSize: 11,
    color: zyrixTheme.primary,
    fontWeight: '600',
  },
  contextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 4,
  },
  contextText: {
    fontSize: 10,
    fontWeight: '600',
  },
});

export default SmartStatCard;
