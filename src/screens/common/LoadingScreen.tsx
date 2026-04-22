/**
 * LoadingScreen — full-screen cyan gradient with a Zyrix mark and a
 * spinner. Used by the root navigator while stores hydrate and
 * between auth transitions.
 */

import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

import { colors } from '../../constants/colors';
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
      colors={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.logoCard}>
        <Text style={styles.logoMark}>Z</Text>
      </View>
      <Text style={styles.brand}>{t('common.appName')}</Text>
      <ActivityIndicator color={colors.white} style={styles.loader} />
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
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    ...shadows.lg,
  },
  logoMark: {
    fontSize: 54,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -1,
  },
  brand: {
    ...textStyles.h2,
    color: colors.white,
    letterSpacing: 1,
  },
  loader: {
    marginTop: spacing.xl,
  },
  caption: {
    ...textStyles.caption,
    color: colors.primarySoft,
    marginTop: spacing.md,
  },
});

export default LoadingScreen;
