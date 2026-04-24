/**
 * ArticleCard — list-style card used on the category screen, popular
 * articles row, and search results. Shows title, 2-line snippet, read
 * time, and an "offline" chip when the article is cached in AsyncStorage.
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '../common/Icon';
import { colors } from '../../constants/colors';
import { radius, shadows, spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';

interface ArticleCardProps {
  title: string;
  snippet?: string;
  readTime?: string;
  offlineLabel?: string | null;
  onPress: () => void;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({
  title,
  snippet,
  readTime,
  offlineLabel,
  onPress,
}) => {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        pressed ? styles.pressed : null,
      ]}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        {snippet ? (
          <Text style={styles.snippet} numberOfLines={2}>
            {snippet}
          </Text>
        ) : null}
        <View style={styles.meta}>
          {readTime ? (
            <View style={styles.metaItem}>
              <Icon name="time-outline" size={14} color={colors.textMuted} />
              <Text style={styles.metaText}>{readTime}</Text>
            </View>
          ) : null}
          {offlineLabel ? (
            <View style={[styles.metaItem, styles.offlineChip]}>
              <Icon name="cloud-offline-outline" size={14} color={colors.mint} />
              <Text style={[styles.metaText, styles.offlineText]}>
                {offlineLabel}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
      <Icon name="chevron-forward" size={20} color={colors.textMuted} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    columnGap: spacing.sm,
    ...shadows.xs,
  },
  pressed: {
    opacity: 0.92,
  },
  body: {
    flex: 1,
    rowGap: spacing.xxs,
  },
  title: {
    ...textStyles.bodyMedium,
    color: colors.textHeading,
    fontWeight: '700',
  },
  snippet: {
    ...textStyles.caption,
    color: colors.textSecondary,
  },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: spacing.sm,
    rowGap: spacing.xxs,
    marginTop: spacing.xxs,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.xxs,
  },
  metaText: {
    ...textStyles.caption,
    color: colors.textMuted,
  },
  offlineChip: {
    backgroundColor: colors.mintSoft,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  offlineText: {
    color: colors.mint,
    fontWeight: '600',
  },
});

export default ArticleCard;
