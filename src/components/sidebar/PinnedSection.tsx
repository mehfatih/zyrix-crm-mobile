/**
 * PinnedSection — user-customisable favourites block at the top of the
 * SmartSidebar. Each entry mirrors a sidebar destination with the same
 * icon and accent, plus a coral pin dot to mark it as pinned.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Icon } from '../common/Icon';
import { SidebarItem, type SidebarAccent } from './SidebarItem';
import type { AnyIconName } from '../common/Icon';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';

export interface PinnedEntry {
  route: string;
  label: string;
  icon: AnyIconName;
  accent?: SidebarAccent;
}

export interface PinnedSectionProps {
  entries: readonly PinnedEntry[];
  activeRoute: string | null;
  onSelect: (route: string) => void;
  onLongPress?: (route: string) => void;
}

export const PinnedSection: React.FC<PinnedSectionProps> = ({
  entries,
  activeRoute,
  onSelect,
  onLongPress,
}) => {
  const { t } = useTranslation();

  if (entries.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Icon name="star" size={14} color={colors.coral} />
        <Text style={styles.title}>{t('sidebar.pinned')}</Text>
      </View>
      <View style={styles.list}>
        {entries.map((entry) => (
          <SidebarItem
            key={entry.route}
            label={entry.label}
            icon={entry.icon}
            accent={entry.accent ?? 'cyan'}
            active={activeRoute === entry.route}
            pinned
            onPress={() => onSelect(entry.route)}
            onLongPress={onLongPress ? () => onLongPress(entry.route) : undefined}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    marginTop: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.xs,
    paddingHorizontal: spacing.base,
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.4,
  },
  list: {
    rowGap: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
});

export default PinnedSection;
