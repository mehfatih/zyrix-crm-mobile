/**
 * CustomerDashboardScreen — landing screen of the customer portal.
 * Shows a welcome greeting plus a summary card with the customer's
 * company association. Real account widgets land in Sprint 7.
 */

import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Header } from '../../components/common/Header';
import { Icon } from '../../components/common/Icon';
import { darkColors } from '../../theme/dark';
import { radius, shadows, spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';
import { useUserStore } from '../../store/userStore';

export const CustomerDashboardScreen: React.FC = () => {
  const { t } = useTranslation();
  const currentUser = useUserStore((s) => s.currentUser);
  const firstName = currentUser?.name?.split(' ')[0] ?? t('common.appName');
  const company = currentUser?.companyId ?? t('customer.noCompany');

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <Header title={t('navigation.customerHome')} showBack={false} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.welcome}>
          <Text style={styles.welcomeEyebrow}>{t('dashboard.welcomeBack')}</Text>
          <Text style={styles.welcomeName}>
            {t('dashboard.welcomeName', { name: firstName })}
          </Text>
        </View>

        <View style={styles.companyCard}>
          <View style={styles.companyIcon}>
            <Icon name="business-outline" size={24} color={darkColors.primary} />
          </View>
          <View style={styles.companyText}>
            <Text style={styles.companyLabel}>{t('customer.yourCompany')}</Text>
            <Text numberOfLines={1} style={styles.companyValue}>
              {company}
            </Text>
          </View>
        </View>

        <View style={styles.placeholderCard}>
          <Icon name="rocket-outline" size={40} color={darkColors.primary} />
          <Text style={styles.placeholderTitle}>
            {t('navigation.customerHome')}
          </Text>
          <Text style={styles.placeholderSubtitle}>
            {t('placeholders.comingInSprint', { sprint: 7 })}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: darkColors.background,
  },
  scroll: {
    padding: spacing.base,
    rowGap: spacing.base,
    paddingBottom: spacing.xxl,
  },
  welcome: {
    backgroundColor: darkColors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    ...shadows.sm,
  },
  welcomeEyebrow: {
    ...textStyles.overline,
    color: darkColors.primary,
  },
  welcomeName: {
    ...textStyles.h2,
    color: darkColors.textPrimary,
    marginTop: spacing.xs,
  },
  companyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.md,
    padding: spacing.base,
    borderRadius: radius.lg,
    backgroundColor: darkColors.surface,
    ...shadows.xs,
  },
  companyIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: darkColors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  companyText: {
    flex: 1,
  },
  companyLabel: {
    ...textStyles.caption,
    color: darkColors.textMuted,
  },
  companyValue: {
    ...textStyles.bodyMedium,
    color: darkColors.textPrimary,
    marginTop: 2,
  },
  placeholderCard: {
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: darkColors.surface,
    borderRadius: radius.xl,
    rowGap: spacing.sm,
    ...shadows.xs,
  },
  placeholderTitle: {
    ...textStyles.h4,
    color: darkColors.textPrimary,
  },
  placeholderSubtitle: {
    ...textStyles.caption,
    color: darkColors.textMuted,
  },
});

export default CustomerDashboardScreen;
