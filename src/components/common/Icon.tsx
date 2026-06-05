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
import { I18nManager } from 'react-native';
import type { StyleProp, TextStyle } from 'react-native';
import {
  Ionicons,
  MaterialIcons,
  MaterialCommunityIcons,
} from '@expo/vector-icons';

import { colors } from '../../constants/colors';

// Horizontal directional chevrons read in the layout direction, so they must
// mirror under RTL (a trailing disclosure chevron points left in Arabic).
// Centralising the flip here keeps every call site correct without per-site
// ternaries; pass `noFlip` for the rare decorative chevron that must not turn.
const RTL_CHEVRON_FLIP: Record<string, string> = {
  'chevron-forward': 'chevron-back',
  'chevron-back': 'chevron-forward',
  'chevron-left': 'chevron-right',
  'chevron-right': 'chevron-left',
};

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
  /** Opt out of automatic RTL chevron mirroring (rare; decorative chevrons). */
  noFlip?: boolean;
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
  noFlip = false,
}) => {
  const common = {
    size,
    color,
    style,
    testID,
    accessibilityLabel,
  } as const;

  const resolvedName =
    !noFlip && I18nManager.isRTL && RTL_CHEVRON_FLIP[name as string]
      ? (RTL_CHEVRON_FLIP[name as string] as AnyIconName)
      : name;

  switch (family) {
    case 'MaterialIcons':
      return <MaterialIcons name={resolvedName as MaterialIconName} {...common} />;
    case 'MaterialCommunityIcons':
      return (
        <MaterialCommunityIcons
          name={resolvedName as MaterialCommunityIconName}
          {...common}
        />
      );
    case 'Ionicons':
    default:
      return <Ionicons name={resolvedName as IoniconName} {...common} />;
  }
};

export default Icon;
