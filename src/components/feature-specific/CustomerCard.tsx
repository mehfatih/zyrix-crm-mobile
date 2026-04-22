/**
 * CustomerCard — list row for the Customers screen. Avatar initials
 * circle, name + company, country flag, lifetime revenue, last contact
 * date, and a color-coded health-score pill.
 */

import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CurrencyDisplay } from '../forms/CurrencyDisplay';
import { colors } from '../../constants/colors';
import { findCountry } from '../../constants/countries';
import { radius, shadows, spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';
import { useCountryConfig } from '../../hooks/useCountryConfig';
import type { Customer } from '../../api/customers';

export interface CustomerCardProps {
  customer: Customer;
  onPress?: (customer: Customer) => void;
}

const scoreTone = (
  score: number
): { background: string; color: string; label: 'good' | 'ok' | 'risk' } => {
  if (score >= 70) {
    return {
      background: colors.successSoft,
      color: colors.success,
      label: 'good',
    };
  }
  if (score >= 40) {
    return {
      background: colors.warningSoft,
      color: colors.warning,
      label: 'ok',
    };
  }
  return { background: colors.errorSoft, color: colors.error, label: 'risk' };
};

export const CustomerCard: React.FC<CustomerCardProps> = ({
  customer,
  onPress,
}) => {
  const { formatDate } = useCountryConfig();

  const countryFlag = useMemo(
    () => findCountry(customer.country).flag,
    [customer.country]
  );

  const tone = scoreTone(customer.healthScore);

  return (
    <Pressable
      onPress={() => onPress?.(customer)}
      style={({ pressed }) => [
        styles.card,
        pressed ? { opacity: 0.85 } : null,
      ]}
      accessibilityRole="button"
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{customer.avatarInitials}</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.headerRow}>
          <Text style={styles.name} numberOfLines={1}>
            {customer.name}
          </Text>
          <Text style={styles.flag}>{countryFlag}</Text>
        </View>
        <Text style={styles.company} numberOfLines={1}>
          {customer.company}
        </Text>

        <View style={styles.metaRow}>
          <CurrencyDisplay amount={customer.totalRevenue} size="small" />
          <Text style={styles.metaDot}>•</Text>
          <Text style={styles.meta}>{formatDate(customer.lastContactAt)}</Text>
        </View>
      </View>

      <View
        style={[styles.scoreBadge, { backgroundColor: tone.background }]}
      >
        <Text style={[styles.scoreValue, { color: tone.color }]}>
          {customer.healthScore}
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.base,
    columnGap: spacing.base,
    marginBottom: spacing.sm,
    ...shadows.xs,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...textStyles.label,
    color: colors.primaryDark,
    fontWeight: '700',
  },
  body: {
    flex: 1,
    rowGap: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    columnGap: spacing.xs,
  },
  name: {
    ...textStyles.bodyMedium,
    color: colors.textPrimary,
    flex: 1,
  },
  flag: {
    fontSize: 16,
  },
  company: {
    ...textStyles.caption,
    color: colors.textMuted,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.xs,
    marginTop: 2,
  },
  metaDot: {
    ...textStyles.caption,
    color: colors.textMuted,
  },
  meta: {
    ...textStyles.caption,
    color: colors.textMuted,
  },
  scoreBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    minWidth: 44,
    alignItems: 'center',
  },
  scoreValue: {
    ...textStyles.label,
    fontWeight: '700',
  },
});

export default CustomerCard;
