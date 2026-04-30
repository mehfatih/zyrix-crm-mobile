/**
 * PlaceholderScreen — shared "coming soon" stub used by every
 * role navigator (admin / merchant / customer) while the real
 * screens are being built in later sprints.
 *
 * Header variants:
 *   - showBackButton=true (default)    → cyan Header with back chevron
 *   - showMenuButton=true              → cyan Header with hamburger (drawer)
 *
 * Either `sprintNumber` (canonical) or `sprint` (legacy alias) may be
 * passed; the subtitle renders as "Coming in Sprint {n}".
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { Header } from '../../components/common/Header';
import {
  Icon,
  type AnyIconName,
  type IconFamily,
} from '../../components/common/Icon';
import { darkColors } from '../../theme/dark';
import { hitSlop, radius, shadows, spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';

export interface PlaceholderScreenProps {
  /** Already-translated screen title. */
  title: string;
  /** Optional subtitle shown below the "Coming in Sprint X" line. */
  subtitle?: string;
  /** Icon to render in the top circle. Defaults to a generic sparkles glyph. */
  icon?: AnyIconName;
  iconFamily?: IconFamily;
  /** Sprint number reference. Canonical prop name. */
  sprintNumber?: number | string;
  /** Legacy alias for `sprintNumber`. */
  sprint?: number | string;
  /** When true, replaces the back chevron with a drawer-toggle hamburger. */
  showMenuButton?: boolean;
  /** Explicit "show back" flag — overrides the default (navigation.canGoBack). */
  showBackButton?: boolean;
  /** Additional free-form description text below the subtitle. */
  description?: string;
}

const MenuButton: React.FC<{ onPress: () => void; label: string }> = ({
  onPress,
  label,
}) => (
  <Pressable
    onPress={onPress}
    hitSlop={hitSlop.md}
    accessibilityRole="button"
    accessibilityLabel={label}
    style={({ pressed }) => [
      styles.menuButton,
      pressed ? styles.menuButtonPressed : null,
    ]}
  >
    <Icon name="menu-outline" size={26} color={darkColors.textOnPrimary} />
  </Pressable>
);

export const PlaceholderScreen: React.FC<PlaceholderScreenProps> = ({
  title,
  subtitle,
  icon = 'sparkles-outline',
  iconFamily = 'Ionicons',
  sprintNumber,
  sprint,
  showMenuButton = false,
  showBackButton,
  description,
}) => {
  const { t } = useTranslation();
  const navigation = useNavigation();

  const resolvedSprint = sprintNumber ?? sprint ?? '';
  const canGoBack = navigation.canGoBack();
  const showBack = showBackButton ?? (canGoBack && !showMenuButton);

  const openDrawer = (): void => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  const comingLine = resolvedSprint
    ? t('placeholders.comingInSprint', { sprint: resolvedSprint })
    : t('placeholders.featureNotReady');

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <Header
        title={title}
        showBack={showBack}
        onBack={showBack && canGoBack ? () => navigation.goBack() : undefined}
        leftSlot={
          showMenuButton ? (
            <MenuButton onPress={openDrawer} label={t('navigation.menu')} />
          ) : undefined
        }
      />
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Icon
            name={icon}
            family={iconFamily}
            size={52}
            color={darkColors.primary}
          />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitleComing}>{comingLine}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        {description ? (
          <Text style={styles.description}>{description}</Text>
        ) : null}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: darkColors.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    rowGap: spacing.sm,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: radius.full,
    backgroundColor: darkColors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.base,
    ...shadows.xs,
  },
  title: {
    ...textStyles.h2,
    color: darkColors.textPrimary,
    textAlign: 'center',
  },
  subtitleComing: {
    ...textStyles.body,
    color: darkColors.textMuted,
    textAlign: 'center',
  },
  subtitle: {
    ...textStyles.bodyMedium,
    color: darkColors.textSecondary,
    textAlign: 'center',
  },
  description: {
    ...textStyles.caption,
    color: darkColors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuButtonPressed: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
});

export default PlaceholderScreen;
