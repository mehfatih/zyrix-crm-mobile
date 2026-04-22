/**
 * MerchantSalesStack — stack for the "Sales" tab.
 *
 * All screens are placeholders for Sprint 2; real implementations
 * arrive in Sprint 4. The stack exists so deep-linking + nested
 * navigation (e.g. Customers → CustomerDetail) is already in place.
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { PlaceholderScreen } from '../screens/merchant/PlaceholderScreen';
import type { MerchantSalesStackParamList } from './types';

const Stack = createNativeStackNavigator<MerchantSalesStackParamList>();

const CustomersScreen: React.FC = () => {
  const { t } = useTranslation();
  return (
    <PlaceholderScreen
      title={t('navigation.customers')}
      sprint={4}
      icon="people-outline"
    />
  );
};

const CustomerDetailScreen: React.FC = () => {
  const { t } = useTranslation();
  return (
    <PlaceholderScreen
      title={t('navigation.customerDetail')}
      sprint={4}
      icon="person-outline"
    />
  );
};

const DealsScreen: React.FC = () => {
  const { t } = useTranslation();
  return (
    <PlaceholderScreen
      title={t('navigation.deals')}
      sprint={4}
      icon="briefcase-outline"
    />
  );
};

const PipelineScreen: React.FC = () => {
  const { t } = useTranslation();
  return (
    <PlaceholderScreen
      title={t('navigation.pipeline')}
      sprint={4}
      icon="git-branch-outline"
    />
  );
};

const QuotesScreen: React.FC = () => {
  const { t } = useTranslation();
  return (
    <PlaceholderScreen
      title={t('navigation.quotes')}
      sprint={4}
      icon="document-attach-outline"
    />
  );
};

const ContractsScreen: React.FC = () => {
  const { t } = useTranslation();
  return (
    <PlaceholderScreen
      title={t('navigation.contracts')}
      sprint={4}
      icon="document-text-outline"
    />
  );
};

const CommissionsScreen: React.FC = () => {
  const { t } = useTranslation();
  return (
    <PlaceholderScreen
      title={t('navigation.commissions')}
      sprint={4}
      icon="cash-outline"
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
    <Stack.Screen name="Pipeline" component={PipelineScreen} />
    <Stack.Screen name="Quotes" component={QuotesScreen} />
    <Stack.Screen name="Contracts" component={ContractsScreen} />
    <Stack.Screen name="Commissions" component={CommissionsScreen} />
  </Stack.Navigator>
);

export default MerchantSalesStack;
