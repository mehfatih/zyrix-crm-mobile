import React from 'react';
import { View, ViewStyle } from 'react-native';
import { darkColors } from '../../theme/dark';

type DividerProps = {
  orientation?: 'horizontal' | 'vertical';
  thickness?: number;
  color?: string;
  style?: ViewStyle;
};

export function Divider({
  orientation = 'horizontal',
  thickness = 1,
  color = darkColors.border,
  style,
}: DividerProps) {
  return (
    <View
      style={[
        orientation === 'horizontal'
          ? { height: thickness, width: '100%', backgroundColor: color }
          : { width: thickness, height: '100%', backgroundColor: color },
        style,
      ]}
    />
  );
}
