/**
 * PlaceholderScreen — reusable "coming soon" stub for merchant screens
 * that will be fleshed out in later sprints.
 *
 * Shows a cyan Header (with back button), a centered icon, a translated
 * title, and a "Coming in Sprint X" subtitle.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { Header } from '../../components/common/Header';
import { Icon, type AnyIconName, type IconFamily } from '../../components/common/Icon';
import { colors } from '../../constants/colors';
import { radius, spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';

export interface PlaceholderScreenProps {
  /** Already-translated title (prefer passing through t('navigation.x')). */
  title: string;
  /** Sprint number, rendered into the "Coming in Sprint X" copy. */
  sprint: number | string;
  icon?: AnyIconName;
  iconFamily?: IconFamily;
  description?: string;
}

export const PlaceholderScreen: React.FC<PlaceholderScreenProps> = ({
  title,
  sprint,
  icon = 'sparkles-outline',
  iconFamily = 'Ionicons',
  description,
}) => {
  const { t } = useTranslation();
  const navigation = useNavigation();

  const canGoBack = navigation.canGoBack();

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <Header
        title={title}
        showBack={canGoBack}
        onBack={canGoBack ? () => navigation.goBack() : undefined}
      />
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Icon name={icon} family={iconFamily} size={56} color={colors.primary} />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>
          {t('placeholders.comingInSprint', { sprint })}
        </Text>
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
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    rowGap: spacing.md,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.base,
  },
  title: {
    ...textStyles.h2,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    ...textStyles.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
  description: {
    ...textStyles.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});

export default PlaceholderScreen;
