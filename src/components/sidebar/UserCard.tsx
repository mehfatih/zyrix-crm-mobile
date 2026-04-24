/**
 * UserCard — top-of-sidebar identity block.
 *
 * Layout: 44px avatar circle with a green online ring, two stacked
 * lines (name + "company · plan"), and a coloured plan badge whose
 * accent depends on the active subscription tier.
 *
 * Tap opens the merchant Profile screen (handled by the parent).
 */

import React from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { colors } from '../../constants/colors';
import { radius, spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';

export type PlanTier =
  | 'free'
  | 'starter'
  | 'pro'
  | 'business'
  | 'enterprise';

interface PlanStyle {
  bg: string;
  fg: string;
}

const PLAN_PALETTE: Record<PlanTier, PlanStyle> = {
  free: { bg: colors.mintSoft, fg: colors.mint },
  starter: { bg: colors.skySoft, fg: colors.primary },
  pro: { bg: colors.primarySoft, fg: colors.primaryDark },
  business: { bg: colors.sunshineSoft, fg: colors.sunshine },
  enterprise: { bg: colors.lavenderSoft, fg: colors.lavender },
};

export interface UserCardProps {
  name: string;
  companyName: string;
  plan: PlanTier;
  planLabel: string;
  avatarUri?: string | null;
  online?: boolean;
  onPress?: () => void;
}

const initialsFor = (name: string): string =>
  name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'Z';

export const UserCard: React.FC<UserCardProps> = ({
  name,
  companyName,
  plan,
  planLabel,
  avatarUri,
  online = true,
  onPress,
}) => {
  const palette = PLAN_PALETTE[plan];

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${name} — ${companyName}`}
      style={({ pressed }) => [
        styles.card,
        pressed && onPress ? { opacity: 0.85 } : null,
      ]}
    >
      <View style={styles.avatarWrap}>
        {avatarUri ? (
          <Image
            source={{ uri: avatarUri }}
            style={styles.avatar}
            accessibilityIgnoresInvertColors
          />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarInitials}>{initialsFor(name)}</Text>
          </View>
        )}
        {online ? <View style={styles.statusRing} /> : null}
      </View>
      <View style={styles.text}>
        <Text numberOfLines={1} style={styles.name}>
          {name}
        </Text>
        <View style={styles.subRow}>
          <Text numberOfLines={1} style={styles.companyText}>
            {companyName}
          </Text>
          <View
            style={[styles.planBadge, { backgroundColor: palette.bg }]}
          >
            <Text style={[styles.planText, { color: palette.fg }]}>
              {planLabel}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  avatarWrap: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceAlt,
  },
  avatarFallback: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    ...textStyles.h4,
    color: colors.white,
  },
  statusRing: {
    position: 'absolute',
    bottom: 1,
    end: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  text: {
    flex: 1,
    rowGap: 2,
  },
  name: {
    ...textStyles.bodyMedium,
    color: colors.textHeading,
    fontWeight: '700',
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.xs,
  },
  companyText: {
    ...textStyles.caption,
    color: colors.textMuted,
    flexShrink: 1,
  },
  planBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  planText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

export default UserCard;
