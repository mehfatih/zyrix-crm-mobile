/**
 * MerchantRootNavigator — top-level shell for every merchant_* role.
 *
 * Wraps the existing bottom-tab `MerchantNavigator` (which still owns
 * Dashboard / Sales / AI / Growth / More) inside a Drawer that uses
 * the new `SmartSidebar` from App Sprint 2. The drawer also registers
 * every sidebar destination (CRM / Engage / Grow / System) as its own
 * route so tapping a sidebar item lands directly on the placeholder
 * screen for that destination.
 *
 * The drawer's `swipeEdgeWidth` is widened to 60 so swiping from the
 * very edge opens the sidebar in both LTR (left edge) and RTL (right
 * edge) layouts — React Navigation handles the mirror automatically
 * when `I18nManager.isRTL` is true.
 */

import React, { useCallback } from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import type { DrawerContentComponentProps } from '@react-navigation/drawer';

import { CallsScreen } from '../screens/engage/CallsScreen';
import { CompaniesScreen } from '../screens/crm/CompaniesScreen';
import { ContactsScreen } from '../screens/crm/ContactsScreen';
import { ConversationsScreen } from '../screens/engage/ConversationsScreen';
import { DashboardsScreen } from '../screens/grow/DashboardsScreen';
import { DealsScreen } from '../screens/crm/DealsScreen';
import { FeedsScreen } from '../screens/engage/FeedsScreen';
import { HelpScreen } from '../screens/system/HelpScreen';
import { MarketingEmailScreen } from '../screens/engage/MarketingEmailScreen';
import { MeetingLinksScreen } from '../screens/engage/MeetingLinksScreen';
import { MerchantNavigator } from './MerchantNavigator';
import { MerchantSettingsStack } from './MerchantSettingsStack';
import { ProfileScreen } from '../screens/merchant/settings/ProfileScreen';
import { SegmentsScreen } from '../screens/grow/SegmentsScreen';
import { SmartSidebar } from './SmartSidebar';
import { TasksScreen } from '../screens/crm/TasksScreen';
import { TicketsScreen } from '../screens/crm/TicketsScreen';
import { colors } from '../constants/colors';

export type MerchantRootDrawerParamList = {
  Home: undefined;
  Contacts: undefined;
  Companies: undefined;
  Deals: undefined;
  Tasks: undefined;
  Tickets: undefined;
  Conversations: undefined;
  MarketingEmail: undefined;
  Calls: undefined;
  MeetingLinks: undefined;
  Feeds: undefined;
  Dashboards: undefined;
  Segments: undefined;
  Settings: undefined;
  Help: undefined;
  Profile: undefined;
};

const RootDrawer = createDrawerNavigator<MerchantRootDrawerParamList>();

export const MerchantRootNavigator: React.FC = () => {
  const renderSidebar = useCallback(
    (props: DrawerContentComponentProps) => <SmartSidebar {...props} />,
    []
  );

  return (
    <RootDrawer.Navigator
      initialRouteName="Home"
      drawerContent={renderSidebar}
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        swipeEdgeWidth: 60,
        drawerStyle: {
          backgroundColor: colors.surface,
          width: 320,
        },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <RootDrawer.Screen name="Home" component={MerchantNavigator} />
      <RootDrawer.Screen name="Contacts" component={ContactsScreen} />
      <RootDrawer.Screen name="Companies" component={CompaniesScreen} />
      <RootDrawer.Screen name="Deals" component={DealsScreen} />
      <RootDrawer.Screen name="Tasks" component={TasksScreen} />
      <RootDrawer.Screen name="Tickets" component={TicketsScreen} />
      <RootDrawer.Screen name="Conversations" component={ConversationsScreen} />
      <RootDrawer.Screen name="MarketingEmail" component={MarketingEmailScreen} />
      <RootDrawer.Screen name="Calls" component={CallsScreen} />
      <RootDrawer.Screen name="MeetingLinks" component={MeetingLinksScreen} />
      <RootDrawer.Screen name="Feeds" component={FeedsScreen} />
      <RootDrawer.Screen name="Dashboards" component={DashboardsScreen} />
      <RootDrawer.Screen name="Segments" component={SegmentsScreen} />
      <RootDrawer.Screen name="Settings" component={MerchantSettingsStack} />
      <RootDrawer.Screen name="Help" component={HelpScreen} />
      <RootDrawer.Screen name="Profile" component={ProfileScreen} />
    </RootDrawer.Navigator>
  );
};

export default MerchantRootNavigator;
