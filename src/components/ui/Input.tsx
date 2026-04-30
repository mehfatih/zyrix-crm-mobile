import React, { ReactNode, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { darkColors, radius, spacing, typography } from '../../theme/dark';

type InputProps = TextInputProps & {
  label?: string;
  helperText?: string;
  errorText?: string;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  containerStyle?: ViewStyle;
};

export function Input({
  label,
  helperText,
  errorText,
  leadingIcon,
  trailingIcon,
  containerStyle,
  ...textInputProps
}: InputProps) {
  const [focused, setFocused] = useState(false);

  const borderColor = errorText
    ? darkColors.error
    : focused
    ? darkColors.primary
    : darkColors.border;

  return (
    <View style={containerStyle}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View style={[styles.inputWrap, { borderColor }]}>
        {leadingIcon && <View style={styles.leading}>{leadingIcon}</View>}
        <TextInput
          {...textInputProps}
          placeholderTextColor={darkColors.textMuted}
          onFocus={(e) => {
            setFocused(true);
            textInputProps.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            textInputProps.onBlur?.(e);
          }}
          style={[styles.input, textInputProps.style]}
        />
        {trailingIcon && <View style={styles.trailing}>{trailingIcon}</View>}
      </View>

      {(helperText || errorText) && (
        <Text style={[styles.helper, errorText && styles.helperError]}>
          {errorText ?? helperText}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    color: darkColors.textPrimary,
    fontSize: typography.size.sm,
    fontWeight: '600',
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: darkColors.surfaceAlt,
    borderWidth: 1,
    borderRadius: radius.base,
    paddingHorizontal: spacing.sm,
  },
  input: {
    flex: 1,
    color: darkColors.textPrimary,
    fontSize: typography.size.base,
    paddingVertical: 12,
  },
  leading: { marginEnd: spacing.sm },
  trailing: { marginStart: spacing.sm },
  helper: {
    color: darkColors.textMuted,
    fontSize: typography.size.xs,
    marginTop: 4,
  },
  helperError: {
    color: darkColors.error,
  },
});
