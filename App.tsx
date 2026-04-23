/**
 * App entry. Sprint 9 adds security-layer plumbing on top of the
 * Sprint 1/5 foundation:
 *
 *   - `InactivityTracker` wraps the navigator so every touch resets
 *     the session timer.
 *   - `sessionManager.startInactivityTimer` runs once on mount, and
 *     the registered listener renders `<ReAuthScreen />` as a modal
 *     overlay when the session expires.
 *   - `jailbreakDetection.isCompromised()` runs before navigation
 *     renders; if true, the tree is replaced with `<SecurityBlockScreen />`.
 */

import 'react-native-gesture-handler';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  MD3LightTheme,
  PaperProvider,
  configureFonts,
} from 'react-native-paper';
import * as SplashScreen from 'expo-splash-screen';

import './src/i18n';
import { InactivityTracker } from './src/components/common/InactivityTracker';
import { ReAuthScreen } from './src/screens/common/ReAuthScreen';
import { SecurityBlockScreen } from './src/screens/common/SecurityBlockScreen';
import { Toast } from './src/components/common/Toast';
import { colors } from './src/constants/colors';
import { isCompromised } from './src/utils/jailbreakDetection';
import { logSecurityEvent } from './src/utils/securityEvents';
import {
  onSessionTimeout,
  startInactivityTimer,
} from './src/utils/sessionManager';
import { RootNavigator } from './src/navigation/RootNavigator';

void SplashScreen.preventAutoHideAsync().catch(() => {
  // Safe to ignore — already hidden on subsequent reloads.
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

const paperTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    onPrimary: colors.textOnPrimary,
    primaryContainer: colors.primarySoft,
    onPrimaryContainer: colors.primaryDark,
    secondary: colors.primaryLight,
    background: colors.background,
    surface: colors.surface,
    surfaceVariant: colors.surfaceAlt,
    onSurface: colors.textPrimary,
    outline: colors.border,
    error: colors.error,
  },
  fonts: configureFonts({ config: { fontFamily: 'System' } }),
};

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.textPrimary,
    border: colors.border,
    notification: colors.primary,
  },
};

export default function App(): React.ReactElement {
  const [ready, setReady] = useState(false);
  const [needsReAuth, setNeedsReAuth] = useState(false);

  const compromised = useMemo(() => isCompromised(), []);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 0);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!compromised) return undefined;
    void logSecurityEvent('jailbreak_detected', {});
    return undefined;
  }, [compromised]);

  useEffect(() => {
    startInactivityTimer(15);
    const unsubscribe = onSessionTimeout(() => setNeedsReAuth(true));
    return () => {
      unsubscribe();
    };
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (ready) {
      try {
        await SplashScreen.hideAsync();
      } catch {
        // already hidden
      }
    }
  }, [ready]);

  if (!ready) {
    return <View style={styles.booting} />;
  }

  if (compromised) {
    return (
      <View style={styles.root} onLayout={onLayoutRootView}>
        <SafeAreaProvider>
          <StatusBar style="dark" backgroundColor={colors.background} />
          <SecurityBlockScreen />
        </SafeAreaProvider>
      </View>
    );
  }

  return (
    <View style={styles.root} onLayout={onLayoutRootView}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <PaperProvider theme={paperTheme}>
            <NavigationContainer theme={navigationTheme}>
              <StatusBar style="dark" backgroundColor={colors.background} />
              <InactivityTracker>
                <RootNavigator />
              </InactivityTracker>
              <Toast />
              {needsReAuth ? (
                <ReAuthScreen onResume={() => setNeedsReAuth(false)} />
              ) : null}
            </NavigationContainer>
          </PaperProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  booting: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
