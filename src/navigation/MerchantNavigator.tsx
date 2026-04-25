/**
 * MerchantNavigator — bottom tabs used by all merchant_* roles.
 *
 * Tabs:
 *   1. Dashboard     (home)
 *   2. Sales         (briefcase)      — stack
 *   3. AI Tools      (sparkles)       — stack
 *   4. Growth        (trending-up)    — stack
 *   5. More          (menu)           — drawer
 *
 * The tab bar is our custom `TabBar` component so we control the
 * cyan active color, badge rendering, and RTL-safe layout.
 */

import React, { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

import { AIFloatingButton } from '../components/ai/AIFloatingButton';
import { TabBar, type TabBarSlotResolver, type TabSlotDescriptor } from '../components/common/TabBar';
import { colors } from '../constants/colors';
import { DashboardScreen } from '../screens/merchant/DashboardScreen';
import { MerchantAIStack } from './MerchantAIStack';
import { MerchantGrowthStack } from './MerchantGrowthStack';
import { MerchantMoreNavigator } from './MerchantMoreNavigator';
import { MerchantSalesStack } from './MerchantSalesStack';
import type { MerchantTabParamList } from './types';

const Tab = createBottomTabNavigator<MerchantTabParamList>();

const buildResolver = (t: (k: string) => string): TabBarSlotResolver => {
  return (routeName, focused): TabSlotDescriptor => {
    switch (routeName) {
      case 'DashboardTab':
        return {
          icon: focused ? 'home' : 'home-outline',
          label: t('navigation.dashboard'),
        };
      case 'SalesTab':
        return {
          icon: focused ? 'briefcase' : 'briefcase-outline',
          label: t('navigation.sales'),
        };
      case 'AITab':
        return {
          icon: focused ? 'sparkles' : 'sparkles-outline',
          label: t('navigation.ai'),
        };
      case 'GrowthTab':
        return {
          icon: focused ? 'trending-up' : 'trending-up-outline',
          label: t('navigation.growth'),
        };
      case 'MoreTab':
        return {
          icon: focused ? 'menu' : 'menu-outline',
          label: t('navigation.more'),
        };
      default:
        return { icon: 'ellipse-outline', label: routeName };
    }
  };
};

export const MerchantNavigator: React.FC = () => {
  const { t } = useTranslation();
  const getSlot = useCallback(buildResolver(t), [t]);

  const renderTabBar = useCallback(
    (props: BottomTabBarProps) => <TabBar {...props} getSlot={getSlot} />,
    [getSlot]
  );

  return (
    <View style={styles.host}>
      <Tab.Navigator
        initialRouteName="DashboardTab"
        tabBar={renderTabBar}
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: colors.background },
        }}
      >
        <Tab.Screen name="DashboardTab" component={DashboardScreen} />
        <Tab.Screen name="SalesTab" component={MerchantSalesStack} />
        <Tab.Screen name="AITab" component={MerchantAIStack} />
        <Tab.Screen name="GrowthTab" component={MerchantGrowthStack} />
        <Tab.Screen name="MoreTab" component={MerchantMoreNavigator} />
      </Tab.Navigator>
      <AIFloatingButton />
    </View>
  );
};

const styles = StyleSheet.create({
  host: { flex: 1 },
});

export default MerchantNavigator;
