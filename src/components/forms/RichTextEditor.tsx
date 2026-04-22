/**
 * RichTextEditor — minimal markdown-flavoured editor. Sprint 5 keeps it
 * simple: a formatting toolbar that wraps the current selection with
 * **bold** / *italic* / bullet markers, a multiline TextInput, and a
 * live character counter. Renders plain text — downstream callers are
 * free to parse the markdown when displaying.
 */

import React, { useCallback, useRef, useState } from 'react';
import {
  I18nManager,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type NativeSyntheticEvent,
  type TextInputSelectionChangeEventData,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { Icon, type AnyIconName } from '../common/Icon';
import { colors } from '../../constants/colors';
import { radius, spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';

export interface RichTextEditorProps {
  value: string;
  onChangeText: (next: string) => void;
  label?: string;
  placeholder?: string;
  minHeight?: number;
  maxLength?: number;
}

type Action = 'bold' | 'italic' | 'list';

interface ActionSpec {
  key: Action;
  icon: AnyIconName;
  wrap?: { start: string; end: string };
  linePrefix?: string;
}

const ACTIONS: readonly ActionSpec[] = [
  { key: 'bold', icon: 'text-outline', wrap: { start: '**', end: '**' } },
  { key: 'italic', icon: 'text', wrap: { start: '*', end: '*' } },
  { key: 'list', icon: 'list-outline', linePrefix: '- ' },
];

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChangeText,
  label,
  placeholder,
  minHeight = 140,
  maxLength = 4000,
}) => {
  const { t } = useTranslation();
  const inputRef = useRef<TextInput | null>(null);
  const [selection, setSelection] = useState<{ start: number; end: number }>({
    start: 0,
    end: 0,
  });

  const onSelectionChange = useCallback(
    (event: NativeSyntheticEvent<TextInputSelectionChangeEventData>) => {
      setSelection(event.nativeEvent.selection);
    },
    []
  );

  const applyAction = useCallback(
    (action: ActionSpec) => {
      const { start, end } = selection;
      if (action.wrap) {
        const before = value.slice(0, start);
        const inside = value.slice(start, end);
        const after = value.slice(end);
        const next = `${before}${action.wrap.start}${inside || 'text'}${action.wrap.end}${after}`;
        onChangeText(next);
        return;
      }
      if (action.linePrefix) {
        const before = value.slice(0, start);
        const after = value.slice(start);
        const needsNewline = before.length > 0 && !before.endsWith('\n');
        const next = `${before}${needsNewline ? '\n' : ''}${action.linePrefix}${after}`;
        onChangeText(next);
      }
    },
    [selection, value, onChangeText]
  );

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View style={styles.toolbar}>
        {ACTIONS.map((action) => (
          <Pressable
            key={action.key}
            onPress={() => applyAction(action)}
            style={({ pressed }) => [
              styles.toolbarBtn,
              pressed ? { opacity: 0.8 } : null,
            ]}
          >
            <Icon name={action.icon} size={18} color={colors.primary} />
            <Text style={styles.toolbarLabel}>{t(`richText.${action.key}`)}</Text>
          </Pressable>
        ))}
      </View>

      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChangeText}
        onSelectionChange={onSelectionChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        multiline
        scrollEnabled
        textAlignVertical="top"
        maxLength={maxLength}
        style={[
          styles.input,
          {
            minHeight,
            textAlign: I18nManager.isRTL ? 'right' : 'left',
          },
        ]}
      />

      <View style={styles.footerRow}>
        <Text style={styles.footerHint}>{t('richText.hint')}</Text>
        <Text style={styles.counter}>{`${value.length}/${maxLength}`}</Text>
      </View>
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
  toolbar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: colors.surfaceAlt,
    padding: spacing.xs,
    borderTopLeftRadius: radius.base,
    borderTopRightRadius: radius.base,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderBottomWidth: 0,
    columnGap: spacing.xs,
    rowGap: spacing.xs,
  },
  toolbarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
  },
  toolbarLabel: {
    ...textStyles.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  input: {
    ...textStyles.body,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderBottomLeftRadius: radius.base,
    borderBottomRightRadius: radius.base,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  footerHint: {
    ...textStyles.caption,
    color: colors.textMuted,
  },
  counter: {
    ...textStyles.caption,
    color: colors.textMuted,
  },
});

export default RichTextEditor;
