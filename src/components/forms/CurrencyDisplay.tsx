/**
 * CurrencyDisplay — pretty-prints a monetary amount using the active
 * country configuration. Symbol/number order is RTL-aware because
 * `Intl.NumberFormat` with an Arabic locale already returns the right
 * layout (symbol after number) so we just render it as-is and let RN
 * handle the bidi string.
 */

import React from 'react';
import { StyleSheet, Text, type StyleProp, type TextStyle } from 'react-native';

import { colors } from '../../constants/colors';
import { useCountryConfig } from '../../hooks/useCountryConfig';

export type CurrencyDisplaySize = 'small' | 'medium' | 'large';

export interface CurrencyDisplayProps {
  amount: number;
  size?: CurrencyDisplaySize;
  color?: string;
  style?: StyleProp<TextStyle>;
  testID?: string;
}

const sizeToStyle: Record<CurrencyDisplaySize, TextStyle> = {
  small: { fontSize: 14, fontWeight: '500' },
  medium: { fontSize: 16, fontWeight: '600' },
  large: { fontSize: 24, fontWeight: '700' },
};

export const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({
  amount,
  size = 'medium',
  color,
  style,
  testID,
}) => {
  const { formatCurrency } = useCountryConfig();

  return (
    <Text
      testID={testID}
      style={[
        styles.base,
        sizeToStyle[size],
        { color: color ?? colors.textPrimary },
        style,
      ]}
      numberOfLines={1}
    >
      {formatCurrency(amount)}
    </Text>
  );
};

const styles = StyleSheet.create({
  base: {
    // Let Intl handle bidi; writingDirection auto keeps mixed strings sane.
    writingDirection: 'auto',
  },
});

export default CurrencyDisplay;
