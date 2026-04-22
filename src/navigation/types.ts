/**
 * Shared navigation param list definitions.
 *
 * Keep these in one file so every navigator + `useNavigation` call can
 * reference a single source of truth for route names and params.
 */

export type AuthStackParamList = {
  Splash: undefined;
  LanguageSelection: undefined;
  Login: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  App: undefined;
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

/** Merchant — bottom tabs holding a stack per tab. */
export type MerchantTabParamList = {
  DashboardTab: undefined;
  SalesTab: undefined;
  AITab: undefined;
  GrowthTab: undefined;
  MoreTab: undefined;
};

export type MerchantSalesStackParamList = {
  Customers: undefined;
  CustomerDetail: { customerId: string } | undefined;
  Deals: undefined;
  Pipeline: undefined;
  Quotes: undefined;
  Contracts: undefined;
  Commissions: undefined;
};

export type MerchantAIStackParamList = {
  AICFO: undefined;
  AIWorkflows: undefined;
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

/** Customer portal tabs. */
export type CustomerTabParamList = {
  CustomerHome: undefined;
  CustomerDocuments: undefined;
  CustomerPayments: undefined;
  CustomerSupport: undefined;
  CustomerProfile: undefined;
};
