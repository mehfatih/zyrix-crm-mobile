import React, { ReactNode } from 'react';
import { View, ViewStyle } from 'react-native';
import { darkColors, accents, type AccentColor, shadows, radius, spacing } from '../../theme/dark';

type CardProps = {
  children: ReactNode;
  /** Tint with a page accent — uses bgSoft + border. Omit for plain card. */
  accent?: AccentColor;
  /** Add a subtle elevation shadow. Default: false (flat card). */
  elevated?: boolean;
  /** Override padding. Default: spacing.base (16). */
  padding?: number;
  style?: ViewStyle;
};

export function Card({
  children,
  accent,
  elevated = false,
  padding = spacing.base,
  style,
}: CardProps) {
  const accentShade = accent ? accents[accent] : null;

  const cardStyle: ViewStyle = {
    backgroundColor: accentShade ? accentShade.bgSoft : darkColors.surface,
    borderColor: accentShade ? accentShade.border : darkColors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding,
  };

  return (
    <View style={[cardStyle, elevated && (shadows.card as ViewStyle), style]}>
      {children}
    </View>
  );
}
