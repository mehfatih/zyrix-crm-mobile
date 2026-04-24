/**
 * SidebarSearch — slide-down search input that filters the sidebar
 * items by label. Hidden by default behind a magnifier button; tapping
 * the magnifier expands the input and auto-focuses it.
 */

import React, { useEffect, useRef } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { Icon } from '../common/Icon';
import { colors } from '../../constants/colors';
import { hitSlop, radius, spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';

export interface SidebarSearchProps {
  expanded: boolean;
  onToggle: () => void;
  query: string;
  onChangeQuery: (next: string) => void;
}

export const SidebarSearch: React.FC<SidebarSearchProps> = ({
  expanded,
  onToggle,
  query,
  onChangeQuery,
}) => {
  const { t } = useTranslation();
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (expanded) {
      const id = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(id);
    } else {
      inputRef.current?.blur();
      return undefined;
    }
  }, [expanded]);

  return (
    <View style={styles.wrap}>
      {expanded ? (
        <View style={styles.inputRow}>
          <Icon name="search" size={18} color={colors.primary} />
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={onChangeQuery}
            placeholder={t('sidebar.search')}
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
          />
          <Pressable
            onPress={() => {
              onChangeQuery('');
              onToggle();
            }}
            hitSlop={hitSlop.md}
            accessibilityRole="button"
            accessibilityLabel={t('common.cancel')}
          >
            <Icon name="close" size={18} color={colors.textMuted} />
          </Pressable>
        </View>
      ) : (
        <Pressable
          onPress={onToggle}
          accessibilityRole="button"
          accessibilityLabel={t('sidebar.search')}
          style={({ pressed }) => [
            styles.trigger,
            pressed ? { opacity: 0.85 } : null,
          ]}
        >
          <Icon name="search" size={18} color={colors.primary} />
          <Text style={styles.triggerLabel}>{t('sidebar.search')}</Text>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.base,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
  },
  triggerLabel: {
    ...textStyles.body,
    color: colors.textMuted,
    flex: 1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  input: {
    ...textStyles.body,
    flex: 1,
    color: colors.textPrimary,
    paddingVertical: spacing.xs,
  },
});

export default SidebarSearch;
