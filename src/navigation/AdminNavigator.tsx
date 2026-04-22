/**
 * AdminNavigator — drawer navigator used by super_admin and admin roles.
 *
 * All destinations except the Dashboard are placeholders until Sprint 8,
 * but the routes + drawer labels are in place so the shell looks and
 * behaves like the real thing.
 */

import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { createDrawerNavigator } from '@react-navigation/drawer';
import type { DrawerContentComponentProps } from '@react-navigation/drawer';

import { Drawer, type DrawerItem } from '../components/common/Drawer';
import { colors } from '../constants/colors';
import { AdminDashboardScreen } from '../screens/admin/AdminDashboardScreen';
import { PlaceholderAdminScreen } from '../screens/admin/PlaceholderAdminScreen';
import type { AdminDrawerParamList } from './types';

const AdminDrawer = createDrawerNavigator<AdminDrawerParamList>();

const CompaniesScreen: React.FC = () => {
  const { t } = useTranslation();
  return <PlaceholderAdminScreen title={t('navigation.companies')} sprint={8} icon="business-outline" />;
};
const UsersScreen: React.FC = () => {
  const { t } = useTranslation();
  return <PlaceholderAdminScreen title={t('navigation.users')} sprint={8} icon="people-outline" />;
};
const FeatureFlagsScreen: React.FC = () => {
  const { t } = useTranslation();
  return <PlaceholderAdminScreen title={t('navigation.featureFlags')} sprint={8} icon="flag-outline" />;
};
const AuditLogScreen: React.FC = () => {
  const { t } = useTranslation();
  return <PlaceholderAdminScreen title={t('navigation.auditLog')} sprint={8} icon="document-text-outline" />;
};
const SecurityScreen: React.FC = () => {
  const { t } = useTranslation();
  return <PlaceholderAdminScreen title={t('navigation.security')} sprint={8} icon="shield-checkmark-outline" />;
};
const PlansScreen: React.FC = () => {
  const { t } = useTranslation();
  return <PlaceholderAdminScreen title={t('navigation.plans')} sprint={8} icon="pricetags-outline" />;
};
const SettingsScreen: React.FC = () => {
  const { t } = useTranslation();
  return <PlaceholderAdminScreen title={t('navigation.settings')} sprint={8} icon="settings-outline" />;
};

export const AdminNavigator: React.FC = () => {
  const { t } = useTranslation();

  const items: readonly DrawerItem[] = [
    { route: 'AdminDashboard', label: t('navigation.adminDashboard'), icon: 'speedometer-outline' },
    { route: 'Companies', label: t('navigation.companies'), icon: 'business-outline' },
    { route: 'Users', label: t('navigation.users'), icon: 'people-outline' },
    { route: 'FeatureFlags', label: t('navigation.featureFlags'), icon: 'flag-outline' },
    { route: 'AuditLog', label: t('navigation.auditLog'), icon: 'document-text-outline' },
    { route: 'Security', label: t('navigation.security'), icon: 'shield-checkmark-outline' },
    { route: 'Plans', label: t('navigation.plans'), icon: 'pricetags-outline' },
    { route: 'Settings', label: t('navigation.settings'), icon: 'settings-outline' },
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
      <AdminDrawer.Screen name="Companies" component={CompaniesScreen} />
      <AdminDrawer.Screen name="Users" component={UsersScreen} />
      <AdminDrawer.Screen name="FeatureFlags" component={FeatureFlagsScreen} />
      <AdminDrawer.Screen name="AuditLog" component={AuditLogScreen} />
      <AdminDrawer.Screen name="Security" component={SecurityScreen} />
      <AdminDrawer.Screen name="Plans" component={PlansScreen} />
      <AdminDrawer.Screen name="Settings" component={SettingsScreen} />
    </AdminDrawer.Navigator>
  );
};

export default AdminNavigator;
