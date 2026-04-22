/**
 * PlaceholderCustomerScreen — reusable customer-portal placeholder.
 * Same shape as the merchant placeholder but lives in the customer
 * namespace so future customer-specific theming is a single-file change.
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

export interface PlaceholderCustomerScreenProps {
  title: string;
  sprint?: number | string;
  icon?: AnyIconName;
  iconFamily?: IconFamily;
  description?: string;
}

export const PlaceholderCustomerScreen: React.FC<PlaceholderCustomerScreenProps> = ({
  title,
  sprint = 7,
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
          <Icon name={icon} family={iconFamily} size={54} color={colors.primary} />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>
          {t('placeholders.comingInSprint', { sprint })}
        </Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
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
    width: 110,
    height: 110,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
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
  },
});

export default PlaceholderCustomerScreen;
