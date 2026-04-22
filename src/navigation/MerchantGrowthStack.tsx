/**
 * MerchantGrowthStack — stack for the "Growth" tab.
 * Sprint 4 replaces the placeholders with real Loyalty, Campaigns and
 * Automation screens backed by mock data.
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AutomationScreen } from '../screens/merchant/growth/AutomationScreen';
import { CampaignsScreen } from '../screens/merchant/growth/CampaignsScreen';
import { LoyaltyScreen } from '../screens/merchant/growth/LoyaltyScreen';
import type { MerchantGrowthStackParamList } from './types';

const Stack = createNativeStackNavigator<MerchantGrowthStackParamList>();

export const MerchantGrowthStack: React.FC = () => (
  <Stack.Navigator initialRouteName="Loyalty" screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Loyalty" component={LoyaltyScreen} />
    <Stack.Screen name="Campaigns" component={CampaignsScreen} />
    <Stack.Screen name="Automation" component={AutomationScreen} />
  </Stack.Navigator>
);

export default MerchantGrowthStack;
