import React, { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { darkColors, radius, typography, shadows } from '../../theme/dark';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  fullWidth?: boolean;
  style?: ViewStyle;
  testID?: string;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  leadingIcon,
  trailingIcon,
  fullWidth = false,
  style,
  testID,
}: ButtonProps) {
  const sizeTokens = SIZE_TOKENS[size];
  const palette = VARIANT_PALETTE[variant];
  const isInactive = disabled || loading;

  return (
    <Pressable
      onPress={isInactive ? undefined : onPress}
      disabled={isInactive}
      testID={testID}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: pressed ? palette.bgPressed : palette.bg,
          borderColor: palette.border,
          paddingVertical: sizeTokens.paddingVertical,
          paddingHorizontal: sizeTokens.paddingHorizontal,
          borderRadius: sizeTokens.radius,
          opacity: isInactive ? 0.5 : 1,
          width: fullWidth ? '100%' : undefined,
        },
        variant === 'primary' && (shadows.primaryGlow as ViewStyle),
        style,
      ]}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={palette.text} size="small" />
        ) : (
          <>
            {leadingIcon && <View style={styles.icon}>{leadingIcon}</View>}
            <Text
              style={[
                styles.label,
                { color: palette.text, fontSize: sizeTokens.fontSize },
              ]}
              numberOfLines={1}
            >
              {label}
            </Text>
            {trailingIcon && <View style={styles.iconTrailing}>{trailingIcon}</View>}
          </>
        )}
      </View>
    </Pressable>
  );
}

const VARIANT_PALETTE = {
  primary: {
    bg: darkColors.primary,
    bgPressed: darkColors.primaryDark,
    text: darkColors.textOnPrimary,
    border: 'transparent',
  },
  secondary: {
    bg: darkColors.surface,
    bgPressed: darkColors.surfaceAlt,
    text: darkColors.textPrimary,
    border: darkColors.border,
  },
  ghost: {
    bg: 'transparent',
    bgPressed: darkColors.surfaceAlt,
    text: darkColors.textPrimary,
    border: 'transparent',
  },
  danger: {
    bg: darkColors.error,
    bgPressed: '#E11D48',
    text: '#FFFFFF',
    border: 'transparent',
  },
} as const;

const SIZE_TOKENS = {
  sm: { paddingVertical: 8,  paddingHorizontal: 12, fontSize: typography.size.sm,   radius: radius.base },
  md: { paddingVertical: 12, paddingHorizontal: 16, fontSize: typography.size.base, radius: radius.lg },
  lg: { paddingVertical: 16, paddingHorizontal: 20, fontSize: typography.size.lg,   radius: radius.lg },
};

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  label: { fontWeight: '600' as TextStyle['fontWeight'] },
  icon: { marginEnd: 8 },
  iconTrailing: { marginStart: 8 },
});
