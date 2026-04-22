/**
 * MerchantSalesStack — stack for the "Sales" tab.
 *
 * Sprint 4 wires real screens for Customers, CustomerDetail, Deals,
 * DealDetail, Pipeline, Commissions, Territories, QuotasForecast, and
 * HealthScores. Quotes/Contracts stay as placeholders pending Sprint 5.
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { CommissionsScreen } from '../screens/merchant/sales/CommissionsScreen';
import { CustomerDetailScreen } from '../screens/merchant/sales/CustomerDetailScreen';
import { CustomersScreen } from '../screens/merchant/sales/CustomersScreen';
import { DealDetailScreen } from '../screens/merchant/sales/DealDetailScreen';
import { DealsScreen } from '../screens/merchant/sales/DealsScreen';
import { HealthScoresScreen } from '../screens/merchant/sales/HealthScoresScreen';
import { PipelineScreen } from '../screens/merchant/sales/PipelineScreen';
import { PlaceholderScreen } from '../screens/common/PlaceholderScreen';
import { QuotasForecastScreen } from '../screens/merchant/sales/QuotasForecastScreen';
import { TerritoriesScreen } from '../screens/merchant/sales/TerritoriesScreen';
import type { MerchantSalesStackParamList } from './types';

const Stack = createNativeStackNavigator<MerchantSalesStackParamList>();

const QuotesScreen: React.FC = () => {
  const { t } = useTranslation();
  return (
    <PlaceholderScreen
      title={t('navigation.quotes')}
      sprintNumber={5}
      icon="document-attach-outline"
    />
  );
};

const ContractsScreen: React.FC = () => {
  const { t } = useTranslation();
  return (
    <PlaceholderScreen
      title={t('navigation.contracts')}
      sprintNumber={5}
      icon="document-text-outline"
    />
  );
};

export const MerchantSalesStack: React.FC = () => (
  <Stack.Navigator
    initialRouteName="Customers"
    screenOptions={{ headerShown: false }}
  >
    <Stack.Screen name="Customers" component={CustomersScreen} />
    <Stack.Screen name="CustomerDetail" component={CustomerDetailScreen} />
    <Stack.Screen name="Deals" component={DealsScreen} />
    <Stack.Screen name="DealDetail" component={DealDetailScreen} />
    <Stack.Screen name="Pipeline" component={PipelineScreen} />
    <Stack.Screen name="Quotes" component={QuotesScreen} />
    <Stack.Screen name="Contracts" component={ContractsScreen} />
    <Stack.Screen name="Commissions" component={CommissionsScreen} />
    <Stack.Screen name="Territories" component={TerritoriesScreen} />
    <Stack.Screen name="QuotasForecast" component={QuotasForecastScreen} />
    <Stack.Screen name="HealthScores" component={HealthScoresScreen} />
  </Stack.Navigator>
);

export default MerchantSalesStack;
