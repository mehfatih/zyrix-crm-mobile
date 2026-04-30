import React, { ReactNode } from 'react';
import { View, ViewStyle } from 'react-native';
import { accents, type AccentColor, radius } from '../../theme/dark';

type IconTileProps = {
  /** A vector icon — parent provides size and color. */
  icon: ReactNode;
  accent: AccentColor;
  /** Tile size in px. Default 40. */
  size?: number;
  style?: ViewStyle;
};

export function IconTile({ icon, accent, size = 40, style }: IconTileProps) {
  const shade = accents[accent];
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: radius.base,
          backgroundColor: shade.bgTint,
          borderWidth: 1,
          borderColor: shade.border,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      {icon}
    </View>
  );
}
