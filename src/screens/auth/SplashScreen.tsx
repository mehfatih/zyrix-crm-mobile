/**
 * Splash screen — shown while the app bootstraps (i18n + auth hydration).
 * Cyan gradient background with a centered Zyrix logo placeholder.
 */

import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

import { colors } from '../../constants/colors';
import { spacing, radius, shadows } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';

export const SplashScreen: React.FC = () => {
  const { t } = useTranslation();

  return (
    <LinearGradient
      colors={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.logoCard}>
        <Text style={styles.logoMark}>Z</Text>
      </View>
      <Text style={styles.brand}>{t('common.appName')}</Text>
      <Text style={styles.tagline}>{t('auth.welcome')}</Text>
      <ActivityIndicator color={colors.white} style={styles.loader} />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  logoCard: {
    width: 112,
    height: 112,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    ...shadows.lg,
  },
  logoMark: {
    fontSize: 64,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -2,
  },
  brand: {
    ...textStyles.h1,
    color: colors.white,
    letterSpacing: 1,
  },
  tagline: {
    ...textStyles.body,
    color: colors.primarySoft,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  loader: {
    marginTop: spacing.xxl,
  },
});

export default SplashScreen;
