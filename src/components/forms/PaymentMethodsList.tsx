/**
 * PaymentMethodsList — renders the active country's payment rails as
 * selectable radio cards. Supports an optional `filter` to narrow to a
 * subset (e.g. "only show digital wallets").
 *
 * Region-specific rails (mada, STC Pay, KNET, BENEFIT, Thawani, etc.)
 * render as short text badges — stock Ionicons don't have brand glyphs
 * for these. Generic rails map to Ionicons via the `Icon` wrapper.
 */

import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon, type AnyIconName } from '../common/Icon';
import { colors } from '../../constants/colors';
import { radius, spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';
import { useCountryConfig } from '../../hooks/useCountryConfig';
import { useTranslation } from 'react-i18next';
import type { PaymentMethod } from '../../types/country';

export interface PaymentMethodsListProps {
  onSelect: (method: PaymentMethod) => void;
  selectedMethod?: PaymentMethod | null;
  filter?: readonly PaymentMethod[];
  testID?: string;
}

interface Visual {
  kind: 'icon' | 'badge';
  iconName?: AnyIconName;
  badge?: string;
}

const VISUALS: Record<string, Visual> = {
  cash: { kind: 'icon', iconName: 'cash-outline' },
  bank_transfer: { kind: 'icon', iconName: 'swap-horizontal-outline' },
  applepay: { kind: 'icon', iconName: 'logo-apple' },
  visa: { kind: 'icon', iconName: 'card-outline' },
  mastercard: { kind: 'icon', iconName: 'card-outline' },
  mada: { kind: 'badge', badge: 'مدى' },
  stcpay: { kind: 'badge', badge: 'STC' },
  knet: { kind: 'badge', badge: 'KNET' },
  benefit: { kind: 'badge', badge: 'B' },
  thawani: { kind: 'badge', badge: 'Th' },
  omannet: { kind: 'badge', badge: 'OM' },
  naps: { kind: 'badge', badge: 'NAPS' },
  iyzico: { kind: 'badge', badge: 'iyzi' },
  paytr: { kind: 'badge', badge: 'PT' },
  troy: { kind: 'badge', badge: 'Troy' },
  tabby: { kind: 'badge', badge: 'tabby' },
  tamara: { kind: 'badge', badge: 'tamara' },
  fawry: { kind: 'badge', badge: 'Fawry' },
  vodafone_cash: { kind: 'badge', badge: 'VC' },
  instapay: { kind: 'badge', badge: 'IP' },
  cliq: { kind: 'badge', badge: 'CliQ' },
};

const DEFAULT_VISUAL: Visual = { kind: 'icon', iconName: 'card-outline' };

export const PaymentMethodsList: React.FC<PaymentMethodsListProps> = ({
  onSelect,
  selectedMethod,
  filter,
  testID,
}) => {
  const { t } = useTranslation();
  const { availablePaymentMethods } = useCountryConfig();

  const methods = useMemo(() => {
    const all = availablePaymentMethods();
    if (!filter || filter.length === 0) return all;
    const set = new Set(filter);
    return all.filter((m) => set.has(m));
  }, [availablePaymentMethods, filter]);

  return (
    <View testID={testID} style={styles.list}>
      {methods.map((method) => {
        const visual = VISUALS[method] ?? DEFAULT_VISUAL;
        const isSelected = method === selectedMethod;
        return (
          <Pressable
            key={method}
            onPress={() => onSelect(method)}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected }}
            style={({ pressed }) => [
              styles.card,
              isSelected ? styles.cardSelected : null,
              pressed ? { opacity: 0.8 } : null,
            ]}
          >
            <View style={styles.visual}>
              {visual.kind === 'icon' && visual.iconName ? (
                <Icon name={visual.iconName} size={22} color={colors.primary} />
              ) : (
                <Text style={styles.visualBadge}>{visual.badge}</Text>
              )}
            </View>
            <Text style={styles.label}>
              {t(`paymentMethods.${method}`, {
                defaultValue: method.replace(/_/g, ' '),
              })}
            </Text>
            <View
              style={[styles.radio, isSelected ? styles.radioSelected : null]}
            >
              {isSelected ? <View style={styles.radioDot} /> : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  list: {
    rowGap: spacing.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    borderRadius: radius.base,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  visual: {
    width: 40,
    height: 40,
    borderRadius: radius.base,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  visualBadge: {
    ...textStyles.label,
    color: colors.primary,
    fontWeight: '700',
  },
  label: {
    ...textStyles.bodyMedium,
    color: colors.textPrimary,
    flex: 1,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: colors.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
});

export default PaymentMethodsList;
