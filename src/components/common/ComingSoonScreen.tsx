/**
 * ComingSoonScreen — friendly placeholder used by every Sprint 2
 * sidebar destination that does not yet have a real implementation.
 *
 * Renders the standard cyan Header (with back arrow), a soft cyan
 * illustration circle, the screen title, and a fixed two-line
 * "Coming soon / We're crafting something great for you" message.
 * All copy comes from i18n so AR/EN/TR stay in sync.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { Header } from './Header';
import { Icon, type AnyIconName } from './Icon';
import { colors } from '../../constants/colors';
import { radius, shadows, spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';

export interface ComingSoonScreenProps {
  titleKey: string;
  icon?: AnyIconName;
  accent?: keyof typeof ACCENT_MAP;
}

const ACCENT_MAP = {
  mint: { soft: colors.mintSoft, strong: colors.mint },
  coral: { soft: colors.coralSoft, strong: colors.coral },
  lavender: { soft: colors.lavenderSoft, strong: colors.lavender },
  sky: { soft: colors.skySoft, strong: colors.sky },
  cyan: { soft: colors.primarySoft, strong: colors.primary },
} as const;

export const ComingSoonScreen: React.FC<ComingSoonScreenProps> = ({
  titleKey,
  icon = 'sparkles-outline',
  accent = 'cyan',
}) => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const palette = ACCENT_MAP[accent];

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <Header
        title={t(titleKey)}
        showBack
        onBack={() => navigation.goBack()}
      />
      <View style={styles.content}>
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: palette.soft },
          ]}
        >
          <Icon name={icon} size={56} color={palette.strong} />
        </View>
        <Text style={styles.title}>{t('sidebar.comingSoonTitle')}</Text>
        <Text style={styles.subtitle}>{t('sidebar.comingSoonSubtitle')}</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    rowGap: spacing.sm,
  },
  iconCircle: {
    width: 132,
    height: 132,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    ...shadows.xs,
  },
  title: {
    ...textStyles.h2,
    color: colors.textHeading,
    textAlign: 'center',
  },
  subtitle: {
    ...textStyles.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});

export default ComingSoonScreen;
