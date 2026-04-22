/**
 * MerchantMoreNavigator — drawer shown when the "More" bottom tab is
 * selected. Holds secondary destinations (Operations, Compliance,
 * Reports, Integrations, Settings, Profile) so the primary tabs can
 * stay focused on high-frequency actions.
 */

import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { createDrawerNavigator } from '@react-navigation/drawer';
import type { DrawerContentComponentProps } from '@react-navigation/drawer';

import { Drawer, type DrawerItem } from '../components/common/Drawer';
import { colors } from '../constants/colors';
import { PlaceholderScreen } from '../screens/common/PlaceholderScreen';
import type { MerchantMoreDrawerParamList } from './types';

const MoreDrawer = createDrawerNavigator<MerchantMoreDrawerParamList>();

const OperationsScreen: React.FC = () => {
  const { t } = useTranslation();
  return (
    <PlaceholderScreen
      title={t('navigation.operations')}
      sprintNumber={7}
      icon="construct-outline"
      showMenuButton
    />
  );
};

const ComplianceScreen: React.FC = () => {
  const { t } = useTranslation();
  return (
    <PlaceholderScreen
      title={t('navigation.compliance')}
      sprintNumber={7}
      icon="shield-checkmark-outline"
      showMenuButton
    />
  );
};

const ReportsScreen: React.FC = () => {
  const { t } = useTranslation();
  return (
    <PlaceholderScreen
      title={t('navigation.reports')}
      sprintNumber={4}
      icon="bar-chart-outline"
      showMenuButton
    />
  );
};

const IntegrationsScreen: React.FC = () => {
  const { t } = useTranslation();
  return (
    <PlaceholderScreen
      title={t('navigation.integrations')}
      sprintNumber={10}
      icon="link-outline"
      showMenuButton
    />
  );
};

const SettingsScreen: React.FC = () => {
  const { t } = useTranslation();
  return (
    <PlaceholderScreen
      title={t('navigation.settings')}
      sprintNumber={3}
      icon="settings-outline"
      showMenuButton
    />
  );
};

const ProfileScreen: React.FC = () => {
  const { t } = useTranslation();
  return (
    <PlaceholderScreen
      title={t('navigation.profile')}
      sprintNumber={3}
      icon="person-circle-outline"
      showMenuButton
    />
  );
};

export const MerchantMoreNavigator: React.FC = () => {
  const { t } = useTranslation();

  const items: readonly DrawerItem[] = [
    { route: 'Operations', label: t('navigation.operations'), icon: 'construct-outline' },
    { route: 'Compliance', label: t('navigation.compliance'), icon: 'shield-checkmark-outline' },
    { route: 'Reports', label: t('navigation.reports'), icon: 'bar-chart-outline' },
    { route: 'Integrations', label: t('navigation.integrations'), icon: 'link-outline' },
    { route: 'Settings', label: t('navigation.settings'), icon: 'settings-outline' },
    { route: 'Profile', label: t('navigation.profile'), icon: 'person-circle-outline' },
  ];

  const renderDrawer = useCallback(
    (props: DrawerContentComponentProps) => (
      <Drawer {...props} items={items} />
    ),
    [items]
  );

  return (
    <MoreDrawer.Navigator
      initialRouteName="Operations"
      drawerContent={renderDrawer}
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        drawerStyle: { backgroundColor: colors.surface, width: 300 },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <MoreDrawer.Screen name="Operations" component={OperationsScreen} />
      <MoreDrawer.Screen name="Compliance" component={ComplianceScreen} />
      <MoreDrawer.Screen name="Reports" component={ReportsScreen} />
      <MoreDrawer.Screen name="Integrations" component={IntegrationsScreen} />
      <MoreDrawer.Screen name="Settings" component={SettingsScreen} />
      <MoreDrawer.Screen name="Profile" component={ProfileScreen} />
    </MoreDrawer.Navigator>
  );
};

export default MerchantMoreNavigator;
