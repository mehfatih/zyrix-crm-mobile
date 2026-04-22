/**
 * SearchableDropdown — generic picker used for customers, team members,
 * products, etc. Modal + search bar + FlatList; the selected item is
 * highlighted in cyan.
 */

import React, { useMemo, useState } from 'react';
import {
  FlatList,
  I18nManager,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { Icon } from '../common/Icon';
import { colors } from '../../constants/colors';
import { hitSlop, radius, shadows, spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';

export interface DropdownItem {
  id: string;
  label: string;
  subtitle?: string;
  flag?: string;
}

export interface SearchableDropdownProps<T extends DropdownItem> {
  items: readonly T[];
  value: T | null;
  onChange: (item: T) => void;
  placeholder?: string;
  label?: string;
  searchable?: boolean;
  error?: string;
  renderItem?: (item: T, selected: boolean) => React.ReactNode;
  emptyText?: string;
  disabled?: boolean;
}

export const SearchableDropdown = <T extends DropdownItem>({
  items,
  value,
  onChange,
  placeholder,
  label,
  searchable = true,
  error,
  renderItem,
  emptyText,
  disabled,
}: SearchableDropdownProps<T>): React.ReactElement => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const needle = query.trim().toLowerCase();
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(needle) ||
        (item.subtitle?.toLowerCase().includes(needle) ?? false)
    );
  }, [items, query]);

  const onSelect = (item: T): void => {
    onChange(item);
    setVisible(false);
    setQuery('');
  };

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Pressable
        onPress={() => !disabled && setVisible(true)}
        style={({ pressed }) => [
          styles.trigger,
          error ? { borderColor: colors.error } : null,
          pressed ? { opacity: 0.85 } : null,
          disabled ? { opacity: 0.5 } : null,
        ]}
      >
        {value ? (
          <>
            {value.flag ? <Text style={styles.flag}>{value.flag}</Text> : null}
            <View style={styles.valueBlock}>
              <Text style={styles.valueLabel}>{value.label}</Text>
              {value.subtitle ? (
                <Text style={styles.valueSub}>{value.subtitle}</Text>
              ) : null}
            </View>
          </>
        ) : (
          <Text style={styles.placeholder}>
            {placeholder ?? t('common.continue')}
          </Text>
        )}
        <Icon name="chevron-down" size={18} color={colors.textMuted} />
      </Pressable>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Modal
        transparent
        visible={visible}
        animationType="slide"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setVisible(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>{label ?? placeholder}</Text>

            {searchable ? (
              <View style={styles.searchRow}>
                <Icon name="search-outline" size={18} color={colors.textMuted} />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder={t('customers.searchCustomers')}
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  style={[
                    styles.searchInput,
                    { textAlign: I18nManager.isRTL ? 'right' : 'left' },
                  ]}
                />
                {query ? (
                  <Pressable onPress={() => setQuery('')} hitSlop={hitSlop.sm}>
                    <Icon name="close-circle" size={18} color={colors.textMuted} />
                  </Pressable>
                ) : null}
              </View>
            ) : null}

            <FlatList
              data={filtered}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const selected = value?.id === item.id;
                if (renderItem) {
                  return (
                    <Pressable onPress={() => onSelect(item)}>
                      {renderItem(item, selected)}
                    </Pressable>
                  );
                }
                return (
                  <Pressable
                    onPress={() => onSelect(item)}
                    style={({ pressed }) => [
                      styles.item,
                      selected ? styles.itemSelected : null,
                      pressed ? { opacity: 0.9 } : null,
                    ]}
                  >
                    {item.flag ? (
                      <Text style={styles.itemFlag}>{item.flag}</Text>
                    ) : null}
                    <View style={styles.itemBody}>
                      <Text
                        style={[
                          styles.itemLabel,
                          selected ? { color: colors.primaryDark } : null,
                        ]}
                        numberOfLines={1}
                      >
                        {item.label}
                      </Text>
                      {item.subtitle ? (
                        <Text style={styles.itemSub} numberOfLines={1}>
                          {item.subtitle}
                        </Text>
                      ) : null}
                    </View>
                    {selected ? (
                      <Icon
                        name="checkmark-circle"
                        size={20}
                        color={colors.primary}
                      />
                    ) : null}
                  </Pressable>
                );
              }}
              ListEmptyComponent={
                <View style={styles.empty}>
                  <Text style={styles.emptyText}>
                    {emptyText ?? t('customers.noCustomers')}
                  </Text>
                </View>
              }
              contentContainerStyle={styles.list}
              keyboardShouldPersistTaps="handled"
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { width: '100%', marginBottom: spacing.md },
  label: {
    ...textStyles.label,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.base,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    minHeight: 52,
  },
  valueBlock: { flex: 1 },
  valueLabel: { ...textStyles.body, color: colors.textPrimary },
  valueSub: { ...textStyles.caption, color: colors.textMuted },
  flag: { fontSize: 20 },
  placeholder: {
    flex: 1,
    ...textStyles.body,
    color: colors.textMuted,
  },
  errorText: {
    ...textStyles.caption,
    color: colors.error,
    marginTop: spacing.xs,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(12, 74, 110, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    maxHeight: '85%',
    ...shadows.lg,
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  sheetTitle: {
    ...textStyles.h3,
    color: colors.textPrimary,
    marginBottom: spacing.base,
    textAlign: 'center',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.base,
    paddingHorizontal: spacing.md,
    columnGap: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    ...textStyles.body,
    color: colors.textPrimary,
    paddingVertical: spacing.sm,
  },
  list: {
    paddingBottom: spacing.lg,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.base,
    marginBottom: spacing.xs,
  },
  itemSelected: {
    backgroundColor: colors.primarySoft,
  },
  itemBody: { flex: 1 },
  itemLabel: {
    ...textStyles.bodyMedium,
    color: colors.textPrimary,
  },
  itemSub: {
    ...textStyles.caption,
    color: colors.textMuted,
  },
  itemFlag: { fontSize: 22 },
  empty: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...textStyles.body,
    color: colors.textMuted,
  },
});

export default SearchableDropdown;
