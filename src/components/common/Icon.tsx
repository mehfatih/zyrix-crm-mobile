/**
 * Icon — thin wrapper around @expo/vector-icons.
 *
 * Picks one of three families (Ionicons, MaterialIcons, MaterialCommunityIcons)
 * and forwards the `name`/`size`/`color` props. The wrapper keeps import sites
 * short and lets us swap the underlying icon set without a mass refactor.
 *
 * Note: each family has a different, very large union of valid names.
 * We use family-specific `ComponentProps` so TypeScript still validates
 * `name` against the chosen family — the signature below narrows the
 * icon props on demand.
 */

import React from 'react';
import type { ComponentProps } from 'react';
import type { StyleProp, TextStyle } from 'react-native';
import {
  Ionicons,
  MaterialIcons,
  MaterialCommunityIcons,
} from '@expo/vector-icons';

import { colors } from '../../constants/colors';

export type IconFamily = 'Ionicons' | 'MaterialIcons' | 'MaterialCommunityIcons';

type IoniconName = ComponentProps<typeof Ionicons>['name'];
type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];
type MaterialCommunityIconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export type AnyIconName =
  | IoniconName
  | MaterialIconName
  | MaterialCommunityIconName;

export interface IconProps {
  name: AnyIconName;
  family?: IconFamily;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
  testID?: string;
  accessibilityLabel?: string;
}

const DEFAULT_SIZE = 24;

export const Icon: React.FC<IconProps> = ({
  name,
  family = 'Ionicons',
  size = DEFAULT_SIZE,
  color = colors.textPrimary,
  style,
  testID,
  accessibilityLabel,
}) => {
  const common = {
    size,
    color,
    style,
    testID,
    accessibilityLabel,
  } as const;

  switch (family) {
    case 'MaterialIcons':
      return <MaterialIcons name={name as MaterialIconName} {...common} />;
    case 'MaterialCommunityIcons':
      return (
        <MaterialCommunityIcons
          name={name as MaterialCommunityIconName}
          {...common}
        />
      );
    case 'Ionicons':
    default:
      return <Ionicons name={name as IoniconName} {...common} />;
  }
};

export default Icon;
