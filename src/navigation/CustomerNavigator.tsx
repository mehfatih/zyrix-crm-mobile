/**
 * CustomerNavigator — bottom tabs for the customer portal.
 *
 * Tabs: Home · Documents · Payments · Support · Profile.
 * Uses the same custom TabBar as the merchant navigator so the look
 * and feel stays consistent across both role groups.
 */

import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

import {
  TabBar,
  type TabBarSlotResolver,
  type TabSlotDescriptor,
} from '../components/common/TabBar';
import { colors } from '../constants/colors';
import { CustomerDashboardScreen } from '../screens/customer/CustomerDashboardScreen';
import { PlaceholderScreen } from '../screens/common/PlaceholderScreen';
import type { CustomerTabParamList } from './types';

const Tab = createBottomTabNavigator<CustomerTabParamList>();

const DocumentsScreen: React.FC = () => {
  const { t } = useTranslation();
  return (
    <PlaceholderScreen
      title={t('navigation.customerDocuments')}
      sprintNumber={7}
      icon="folder-open-outline"
      showBackButton={false}
    />
  );
};

const PaymentsScreen: React.FC = () => {
  const { t } = useTranslation();
  return (
    <PlaceholderScreen
      title={t('navigation.customerPayments')}
      sprintNumber={7}
      icon="card-outline"
      showBackButton={false}
    />
  );
};

const SupportScreen: React.FC = () => {
  const { t } = useTranslation();
  return (
    <PlaceholderScreen
      title={t('navigation.customerSupport')}
      sprintNumber={7}
      icon="help-buoy-outline"
      showBackButton={false}
    />
  );
};

const ProfileScreen: React.FC = () => {
  const { t } = useTranslation();
  return (
    <PlaceholderScreen
      title={t('navigation.customerProfile')}
      sprintNumber={7}
      icon="person-circle-outline"
      showBackButton={false}
    />
  );
};

const buildResolver = (t: (k: string) => string): TabBarSlotResolver => {
  return (routeName, focused): TabSlotDescriptor => {
    switch (routeName) {
      case 'CustomerHome':
        return {
          icon: focused ? 'home' : 'home-outline',
          label: t('navigation.customerHome'),
        };
      case 'CustomerDocuments':
        return {
          icon: focused ? 'folder-open' : 'folder-open-outline',
          label: t('navigation.customerDocuments'),
        };
      case 'CustomerPayments':
        return {
          icon: focused ? 'card' : 'card-outline',
          label: t('navigation.customerPayments'),
        };
      case 'CustomerSupport':
        return {
          icon: focused ? 'help-buoy' : 'help-buoy-outline',
          label: t('navigation.customerSupport'),
        };
      case 'CustomerProfile':
        return {
          icon: focused ? 'person-circle' : 'person-circle-outline',
          label: t('navigation.customerProfile'),
        };
      default:
        return { icon: 'ellipse-outline', label: routeName };
    }
  };
};

export const CustomerNavigator: React.FC = () => {
  const { t } = useTranslation();
  const getSlot = useCallback(buildResolver(t), [t]);

  const renderTabBar = useCallback(
    (props: BottomTabBarProps) => <TabBar {...props} getSlot={getSlot} />,
    [getSlot]
  );

  return (
    <Tab.Navigator
      initialRouteName="CustomerHome"
      tabBar={renderTabBar}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tab.Screen name="CustomerHome" component={CustomerDashboardScreen} />
      <Tab.Screen name="CustomerDocuments" component={DocumentsScreen} />
      <Tab.Screen name="CustomerPayments" component={PaymentsScreen} />
      <Tab.Screen name="CustomerSupport" component={SupportScreen} />
      <Tab.Screen name="CustomerProfile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export default CustomerNavigator;
