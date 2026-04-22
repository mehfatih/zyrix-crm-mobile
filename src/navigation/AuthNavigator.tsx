/**
 * AuthNavigator — native stack holding the pre-login flow.
 *
 * The initial route depends on whether the user has already selected
 * a language: new installs land on `LanguageSelection`, returning users
 * jump straight to `Login`. `Splash` is only used while we hydrate.
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { LanguageSelectionScreen } from '../screens/auth/LanguageSelectionScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
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
    </Stack.Navigator>
  );
};

export default AuthNavigator;
