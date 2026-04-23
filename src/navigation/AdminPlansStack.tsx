/**
 * AdminPlansStack — list + edit screens for the admin Plans drawer
 * entry.
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { EditPlanScreen } from '../screens/admin/EditPlanScreen';
import { PlansManagementScreen } from '../screens/admin/PlansManagementScreen';
import type { AdminPlansStackParamList } from './types';

const Stack = createNativeStackNavigator<AdminPlansStackParamList>();

export const AdminPlansStack: React.FC = () => (
  <Stack.Navigator
    initialRouteName="PlansList"
    screenOptions={{ headerShown: false }}
  >
    <Stack.Screen name="PlansList" component={PlansManagementScreen} />
    <Stack.Screen name="EditPlan" component={EditPlanScreen} />
  </Stack.Navigator>
);

export default AdminPlansStack;
