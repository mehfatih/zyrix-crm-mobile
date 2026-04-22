/**
 * TagsInput — chip-based tag entry with an inline text input and an
 * optional suggestion list. Enforces a max count (default 10) and
 * de-duplicates tags as the user types.
 */

import React, { useMemo, useState } from 'react';
import {
  I18nManager,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { Icon } from '../common/Icon';
import { colors } from '../../constants/colors';
import { radius, spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';

export interface TagsInputProps {
  value: readonly string[];
  onChange: (next: string[]) => void;
  label?: string;
  placeholder?: string;
  maxTags?: number;
  suggestions?: readonly string[];
  error?: string;
}

const normalize = (s: string): string => s.trim();

export const TagsInput: React.FC<TagsInputProps> = ({
  value,
  onChange,
  label,
  placeholder,
  maxTags = 10,
  suggestions = [],
  error,
}) => {
  const { t } = useTranslation();
  const [draft, setDraft] = useState('');

  const addTag = (tag: string): void => {
    const next = normalize(tag);
    if (!next) return;
    if (value.length >= maxTags) return;
    if (value.includes(next)) return;
    onChange([...value, next]);
    setDraft('');
  };

  const removeTag = (tag: string): void => {
    onChange(value.filter((t) => t !== tag));
  };

  const filteredSuggestions = useMemo(() => {
    const q = draft.trim().toLowerCase();
    if (!q) return [];
    return suggestions
      .filter(
        (s) => s.toLowerCase().includes(q) && !value.includes(s)
      )
      .slice(0, 6);
  }, [draft, suggestions, value]);

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View
        style={[
          styles.field,
          error ? { borderColor: colors.error } : null,
        ]}
      >
        {value.map((tag) => (
          <View key={tag} style={styles.chip}>
            <Text style={styles.chipText}>{tag}</Text>
            <Pressable
              onPress={() => removeTag(tag)}
              hitSlop={6}
              accessibilityLabel={t('common.delete')}
            >
              <Icon name="close" size={14} color={colors.primaryDark} />
            </Pressable>
          </View>
        ))}
        <TextInput
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={() => addTag(draft)}
          placeholder={
            value.length >= maxTags
              ? undefined
              : placeholder ?? t('customers.addTag')
          }
          placeholderTextColor={colors.textMuted}
          editable={value.length < maxTags}
          style={[
            styles.input,
            { textAlign: I18nManager.isRTL ? 'right' : 'left' },
          ]}
          blurOnSubmit={false}
          returnKeyType="done"
        />
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {filteredSuggestions.length > 0 ? (
        <View style={styles.suggestions}>
          {filteredSuggestions.map((s) => (
            <Pressable
              key={s}
              onPress={() => addTag(s)}
              style={styles.suggestionChip}
            >
              <Text style={styles.suggestionText}>{`+ ${s}`}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <Text style={styles.counter}>
        {`${value.length}/${maxTags}`}
      </Text>
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
  field: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    minHeight: 52,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.base,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    columnGap: spacing.xs,
    rowGap: spacing.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  chipText: {
    ...textStyles.caption,
    color: colors.primaryDark,
    fontWeight: '600',
  },
  input: {
    flex: 1,
    minWidth: 100,
    ...textStyles.body,
    color: colors.textPrimary,
    paddingVertical: spacing.xs,
  },
  errorText: {
    ...textStyles.caption,
    color: colors.error,
    marginTop: spacing.xs,
  },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  suggestionChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
  },
  suggestionText: {
    ...textStyles.caption,
    color: colors.primary,
  },
  counter: {
    ...textStyles.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
    alignSelf: 'flex-end',
  },
});

export default TagsInput;
