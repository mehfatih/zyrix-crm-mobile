/**
 * Shared navigation param list definitions.
 *
 * Keep these in one file so every navigator + `useNavigation` call can
 * reference a single source of truth for route names and params. Nested
 * navigators are wired via `NavigatorScreenParams` so typed `navigate`
 * calls work end-to-end (e.g. `navigate('SalesTab', { screen: 'DealDetail' })`).
 */

import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Splash: undefined;
  LanguageSelection: undefined;
  Login: undefined;
  Register: undefined;
  Onboarding: undefined;
};

/** Admin drawer — super_admin / admin. */
export type AdminDrawerParamList = {
  AdminDashboard: undefined;
  Companies: undefined;
  Users: undefined;
  FeatureFlags: undefined;
  AuditLog: undefined;
  Security: undefined;
  Plans: undefined;
  Settings: undefined;
};

export type MerchantSalesStackParamList = {
  Customers: undefined;
  CustomerDetail: { customerId: string } | undefined;
  Deals: undefined;
  DealDetail: { dealId: string } | undefined;
  Pipeline: undefined;
  Quotes: undefined;
  Contracts: undefined;
  Commissions: undefined;
  Territories: undefined;
  QuotasForecast: undefined;
  HealthScores: undefined;
};

export type MerchantAIStackParamList = {
  AICFO: undefined;
  AIWorkflows: undefined;
  AIBuilder: undefined;
  LeadScoring: undefined;
  ConversationIntel: undefined;
  MeetingIntel: undefined;
};

export type MerchantGrowthStackParamList = {
  Loyalty: undefined;
  Campaigns: undefined;
  Automation: undefined;
};

export type MerchantMoreDrawerParamList = {
  Operations: undefined;
  Compliance: undefined;
  Reports: undefined;
  Integrations: undefined;
  Settings: undefined;
  Profile: undefined;
};

/** Merchant — bottom tabs holding a stack/drawer per tab. */
export type MerchantTabParamList = {
  DashboardTab: undefined;
  SalesTab: NavigatorScreenParams<MerchantSalesStackParamList>;
  AITab: NavigatorScreenParams<MerchantAIStackParamList>;
  GrowthTab: NavigatorScreenParams<MerchantGrowthStackParamList>;
  MoreTab: NavigatorScreenParams<MerchantMoreDrawerParamList>;
};

/** Customer portal tabs. */
export type CustomerTabParamList = {
  CustomerHome: undefined;
  CustomerDocuments: undefined;
  CustomerPayments: undefined;
  CustomerSupport: undefined;
  CustomerProfile: undefined;
};

/** Root — the top-level switch picks one of these based on auth + role. */
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Admin: NavigatorScreenParams<AdminDrawerParamList>;
  Merchant: NavigatorScreenParams<MerchantTabParamList>;
  Customer: NavigatorScreenParams<CustomerTabParamList>;
};
