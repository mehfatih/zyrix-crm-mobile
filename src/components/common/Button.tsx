/**
 * Reusable Button — cyan theme.
 * Variants: primary | secondary | outline | ghost
 * Sizes: sm | md | lg
 */

import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { colors } from '../../constants/colors';
import { radius, spacing, layout } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  label: string;
  onPress?: (event: GestureResponderEvent) => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  testID?: string;
  accessibilityLabel?: string;
}

const heightBySize: Record<ButtonSize, number> = {
  sm: layout.buttonHeightSm,
  md: layout.buttonHeight,
  lg: layout.buttonHeight + 6,
};

const paddingBySize: Record<ButtonSize, number> = {
  sm: spacing.md,
  md: spacing.lg,
  lg: spacing.xl,
};

export const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  style,
  labelStyle,
  testID,
  accessibilityLabel,
}) => {
  const isDisabled = disabled || loading;

  const { containerStyle, textColor, pressedOverlay } = useMemo(() => {
    switch (variant) {
      case 'secondary':
        return {
          containerStyle: {
            backgroundColor: colors.primarySoft,
            borderWidth: 0,
          } as ViewStyle,
          textColor: colors.primaryDark,
          pressedOverlay: 'rgba(8, 145, 178, 0.08)',
        };
      case 'outline':
        return {
          containerStyle: {
            backgroundColor: colors.transparent,
            borderWidth: 1.5,
            borderColor: colors.primary,
          } as ViewStyle,
          textColor: colors.primary,
          pressedOverlay: 'rgba(8, 145, 178, 0.08)',
        };
      case 'ghost':
        return {
          containerStyle: {
            backgroundColor: colors.transparent,
            borderWidth: 0,
          } as ViewStyle,
          textColor: colors.primary,
          pressedOverlay: 'rgba(8, 145, 178, 0.10)',
        };
      case 'primary':
      default:
        return {
          containerStyle: {
            backgroundColor: colors.primary,
            borderWidth: 0,
          } as ViewStyle,
          textColor: colors.textOnPrimary,
          pressedOverlay: 'rgba(14, 116, 144, 0.35)',
        };
    }
  }, [variant]);

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      onPress={onPress}
      disabled={isDisabled}
      android_ripple={
        variant === 'primary'
          ? { color: 'rgba(255,255,255,0.25)', borderless: false }
          : { color: 'rgba(8, 145, 178, 0.15)', borderless: false }
      }
      style={({ pressed }) => [
        styles.base,
        {
          minHeight: heightBySize[size],
          paddingHorizontal: paddingBySize[size],
          width: fullWidth ? '100%' : undefined,
          opacity: isDisabled ? 0.55 : 1,
        },
        containerStyle,
        pressed && !isDisabled
          ? { backgroundColor: blend(containerStyle.backgroundColor, pressedOverlay) }
          : null,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <View style={styles.content}>
          {leftIcon ? <View style={styles.iconLeft}>{leftIcon}</View> : null}
          <Text
            numberOfLines={1}
            style={[
              textStyles.button,
              { color: textColor },
              size === 'sm' ? { fontSize: 14 } : null,
              labelStyle,
            ]}
          >
            {label}
          </Text>
          {rightIcon ? <View style={styles.iconRight}>{rightIcon}</View> : null}
        </View>
      )}
    </Pressable>
  );
};

/**
 * Visually darken transparent backgrounds when pressed. For solid
 * backgrounds we just overlay the supplied color string.
 */
const blend = (
  background: ViewStyle['backgroundColor'],
  overlay: string
): ViewStyle['backgroundColor'] => {
  if (!background || background === 'transparent') {
    return overlay;
  }
  return overlay;
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.base,
    alignSelf: 'flex-start',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: spacing.sm,
  },
  iconLeft: {
    marginEnd: spacing.xs,
  },
  iconRight: {
    marginStart: spacing.xs,
  },
});

export default Button;
