/**
 * HelpStack — native stack for the in-app Knowledge Hub.
 *
 * Sits inside the merchant root drawer so the SmartSidebar "Help" item
 * opens the full Help Center rather than a placeholder. Screens use the
 * shared cyan Header; this stack therefore renders without its own
 * native header.
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { HelpArticleScreen } from '../screens/help/HelpArticleScreen';
import { HelpCategoryScreen } from '../screens/help/HelpCategoryScreen';
import { HelpHomeScreen } from '../screens/help/HelpHomeScreen';
import { HelpSearchScreen } from '../screens/help/HelpSearchScreen';
import type { HelpStackParamList } from './types';

const Stack = createNativeStackNavigator<HelpStackParamList>();

export const HelpStack: React.FC = () => (
  <Stack.Navigator
    initialRouteName="HelpHome"
    screenOptions={{ headerShown: false }}
  >
    <Stack.Screen name="HelpHome" component={HelpHomeScreen} />
    <Stack.Screen name="HelpCategory" component={HelpCategoryScreen} />
    <Stack.Screen name="HelpArticle" component={HelpArticleScreen} />
    <Stack.Screen name="HelpSearch" component={HelpSearchScreen} />
  </Stack.Navigator>
);

export default HelpStack;
