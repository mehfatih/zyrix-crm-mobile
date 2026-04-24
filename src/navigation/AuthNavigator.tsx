/**
 * AuthNavigator — native stack holding the pre-login flow.
 *
 * Sprint 9 adds `TwoFactorPrompt` for the mid-login challenge that
 * surfaces after a password-only login when the account has 2FA
 * enabled. Initial route still depends on the language-selection flag.
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { LanguageSelectionScreen } from '../screens/auth/LanguageSelectionScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { OnboardingScreen } from '../screens/auth/OnboardingScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { SplashScreen } from '../screens/auth/SplashScreen';
import { TwoFactorPromptScreen } from '../screens/auth/TwoFactorPromptScreen';
import { useUiStore } from '../store/uiStore';
import type { AuthStackParamList } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export const AuthNavigator: React.FC = () => {
  // Sprint 1 (app): the welcome Splash screen is always the first route.
  // Users reach Login/Register from its two CTAs; the language-picker
  // appears inline (top-right) rather than as a forced first step.
  const hasSelectedLanguage = useUiStore((s) => s.hasSelectedLanguage);
  const initialRoute: keyof AuthStackParamList = hasSelectedLanguage
    ? 'Splash'
    : 'Splash';

  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{ headerShown: false, animation: 'fade' }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen
        name="LanguageSelection"
        component={LanguageSelectionScreen}
      />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="TwoFactorPrompt" component={TwoFactorPromptScreen} />
    </Stack.Navigator>
  );
};

export default AuthNavigator;
