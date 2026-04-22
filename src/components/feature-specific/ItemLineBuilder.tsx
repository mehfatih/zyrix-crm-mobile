/**
 * ItemLineBuilder — editable line items for quotes, invoices, and
 * orders. Each row captures description, quantity, unit price, an
 * optional discount %, and shows the auto-computed line total using
 * the country's currency symbol via `CurrencyDisplay`.
 *
 * Re-ordering is not wired up in Sprint 5 — the spec allows this to
 * land later. Delete and add are available today.
 */

import React, { useCallback } from 'react';
import {
  I18nManager,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { CurrencyDisplay } from '../forms/CurrencyDisplay';
import { Icon } from '../common/Icon';
import { LocalizedCurrencyInput } from '../common/LocalizedCurrencyInput';
import { colors } from '../../constants/colors';
import { radius, shadows, spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discountPct: number;
}

export interface ItemLineBuilderProps {
  items: readonly LineItem[];
  onChange: (next: LineItem[]) => void;
}

const genId = (): string => `ln_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

export const computeLineTotal = (item: LineItem): number => {
  const base = item.quantity * item.unitPrice;
  const discount = (base * (item.discountPct || 0)) / 100;
  return Math.max(base - discount, 0);
};

export const ItemLineBuilder: React.FC<ItemLineBuilderProps> = ({
  items,
  onChange,
}) => {
  const { t } = useTranslation();

  const update = useCallback(
    (id: string, patch: Partial<LineItem>) => {
      onChange(items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
    },
    [items, onChange]
  );

  const remove = useCallback(
    (id: string) => {
      onChange(items.filter((item) => item.id !== id));
    },
    [items, onChange]
  );

  const add = useCallback(() => {
    const next: LineItem = {
      id: genId(),
      description: '',
      quantity: 1,
      unitPrice: 0,
      discountPct: 0,
    };
    onChange([...items, next]);
  }, [items, onChange]);

  return (
    <View style={styles.wrapper}>
      {items.length === 0 ? (
        <View style={styles.empty}>
          <Icon name="cube-outline" size={32} color={colors.primary} />
          <Text style={styles.emptyTitle}>{t('forms.noItemsYet')}</Text>
          <Text style={styles.emptyBody}>
            {t('forms.addYourFirstItem')}
          </Text>
        </View>
      ) : null}

      {items.map((item, index) => {
        const lineTotal = computeLineTotal(item);
        return (
          <View key={item.id} style={styles.row}>
            <View style={styles.rowHeader}>
              <Text style={styles.rowIndex}>{`#${index + 1}`}</Text>
              <Pressable
                onPress={() => remove(item.id)}
                hitSlop={8}
                style={styles.removeBtn}
              >
                <Icon name="trash-outline" size={16} color={colors.error} />
              </Pressable>
            </View>

            <TextInput
              value={item.description}
              onChangeText={(next) => update(item.id, { description: next })}
              placeholder={t('quoteBuilder.items')}
              placeholderTextColor={colors.textMuted}
              multiline
              style={[
                styles.description,
                { textAlign: I18nManager.isRTL ? 'right' : 'left' },
              ]}
            />

            <View style={styles.fieldsRow}>
              <View style={[styles.field, styles.fieldSmall]}>
                <Text style={styles.fieldLabel}>{t('forms.quantity')}</Text>
                <TextInput
                  value={String(item.quantity)}
                  onChangeText={(next) => {
                    const cleaned = next.replace(/[^0-9]/g, '');
                    const qty = Math.max(parseInt(cleaned || '0', 10), 1);
                    update(item.id, { quantity: qty });
                  }}
                  keyboardType="number-pad"
                  style={[
                    styles.fieldInput,
                    { textAlign: I18nManager.isRTL ? 'right' : 'left' },
                  ]}
                />
              </View>

              <View style={[styles.field, styles.fieldWide]}>
                <LocalizedCurrencyInput
                  value={String(item.unitPrice)}
                  onChangeText={(next) => {
                    const sanitized = next.replace(/,/g, '');
                    const asNumber = Number(sanitized);
                    update(item.id, {
                      unitPrice: Number.isFinite(asNumber) ? asNumber : 0,
                    });
                  }}
                  label={t('forms.unitPrice')}
                />
              </View>

              <View style={[styles.field, styles.fieldSmall]}>
                <Text style={styles.fieldLabel}>{t('forms.discount')} %</Text>
                <TextInput
                  value={String(item.discountPct)}
                  onChangeText={(next) => {
                    const cleaned = next.replace(/[^0-9.]/g, '');
                    const pct = Math.min(
                      Math.max(parseFloat(cleaned || '0'), 0),
                      100
                    );
                    update(item.id, {
                      discountPct: Number.isFinite(pct) ? pct : 0,
                    });
                  }}
                  keyboardType="decimal-pad"
                  style={[
                    styles.fieldInput,
                    { textAlign: I18nManager.isRTL ? 'right' : 'left' },
                  ]}
                />
              </View>
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{t('forms.lineTotal')}</Text>
              <CurrencyDisplay
                amount={lineTotal}
                size="medium"
                color={colors.primaryDark}
              />
            </View>
          </View>
        );
      })}

      <Pressable
        onPress={add}
        style={({ pressed }) => [
          styles.addBtn,
          pressed ? { opacity: 0.9 } : null,
        ]}
      >
        <Icon name="add-circle-outline" size={22} color={colors.primary} />
        <Text style={styles.addText}>{t('forms.addItem')}</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { rowGap: spacing.sm },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    rowGap: spacing.xs,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.lg,
  },
  emptyTitle: {
    ...textStyles.bodyMedium,
    color: colors.primaryDark,
  },
  emptyBody: {
    ...textStyles.caption,
    color: colors.textMuted,
  },
  row: {
    backgroundColor: colors.surface,
    padding: spacing.base,
    borderRadius: radius.lg,
    rowGap: spacing.sm,
    ...shadows.xs,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowIndex: {
    ...textStyles.label,
    color: colors.primary,
    fontWeight: '700',
  },
  removeBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: colors.errorSoft,
  },
  description: {
    ...textStyles.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.base,
    padding: spacing.sm,
    minHeight: 48,
  },
  fieldsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  field: {
    rowGap: spacing.xs,
  },
  fieldSmall: {
    flexGrow: 1,
    flexBasis: '28%',
  },
  fieldWide: {
    flexGrow: 2,
    flexBasis: '40%',
  },
  fieldLabel: {
    ...textStyles.label,
    color: colors.textSecondary,
  },
  fieldInput: {
    ...textStyles.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.base,
    padding: spacing.sm,
    minHeight: 44,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: spacing.sm,
  },
  totalLabel: {
    ...textStyles.label,
    color: colors.textSecondary,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: spacing.xs,
    paddingVertical: spacing.base,
    borderRadius: radius.base,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  addText: {
    ...textStyles.button,
    color: colors.primary,
  },
});

export default ItemLineBuilder;
