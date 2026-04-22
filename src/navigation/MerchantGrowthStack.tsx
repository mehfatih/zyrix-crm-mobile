/**
 * MerchantGrowthStack — stack for the "Growth" tab.
 *
 * Loyalty, Campaigns, and Automation placeholders for Sprint 2;
 * real screens in Sprint 4.
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { PlaceholderScreen } from '../screens/common/PlaceholderScreen';
import type { MerchantGrowthStackParamList } from './types';

const Stack = createNativeStackNavigator<MerchantGrowthStackParamList>();

const LoyaltyScreen: React.FC = () => {
  const { t } = useTranslation();
  return (
    <PlaceholderScreen
      title={t('navigation.loyalty')}
      sprintNumber={4}
      icon="ribbon-outline"
    />
  );
};

const CampaignsScreen: React.FC = () => {
  const { t } = useTranslation();
  return (
    <PlaceholderScreen
      title={t('navigation.campaigns')}
      sprintNumber={4}
      icon="megaphone-outline"
    />
  );
};

const AutomationScreen: React.FC = () => {
  const { t } = useTranslation();
  return (
    <PlaceholderScreen
      title={t('navigation.automation')}
      sprintNumber={4}
      icon="git-merge-outline"
    />
  );
};

export const MerchantGrowthStack: React.FC = () => (
  <Stack.Navigator initialRouteName="Loyalty" screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Loyalty" component={LoyaltyScreen} />
    <Stack.Screen name="Campaigns" component={CampaignsScreen} />
    <Stack.Screen name="Automation" component={AutomationScreen} />
  </Stack.Navigator>
);

export default MerchantGrowthStack;
