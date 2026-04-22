/**
 * MerchantGrowthStack — Sprint 5 wires the creation/rules screens on
 * top of the Sprint 4 list screens.
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AutomationScreen } from '../screens/merchant/growth/AutomationScreen';
import { CampaignsScreen } from '../screens/merchant/growth/CampaignsScreen';
import { LoyaltyRulesScreen } from '../screens/merchant/growth/LoyaltyRulesScreen';
import { LoyaltyScreen } from '../screens/merchant/growth/LoyaltyScreen';
import { NewAutomationScreen } from '../screens/merchant/growth/NewAutomationScreen';
import { NewCampaignScreen } from '../screens/merchant/growth/NewCampaignScreen';
import { NewLoyaltyRewardScreen } from '../screens/merchant/growth/NewLoyaltyRewardScreen';
import type { MerchantGrowthStackParamList } from './types';

const Stack = createNativeStackNavigator<MerchantGrowthStackParamList>();

export const MerchantGrowthStack: React.FC = () => (
  <Stack.Navigator
    initialRouteName="Loyalty"
    screenOptions={{ headerShown: false }}
  >
    <Stack.Screen name="Loyalty" component={LoyaltyScreen} />
    <Stack.Screen name="LoyaltyRules" component={LoyaltyRulesScreen} />
    <Stack.Screen name="NewLoyaltyReward" component={NewLoyaltyRewardScreen} />
    <Stack.Screen name="Campaigns" component={CampaignsScreen} />
    <Stack.Screen name="NewCampaign" component={NewCampaignScreen} />
    <Stack.Screen name="Automation" component={AutomationScreen} />
    <Stack.Screen name="NewAutomation" component={NewAutomationScreen} />
  </Stack.Navigator>
);

export default MerchantGrowthStack;
