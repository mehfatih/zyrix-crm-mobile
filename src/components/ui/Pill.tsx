import React from 'react';
import { StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { accents, statusColors, type AccentColor, type StatusKind, radius, typography } from '../../theme/dark';

type PillSize = 'sm' | 'md';

type PillProps =
  | { variant: 'accent'; accent: AccentColor; label: string; size?: PillSize; style?: ViewStyle }
  | { variant: 'status'; status: StatusKind; label: string; size?: PillSize; style?: ViewStyle };

export function Pill(props: PillProps) {
  const size: PillSize = props.size ?? 'sm';
  const sizeTokens = SIZE[size];

  const shade =
    props.variant === 'accent'
      ? accents[props.accent]
      : statusColors[props.status];

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: shade.bgTint,
          borderColor: shade.border,
          paddingVertical: sizeTokens.paddingVertical,
          paddingHorizontal: sizeTokens.paddingHorizontal,
          borderRadius: radius.pill,
        },
        props.style,
      ]}
    >
      <Text
        style={[styles.label, { color: shade.text, fontSize: sizeTokens.fontSize }]}
        numberOfLines={1}
      >
        {props.label}
      </Text>
    </View>
  );
}

const SIZE = {
  sm: { paddingVertical: 2, paddingHorizontal: 8,  fontSize: typography.size.xs },
  md: { paddingVertical: 4, paddingHorizontal: 12, fontSize: typography.size.sm },
};

const styles = StyleSheet.create({
  base: { borderWidth: 1, alignSelf: 'flex-start' },
  label: { fontWeight: '700' as TextStyle['fontWeight'] },
});
