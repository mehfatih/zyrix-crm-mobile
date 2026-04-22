/**
 * Reusable Input — label, helper text, error state, RTL-aware.
 * Wraps the RN TextInput primitive to keep styling consistent.
 */

import React, { forwardRef, useState } from 'react';
import {
  I18nManager,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { colors } from '../../constants/colors';
import { radius, spacing, layout } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  labelStyle?: StyleProp<TextStyle>;
  required?: boolean;
}

const InputInner = (
  {
    label,
    error,
    helperText,
    leftIcon,
    rightIcon,
    onRightIconPress,
    containerStyle,
    inputStyle,
    labelStyle,
    required,
    onFocus,
    onBlur,
    placeholderTextColor,
    editable = true,
    ...textInputProps
  }: InputProps,
  ref: React.Ref<TextInput>
) => {
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? colors.error
    : focused
    ? colors.borderFocus
    : colors.border;

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label ? (
        <Text style={[styles.label, labelStyle]}>
          {label}
          {required ? <Text style={styles.requiredStar}> *</Text> : null}
        </Text>
      ) : null}

      <View
        style={[
          styles.fieldRow,
          {
            borderColor,
            backgroundColor: editable ? colors.surface : colors.surfaceAlt,
          },
        ]}
      >
        {leftIcon ? <View style={styles.iconLeft}>{leftIcon}</View> : null}

        <TextInput
          ref={ref}
          {...textInputProps}
          editable={editable}
          placeholderTextColor={placeholderTextColor ?? colors.textMuted}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[
            styles.input,
            {
              textAlign: I18nManager.isRTL ? 'right' : 'left',
              color: colors.textPrimary,
            },
            inputStyle,
          ]}
        />

        {rightIcon ? (
          onRightIconPress ? (
            <Pressable
              onPress={onRightIconPress}
              hitSlop={10}
              style={styles.iconRight}
              accessibilityRole="button"
            >
              {rightIcon}
            </Pressable>
          ) : (
            <View style={styles.iconRight}>{rightIcon}</View>
          )
        ) : null}
      </View>

      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
};

export const Input = forwardRef<TextInput, InputProps>(InputInner);
Input.displayName = 'Input';

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    marginBottom: spacing.md,
  },
  label: {
    ...textStyles.label,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  requiredStar: {
    color: colors.error,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: layout.inputHeight,
    borderWidth: 1.5,
    borderRadius: radius.base,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    ...textStyles.body,
    paddingVertical: spacing.sm,
  },
  iconLeft: {
    marginEnd: spacing.sm,
  },
  iconRight: {
    marginStart: spacing.sm,
  },
  errorText: {
    ...textStyles.caption,
    color: colors.error,
    marginTop: spacing.xs,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  helperText: {
    ...textStyles.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
});

export default Input;
