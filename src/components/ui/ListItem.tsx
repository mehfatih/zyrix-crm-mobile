import React, { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { darkColors, spacing, typography, radius } from '../../theme/dark';

type Position = 'single' | 'first' | 'middle' | 'last';

type ListItemProps = {
  title: string;
  subtitle?: string;
  leadingIcon?: ReactNode;
  trailingValue?: string;
  onPress?: () => void;
  showChevron?: boolean;
  position?: Position;
  style?: ViewStyle;
  testID?: string;
};

export function ListItem({
  title,
  subtitle,
  leadingIcon,
  trailingValue,
  onPress,
  showChevron,
  position = 'single',
  style,
  testID,
}: ListItemProps) {
  const showChevronEffective = showChevron ?? !!onPress;

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: pressed ? darkColors.surfaceAlt : darkColors.surface,
          borderTopLeftRadius:  position === 'first' || position === 'single' ? radius.base : 0,
          borderTopRightRadius: position === 'first' || position === 'single' ? radius.base : 0,
          borderBottomLeftRadius:  position === 'last' || position === 'single' ? radius.base : 0,
          borderBottomRightRadius: position === 'last' || position === 'single' ? radius.base : 0,
          borderTopWidth: position === 'first' || position === 'single' ? 1 : 0,
          borderBottomWidth: 1,
          borderLeftWidth: 1,
          borderRightWidth: 1,
          borderColor: darkColors.border,
        },
        style,
      ]}
    >
      {leadingIcon && <View style={styles.leading}>{leadingIcon}</View>}

      <View style={styles.center}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {subtitle && <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>}
      </View>

      {trailingValue && <Text style={styles.trailingValue}>{trailingValue}</Text>}

      {showChevronEffective && (
        <Feather name="chevron-right" size={18} color={darkColors.textMuted} style={styles.chevron} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: spacing.base,
    minHeight: 56,
  },
  leading: { marginEnd: spacing.sm },
  center: { flex: 1, justifyContent: 'center' },
  title: {
    color: darkColors.textPrimary,
    fontSize: typography.size.base,
    fontWeight: '600',
  },
  subtitle: {
    color: darkColors.textMuted,
    fontSize: typography.size.sm,
    marginTop: 2,
  },
  trailingValue: {
    color: darkColors.textMuted,
    fontSize: typography.size.sm,
    marginEnd: 4,
  },
  chevron: { marginStart: 4 },
});
