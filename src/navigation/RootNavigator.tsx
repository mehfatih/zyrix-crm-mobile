/**
 * RootNavigator — switches between the auth flow and the main app
 * flow based on authentication state. While stores hydrate we show the
 * SplashScreen so the very first frame is never a blank screen.
 */

import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Button } from '../components/common/Button';
import { AuthNavigator } from './AuthNavigator';
import { SplashScreen } from '../screens/auth/SplashScreen';
import { colors } from '../constants/colors';
import { radius, shadows, spacing } from '../constants/spacing';
import { textStyles } from '../constants/typography';
import { useAuthStore } from '../store/authStore';
import { useUiStore } from '../store/uiStore';

/**
 * Placeholder for the post-login experience. The real AppNavigator
 * arrives in Sprint 2; this keeps the root switch functional.
 */
const AuthenticatedPlaceholder: React.FC = () => {
  const { t } = useTranslation();
  const logout = useAuthStore((s) => s.logout);

  return (
    <SafeAreaView style={placeholderStyles.safe} edges={['top', 'bottom']}>
      <View style={placeholderStyles.card}>
        <Text style={placeholderStyles.title}>{t('common.appName')}</Text>
        <Text style={placeholderStyles.body}>
          {t('common.success')} — {t('auth.welcome')}
        </Text>
        <Button
          label={t('auth.logout')}
          variant="outline"
          onPress={() => void logout()}
          style={placeholderStyles.button}
        />
      </View>
    </SafeAreaView>
  );
};

export const RootNavigator: React.FC = () => {
  const authHasHydrated = useAuthStore((s) => s.hasHydrated);
  const uiHasHydrated = useUiStore((s) => s.hasHydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hydrateAuth = useAuthStore((s) => s.hydrate);
  const hydrateUi = useUiStore((s) => s.hydrate);

  useEffect(() => {
    void hydrateAuth();
    void hydrateUi();
  }, [hydrateAuth, hydrateUi]);

  if (!authHasHydrated || !uiHasHydrated) {
    return <SplashScreen />;
  }

  return isAuthenticated ? <AuthenticatedPlaceholder /> : <AuthNavigator />;
};

const placeholderStyles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    rowGap: spacing.md,
    ...shadows.md,
  },
  title: {
    ...textStyles.h2,
    color: colors.primary,
  },
  body: {
    ...textStyles.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  button: {
    marginTop: spacing.md,
    alignSelf: 'stretch',
  },
});

export default RootNavigator;
