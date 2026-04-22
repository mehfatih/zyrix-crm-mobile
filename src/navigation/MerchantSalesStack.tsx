/**
 * MerchantSalesStack — stack for the "Sales" tab.
 *
 * Sprint 5 wires the quote + contract + customer + deal creation
 * screens on top of Sprint 4's list/detail screens.
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { CommissionsScreen } from '../screens/merchant/sales/CommissionsScreen';
import { ContractBuilderScreen } from '../screens/merchant/sales/ContractBuilderScreen';
import { ContractDetailScreen } from '../screens/merchant/sales/ContractDetailScreen';
import { ContractsScreen } from '../screens/merchant/sales/ContractsScreen';
import { CustomerDetailScreen } from '../screens/merchant/sales/CustomerDetailScreen';
import { CustomersScreen } from '../screens/merchant/sales/CustomersScreen';
import { DealDetailScreen } from '../screens/merchant/sales/DealDetailScreen';
import { DealsScreen } from '../screens/merchant/sales/DealsScreen';
import { EditCustomerScreen } from '../screens/merchant/sales/EditCustomerScreen';
import { HealthScoresScreen } from '../screens/merchant/sales/HealthScoresScreen';
import { NewCustomerScreen } from '../screens/merchant/sales/NewCustomerScreen';
import { NewDealScreen } from '../screens/merchant/sales/NewDealScreen';
import { PipelineScreen } from '../screens/merchant/sales/PipelineScreen';
import { QuoteBuilderScreen } from '../screens/merchant/sales/QuoteBuilderScreen';
import { QuoteDetailScreen } from '../screens/merchant/sales/QuoteDetailScreen';
import { QuotasForecastScreen } from '../screens/merchant/sales/QuotasForecastScreen';
import { QuotesScreen } from '../screens/merchant/sales/QuotesScreen';
import { TerritoriesScreen } from '../screens/merchant/sales/TerritoriesScreen';
import type { MerchantSalesStackParamList } from './types';

const Stack = createNativeStackNavigator<MerchantSalesStackParamList>();

export const MerchantSalesStack: React.FC = () => (
  <Stack.Navigator
    initialRouteName="Customers"
    screenOptions={{ headerShown: false }}
  >
    <Stack.Screen name="Customers" component={CustomersScreen} />
    <Stack.Screen name="CustomerDetail" component={CustomerDetailScreen} />
    <Stack.Screen name="NewCustomer" component={NewCustomerScreen} />
    <Stack.Screen name="EditCustomer" component={EditCustomerScreen} />
    <Stack.Screen name="Deals" component={DealsScreen} />
    <Stack.Screen name="DealDetail" component={DealDetailScreen} />
    <Stack.Screen name="NewDeal" component={NewDealScreen} />
    <Stack.Screen name="Pipeline" component={PipelineScreen} />
    <Stack.Screen name="Quotes" component={QuotesScreen} />
    <Stack.Screen name="QuoteDetail" component={QuoteDetailScreen} />
    <Stack.Screen name="QuoteBuilder" component={QuoteBuilderScreen} />
    <Stack.Screen name="Contracts" component={ContractsScreen} />
    <Stack.Screen name="ContractDetail" component={ContractDetailScreen} />
    <Stack.Screen name="ContractBuilder" component={ContractBuilderScreen} />
    <Stack.Screen name="Commissions" component={CommissionsScreen} />
    <Stack.Screen name="Territories" component={TerritoriesScreen} />
    <Stack.Screen name="QuotasForecast" component={QuotasForecastScreen} />
    <Stack.Screen name="HealthScores" component={HealthScoresScreen} />
  </Stack.Navigator>
);

export default MerchantSalesStack;
