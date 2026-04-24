/**
 * SidebarItem — single row in the SmartSidebar.
 *
 * Variants:
 *   - default        → icon + label, optional badge
 *   - active         → 3px coloured left bar + tinted background (8% accent)
 *   - pinned         → small coral dot inside the row
 *
 * Long-press fires `onLongPress` so the parent can show a Pin/Unpin
 * action sheet without each item caring about pin state.
 */

import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { Icon, type AnyIconName } from '../common/Icon';
import { colors } from '../../constants/colors';
import { radius, spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';

export type SidebarAccent = 'mint' | 'coral' | 'lavender' | 'sky' | 'cyan';

export const ACCENT_COLOR: Record<SidebarAccent, string> = {
  mint: colors.mint,
  coral: colors.coral,
  lavender: colors.lavender,
  sky: colors.sky,
  cyan: colors.primary,
};

const accentTint = (accent: SidebarAccent): string => {
  // 8% opacity tint for the active background. We hard-code the rgba
  // values to avoid pulling in a colour-mixing library.
  switch (accent) {
    case 'mint':
      return 'rgba(52, 211, 153, 0.10)';
    case 'coral':
      return 'rgba(251, 113, 133, 0.10)';
    case 'lavender':
      return 'rgba(167, 139, 250, 0.10)';
    case 'sky':
      return 'rgba(125, 211, 252, 0.16)';
    case 'cyan':
    default:
      return 'rgba(8, 145, 178, 0.10)';
  }
};

export interface SidebarItemProps {
  label: string;
  icon: AnyIconName;
  accent?: SidebarAccent;
  active?: boolean;
  badge?: number;
  badgeTone?: 'coral' | 'peach';
  pinned?: boolean;
  onPress: () => void;
  onLongPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const SidebarItem: React.FC<SidebarItemProps> = ({
  label,
  icon,
  accent = 'cyan',
  active = false,
  badge,
  badgeTone = 'coral',
  pinned = false,
  onPress,
  onLongPress,
  style,
}) => {
  const accentColor = ACCENT_COLOR[accent];
  const iconColor = active ? accentColor : colors.textSecondary;
  const labelColor = active ? colors.textHeading : colors.textPrimary;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={350}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [
        styles.row,
        active ? { backgroundColor: accentTint(accent) } : null,
        pressed ? { opacity: 0.85 } : null,
        style,
      ]}
    >
      {active ? (
        <View style={[styles.accentBar, { backgroundColor: accentColor }]} />
      ) : (
        <View style={styles.accentBarEmpty} />
      )}
      <Icon name={icon} size={20} color={iconColor} />
      <Text
        numberOfLines={1}
        style={[
          styles.label,
          { color: labelColor },
          active ? styles.labelActive : null,
        ]}
      >
        {label}
      </Text>
      {pinned ? <View style={styles.pinDot} /> : null}
      {typeof badge === 'number' && badge > 0 ? (
        <View
          style={[
            styles.badge,
            {
              backgroundColor:
                badgeTone === 'peach' ? colors.peach : colors.coral,
            },
          ]}
        >
          <Text style={styles.badgeText}>
            {badge > 99 ? '99+' : String(badge)}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 40,
    paddingVertical: spacing.sm,
    paddingEnd: spacing.base,
    borderRadius: radius.md,
    columnGap: spacing.md,
  },
  accentBar: {
    width: 3,
    alignSelf: 'stretch',
    marginEnd: spacing.sm,
    borderRadius: 2,
  },
  accentBarEmpty: {
    width: 3,
    marginEnd: spacing.sm,
  },
  label: {
    ...textStyles.bodyMedium,
    flex: 1,
  },
  labelActive: {
    fontWeight: '700',
  },
  pinDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.coral,
    marginEnd: spacing.xs,
  },
  badge: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
});

export default SidebarItem;
