/**
 * MerchantMoreDrawer — drawer shown when the "More" bottom tab is
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
import { PlaceholderScreen } from '../screens/merchant/PlaceholderScreen';
import type { MerchantMoreDrawerParamList } from './types';

const MoreDrawer = createDrawerNavigator<MerchantMoreDrawerParamList>();

const OperationsScreen: React.FC = () => {
  const { t } = useTranslation();
  return (
    <PlaceholderScreen
      title={t('navigation.operations')}
      sprint={5}
      icon="construct-outline"
    />
  );
};

const ComplianceScreen: React.FC = () => {
  const { t } = useTranslation();
  return (
    <PlaceholderScreen
      title={t('navigation.compliance')}
      sprint={7}
      icon="shield-outline"
    />
  );
};

const ReportsScreen: React.FC = () => {
  const { t } = useTranslation();
  return (
    <PlaceholderScreen
      title={t('navigation.reports')}
      sprint={5}
      icon="document-text-outline"
    />
  );
};

const IntegrationsScreen: React.FC = () => {
  const { t } = useTranslation();
  return (
    <PlaceholderScreen
      title={t('navigation.integrations')}
      sprint={5}
      icon="link-outline"
    />
  );
};

const SettingsScreen: React.FC = () => {
  const { t } = useTranslation();
  return (
    <PlaceholderScreen
      title={t('navigation.settings')}
      sprint={3}
      icon="settings-outline"
    />
  );
};

const ProfileScreen: React.FC = () => {
  const { t } = useTranslation();
  return (
    <PlaceholderScreen
      title={t('navigation.profile')}
      sprint={3}
      icon="person-circle-outline"
    />
  );
};

export const MerchantMoreDrawer: React.FC = () => {
  const { t } = useTranslation();

  const items: readonly DrawerItem[] = [
    { route: 'Operations', label: t('navigation.operations'), icon: 'construct-outline' },
    { route: 'Compliance', label: t('navigation.compliance'), icon: 'shield-outline' },
    { route: 'Reports', label: t('navigation.reports'), icon: 'document-text-outline' },
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

export default MerchantMoreDrawer;
