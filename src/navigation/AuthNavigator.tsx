/**
 * AuthNavigator — native stack holding the pre-login flow.
 *
 * The initial route depends on whether the user has already selected
 * a language: new installs land on `LanguageSelection`, returning users
 * jump straight to `Login`. `Splash` is only used while we hydrate.
 *
 * Sprint 3 adds `Register` and `Onboarding` to the same stack: after
 * registration we push `Onboarding`, and when onboarding completes the
 * root navigator swaps over to the authenticated stack because the
 * merchant user is already in the auth/user stores.
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { LanguageSelectionScreen } from '../screens/auth/LanguageSelectionScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { OnboardingScreen } from '../screens/auth/OnboardingScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { SplashScreen } from '../screens/auth/SplashScreen';
import { useUiStore } from '../store/uiStore';
import type { AuthStackParamList } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export const AuthNavigator: React.FC = () => {
  const hasSelectedLanguage = useUiStore((s) => s.hasSelectedLanguage);
  const initialRoute: keyof AuthStackParamList = hasSelectedLanguage
    ? 'Login'
    : 'LanguageSelection';

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
    </Stack.Navigator>
  );
};

export default AuthNavigator;
