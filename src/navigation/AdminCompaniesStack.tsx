/**
 * AdminCompaniesStack — list + detail screens for the admin Companies
 * drawer entry.
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { CompaniesListScreen } from '../screens/admin/CompaniesListScreen';
import { CompanyDetailScreen } from '../screens/admin/CompanyDetailScreen';
import type { AdminCompaniesStackParamList } from './types';

const Stack = createNativeStackNavigator<AdminCompaniesStackParamList>();

export const AdminCompaniesStack: React.FC = () => (
  <Stack.Navigator
    initialRouteName="CompaniesList"
    screenOptions={{ headerShown: false }}
  >
    <Stack.Screen name="CompaniesList" component={CompaniesListScreen} />
    <Stack.Screen name="CompanyDetail" component={CompanyDetailScreen} />
  </Stack.Navigator>
);

export default AdminCompaniesStack;
