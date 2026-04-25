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
  ForgotPassword: undefined;
  Onboarding: undefined;
  TwoFactorPrompt: undefined;
};

export type AdminCompaniesStackParamList = {
  CompaniesList: undefined;
  CompanyDetail: { companyId: string };
};

export type AdminUsersStackParamList = {
  UsersList: undefined;
  UserDetail: { userId: string };
};

export type AdminPlansStackParamList = {
  PlansList: undefined;
  EditPlan: { planId: string | null };
};

export type AdminSecurityStackParamList = {
  SecurityHome: undefined;
  IPAllowlist: undefined;
  NetworkRules: undefined;
  SCIMTokens: undefined;
  RetentionPolicies: undefined;
  ComplianceExports: undefined;
};

/** Admin drawer — super_admin / admin. */
export type AdminDrawerParamList = {
  AdminDashboard: undefined;
  Companies: NavigatorScreenParams<AdminCompaniesStackParamList>;
  Users: NavigatorScreenParams<AdminUsersStackParamList>;
  FeatureFlags: undefined;
  Plans: NavigatorScreenParams<AdminPlansStackParamList>;
  AuditLog: undefined;
  Security: NavigatorScreenParams<AdminSecurityStackParamList>;
  SystemStats: undefined;
  SystemNotifications: undefined;
  Settings: undefined;
};

export type MerchantSalesStackParamList = {
  Customers: undefined;
  CustomerDetail: { customerId: string } | undefined;
  NewCustomer: undefined;
  EditCustomer: { customerId: string };
  Deals: undefined;
  DealDetail: { dealId: string } | undefined;
  NewDeal: undefined;
  Pipeline: undefined;
  Quotes: undefined;
  QuoteDetail: { quoteId: string };
  QuoteBuilder: { quoteId?: string } | undefined;
  Contracts: undefined;
  ContractDetail: { contractId: string };
  ContractBuilder: { contractId?: string } | undefined;
  Commissions: undefined;
  Territories: undefined;
  QuotasForecast: undefined;
  HealthScores: undefined;
};

export type MerchantGrowthStackParamList = {
  Loyalty: undefined;
  LoyaltyRules: undefined;
  NewLoyaltyReward: undefined;
  Campaigns: undefined;
  NewCampaign: undefined;
  Automation: undefined;
  NewAutomation: undefined;
};

export type MerchantAIStackParamList = {
  AICFO: undefined;
  AIWorkflows: undefined;
  AIWorkflowBuilder: undefined;
  AIBuilder: undefined;
  LeadScoring: undefined;
  LeadScoreDetail: { leadId: string };
  ConversationIntel: undefined;
  ConversationAnalysis: { conversationId: string };
  DuplicateDetection: undefined;
  DuplicateReview: { groupId: string };
  MeetingIntel: undefined;
  MeetingDetail: { meetingId: string };
  UploadMeeting: undefined;
};

export type MerchantOperationsStackParamList = {
  Payments: undefined;
  PaymentDetail: { paymentId: string };
  NewPaymentLink: undefined;
  Refunds: undefined;
  NewRefund: undefined;
};

export type MerchantComplianceStackParamList = {
  Invoices: undefined;
  InvoiceDetail: { invoiceId: string };
  NewInvoice: undefined;
  TaxInvoices: undefined;
};

export type HelpStackParamList = {
  HelpHome: undefined;
  HelpCategory: { categoryId: string };
  HelpArticle: { categoryId: string; slug: string };
  HelpSearch: undefined;
};

export type MerchantSettingsStackParamList = {
  SettingsHome: undefined;
  PaymentGateways: undefined;
  Security: undefined;
  DeviceManagement: undefined;
  IPAllowlist: undefined;
  TwoFactor: undefined;
  SecurityLog: undefined;
};

export type MerchantMoreDrawerParamList = {
  Operations: NavigatorScreenParams<MerchantOperationsStackParamList>;
  Compliance: NavigatorScreenParams<MerchantComplianceStackParamList>;
  Reports: undefined;
  Integrations: undefined;
  Settings: NavigatorScreenParams<MerchantSettingsStackParamList>;
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
