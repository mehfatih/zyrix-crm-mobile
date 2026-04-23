/**
 * MerchantMoreNavigator — drawer shown when the "More" bottom tab is
 * selected. Holds secondary destinations as native stacks so each
 * drawer item can have its own internal navigation.
 *
 * Sprint 7 wires Operations → MerchantOperationsStack (payments
 * + refunds), Compliance → MerchantComplianceStack (invoices + tax
 * compliance), and Settings → MerchantSettingsStack (settings + payment
 * gateways). Reports, Integrations and Profile remain placeholders.
 */

import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { createDrawerNavigator } from '@react-navigation/drawer';
import type { DrawerContentComponentProps } from '@react-navigation/drawer';

import { Drawer, type DrawerItem } from '../components/common/Drawer';
import { MerchantComplianceStack } from './MerchantComplianceStack';
import { MerchantOperationsStack } from './MerchantOperationsStack';
import { MerchantSettingsStack } from './MerchantSettingsStack';
import { PlaceholderScreen } from '../screens/common/PlaceholderScreen';
import { colors } from '../constants/colors';
import type { MerchantMoreDrawerParamList } from './types';

const MoreDrawer = createDrawerNavigator<MerchantMoreDrawerParamList>();

const ReportsScreen: React.FC = () => {
  const { t } = useTranslation();
  return (
    <PlaceholderScreen
      title={t('navigation.reports')}
      sprintNumber={9}
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

const ProfileScreen: React.FC = () => {
  const { t } = useTranslation();
  return (
    <PlaceholderScreen
      title={t('navigation.profile')}
      sprintNumber={9}
      icon="person-circle-outline"
      showMenuButton
    />
  );
};

export const MerchantMoreNavigator: React.FC = () => {
  const { t } = useTranslation();

  const items: readonly DrawerItem[] = [
    { route: 'Operations', label: t('navigation.operations'), icon: 'card-outline' },
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
      <MoreDrawer.Screen name="Operations" component={MerchantOperationsStack} />
      <MoreDrawer.Screen name="Compliance" component={MerchantComplianceStack} />
      <MoreDrawer.Screen name="Reports" component={ReportsScreen} />
      <MoreDrawer.Screen name="Integrations" component={IntegrationsScreen} />
      <MoreDrawer.Screen name="Settings" component={MerchantSettingsStack} />
      <MoreDrawer.Screen name="Profile" component={ProfileScreen} />
    </MoreDrawer.Navigator>
  );
};

export default MerchantMoreNavigator;
