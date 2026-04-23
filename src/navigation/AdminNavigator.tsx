/**
 * AdminNavigator — drawer navigator used by super_admin and admin
 * roles. Sprint 8 swaps every placeholder for the real platform admin
 * screens grouped logically: Dashboard → Management → Configuration →
 * Security → Platform.
 */

import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { createDrawerNavigator } from '@react-navigation/drawer';
import type { DrawerContentComponentProps } from '@react-navigation/drawer';

import { AdminCompaniesStack } from './AdminCompaniesStack';
import { AdminPlansStack } from './AdminPlansStack';
import { AdminSecurityStack } from './AdminSecurityStack';
import { AdminUsersStack } from './AdminUsersStack';
import { AdminDashboardScreen } from '../screens/admin/AdminDashboardScreen';
import { AdminSettingsScreen } from '../screens/admin/AdminSettingsScreen';
import { AuditLogScreen } from '../screens/admin/AuditLogScreen';
import { Drawer, type DrawerItem } from '../components/common/Drawer';
import { FeatureFlagsScreen } from '../screens/admin/FeatureFlagsScreen';
import { SystemNotificationsScreen } from '../screens/admin/SystemNotificationsScreen';
import { SystemStatsScreen } from '../screens/admin/SystemStatsScreen';
import { colors } from '../constants/colors';
import type { AdminDrawerParamList } from './types';

const AdminDrawer = createDrawerNavigator<AdminDrawerParamList>();

export const AdminNavigator: React.FC = () => {
  const { t } = useTranslation();

  const items: readonly DrawerItem[] = [
    { route: 'AdminDashboard', label: t('navigation.adminDashboard'), icon: 'speedometer-outline' },
    { route: 'Companies', label: t('admin.companies'), icon: 'business-outline' },
    { route: 'Users', label: t('admin.users'), icon: 'people-outline' },
    { route: 'FeatureFlags', label: t('admin.featureFlags'), icon: 'flag-outline' },
    { route: 'Plans', label: t('admin.plans'), icon: 'pricetags-outline' },
    { route: 'AuditLog', label: t('admin.auditLog'), icon: 'document-text-outline' },
    { route: 'Security', label: t('admin.security'), icon: 'shield-checkmark-outline' },
    { route: 'SystemStats', label: t('admin.systemStats'), icon: 'analytics-outline' },
    { route: 'SystemNotifications', label: t('admin.systemNotifications'), icon: 'megaphone-outline' },
    { route: 'Settings', label: t('admin.settings'), icon: 'settings-outline' },
  ];

  const renderDrawer = useCallback(
    (props: DrawerContentComponentProps) => (
      <Drawer {...props} items={items} />
    ),
    [items]
  );

  return (
    <AdminDrawer.Navigator
      initialRouteName="AdminDashboard"
      drawerContent={renderDrawer}
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        drawerStyle: { backgroundColor: colors.surface, width: 300 },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <AdminDrawer.Screen name="AdminDashboard" component={AdminDashboardScreen} />
      <AdminDrawer.Screen name="Companies" component={AdminCompaniesStack} />
      <AdminDrawer.Screen name="Users" component={AdminUsersStack} />
      <AdminDrawer.Screen name="FeatureFlags" component={FeatureFlagsScreen} />
      <AdminDrawer.Screen name="Plans" component={AdminPlansStack} />
      <AdminDrawer.Screen name="AuditLog" component={AuditLogScreen} />
      <AdminDrawer.Screen name="Security" component={AdminSecurityStack} />
      <AdminDrawer.Screen name="SystemStats" component={SystemStatsScreen} />
      <AdminDrawer.Screen
        name="SystemNotifications"
        component={SystemNotificationsScreen}
      />
      <AdminDrawer.Screen name="Settings" component={AdminSettingsScreen} />
    </AdminDrawer.Navigator>
  );
};

export default AdminNavigator;
