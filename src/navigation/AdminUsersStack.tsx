/**
 * AdminUsersStack — list + detail screens for the admin Users drawer
 * entry.
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { UserDetailScreen } from '../screens/admin/UserDetailScreen';
import { UsersManagementScreen } from '../screens/admin/UsersManagementScreen';
import type { AdminUsersStackParamList } from './types';

const Stack = createNativeStackNavigator<AdminUsersStackParamList>();

export const AdminUsersStack: React.FC = () => (
  <Stack.Navigator
    initialRouteName="UsersList"
    screenOptions={{ headerShown: false }}
  >
    <Stack.Screen name="UsersList" component={UsersManagementScreen} />
    <Stack.Screen name="UserDetail" component={UserDetailScreen} />
  </Stack.Navigator>
);

export default AdminUsersStack;
