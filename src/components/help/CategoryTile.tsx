/**
 * CategoryTile — two-column grid tile on the Help home screen.
 *
 * Uses the docs accent colour to tint the icon chip and border glow.
 * Tap opens the matching category screen. Article count defaults to
 * single-line "N articles" (translated).
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon, type AnyIconName } from '../common/Icon';
import { colors } from '../../constants/colors';
import { radius, shadows, spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';
import type { DocsAccent } from '../../services/docsApi';

interface CategoryTileProps {
  title: string;
  icon: AnyIconName;
  accent: DocsAccent;
  articleCountLabel: string;
  description?: string;
  onPress: () => void;
}

const ACCENTS: Record<DocsAccent, { bg: string; fg: string }> = {
  mint: { bg: colors.mintSoft, fg: colors.mint },
  coral: { bg: colors.coralSoft, fg: colors.coral },
  lavender: { bg: colors.lavenderSoft, fg: colors.lavender },
  sky: { bg: colors.skySoft, fg: colors.primary },
  teal: { bg: colors.tealSoft, fg: colors.teal },
  peach: { bg: colors.peachSoft, fg: colors.peach },
  sunshine: { bg: colors.sunshineSoft, fg: colors.sunshine },
  rose: { bg: colors.roseSoft, fg: colors.rose },
};

export const CategoryTile: React.FC<CategoryTileProps> = ({
  title,
  icon,
  accent,
  articleCountLabel,
  description,
  onPress,
}) => {
  const palette = ACCENTS[accent];
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        { borderColor: palette.bg },
        pressed ? styles.pressed : null,
      ]}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View style={[styles.iconWrap, { backgroundColor: palette.bg }]}>
        <Icon name={icon} size={24} color={palette.fg} />
      </View>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <Text style={styles.count} numberOfLines={1}>
        {articleCountLabel}
      </Text>
      {description ? (
        <Text style={styles.description} numberOfLines={2}>
          {description}
        </Text>
      ) : null}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minWidth: '46%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    padding: spacing.base,
    rowGap: spacing.xs,
    ...shadows.xs,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxs,
  },
  title: {
    ...textStyles.bodyMedium,
    color: colors.textHeading,
    fontWeight: '700',
  },
  count: {
    ...textStyles.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  description: {
    ...textStyles.caption,
    color: colors.textMuted,
  },
});

export default CategoryTile;
