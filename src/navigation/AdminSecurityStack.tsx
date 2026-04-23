/**
 * AdminSecurityStack — security hub + sub-screens for the admin
 * Security drawer entry.
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ComplianceExportScreen } from '../screens/admin/ComplianceExportScreen';
import { IPAllowlistAdminScreen } from '../screens/admin/IPAllowlistAdminScreen';
import { NetworkRulesScreen } from '../screens/admin/NetworkRulesScreen';
import { RetentionPoliciesScreen } from '../screens/admin/RetentionPoliciesScreen';
import { SCIMTokensScreen } from '../screens/admin/SCIMTokensScreen';
import { SecurityScreen } from '../screens/admin/SecurityScreen';
import type { AdminSecurityStackParamList } from './types';

const Stack = createNativeStackNavigator<AdminSecurityStackParamList>();

export const AdminSecurityStack: React.FC = () => (
  <Stack.Navigator
    initialRouteName="SecurityHome"
    screenOptions={{ headerShown: false }}
  >
    <Stack.Screen name="SecurityHome" component={SecurityScreen} />
    <Stack.Screen name="IPAllowlist" component={IPAllowlistAdminScreen} />
    <Stack.Screen name="NetworkRules" component={NetworkRulesScreen} />
    <Stack.Screen name="SCIMTokens" component={SCIMTokensScreen} />
    <Stack.Screen
      name="RetentionPolicies"
      component={RetentionPoliciesScreen}
    />
    <Stack.Screen
      name="ComplianceExports"
      component={ComplianceExportScreen}
    />
  </Stack.Navigator>
);

export default AdminSecurityStack;
