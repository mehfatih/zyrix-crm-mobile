/**
 * LoadingScreen — full-screen cyan gradient with a Zyrix mark and a
 * spinner. Used by the root navigator while stores hydrate and
 * between auth transitions.
 */

import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

import { darkColors } from '../../theme/dark';
import { radius, shadows, spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';

export interface LoadingScreenProps {
  /** Override the default "Loading…" caption. */
  message?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ message }) => {
  const { t } = useTranslation();

  return (
    <LinearGradient
      colors={[darkColors.gradientStart, darkColors.gradientMid, darkColors.gradientEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.logoCard}>
        <Text style={styles.logoMark}>Z</Text>
      </View>
      <Text style={styles.brand}>{t('common.appName')}</Text>
      <ActivityIndicator color={darkColors.textOnPrimary} style={styles.loader} />
      <Text style={styles.caption}>{message ?? t('common.loading')}</Text>
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
    width: 96,
    height: 96,
    borderRadius: radius.xl,
    backgroundColor: darkColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    ...shadows.lg,
  },
  logoMark: {
    fontSize: 54,
    fontWeight: '800',
    color: darkColors.primary,
    letterSpacing: -1,
  },
  brand: {
    ...textStyles.h2,
    color: darkColors.textOnPrimary,
    letterSpacing: 1,
  },
  loader: {
    marginTop: spacing.xl,
  },
  caption: {
    ...textStyles.caption,
    color: darkColors.primarySoft,
    marginTop: spacing.md,
  },
});

export default LoadingScreen;
