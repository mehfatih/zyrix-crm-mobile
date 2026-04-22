/**
 * Shared auth-related type definitions.
 *
 * The permission matrix is intentionally flat and boolean-keyed so it's
 * easy to check a single capability via `user.permissions.canViewRevenue`
 * without crawling nested structures. Roles are the source of truth for
 * which set of permissions is granted on login.
 */

export const USER_ROLES = [
  'super_admin',
  'admin',
  'merchant_owner',
  'merchant_admin',
  'merchant_manager',
  'merchant_employee',
  'customer',
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export type SupportedPlan =
  | 'free'
  | 'starter'
  | 'pro'
  | 'business'
  | 'enterprise';

/**
 * Granular capability matrix. 25 boolean flags describing what a user
 * can do inside the app. The shape is stable so UI code can rely on
 * keys existing even when a value is `false`.
 */
export interface UserPermissions {
  // Platform administration
  canManageCompanies: boolean;
  canManageUsers: boolean;
  canManageFeatureFlags: boolean;
  canViewAuditLog: boolean;
  canManageSecurity: boolean;
  canManagePlans: boolean;

  // Customer relationship management
  canViewCustomers: boolean;
  canEditCustomers: boolean;
  canDeleteCustomers: boolean;

  // Sales pipeline
  canViewDeals: boolean;
  canEditDeals: boolean;
  canApproveQuotes: boolean;
  canManageContracts: boolean;
  canViewCommissions: boolean;

  // Finance & growth
  canViewRevenue: boolean;
  canManageCampaigns: boolean;
  canManageLoyalty: boolean;
  canManageAutomation: boolean;

  // AI tools
  canUseAICFO: boolean;
  canUseAIWorkflows: boolean;

  // Operations
  canManageIntegrations: boolean;
  canManageOperations: boolean;
  canViewReports: boolean;
  canExportData: boolean;
  canManageSettings: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  companyId: string | null;
  avatar: string | null;
  phone: string | null;
  country: string | null;
  language: string | null;
  permissions: UserPermissions;
}

/**
 * Minimal legacy-compatible shape for existing authStore consumers.
 * The richer `User` type is the canonical one going forward.
 */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  role?: UserRole | null;
  plan?: SupportedPlan | null;
  locale?: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResult {
  user: AuthUser;
  token: string;
}

/**
 * Default "deny all" permission set. Use as a base when composing
 * role-specific permission maps so it's obvious what's being opted
 * into.
 */
export const EMPTY_PERMISSIONS: UserPermissions = {
  canManageCompanies: false,
  canManageUsers: false,
  canManageFeatureFlags: false,
  canViewAuditLog: false,
  canManageSecurity: false,
  canManagePlans: false,
  canViewCustomers: false,
  canEditCustomers: false,
  canDeleteCustomers: false,
  canViewDeals: false,
  canEditDeals: false,
  canApproveQuotes: false,
  canManageContracts: false,
  canViewCommissions: false,
  canViewRevenue: false,
  canManageCampaigns: false,
  canManageLoyalty: false,
  canManageAutomation: false,
  canUseAICFO: false,
  canUseAIWorkflows: false,
  canManageIntegrations: false,
  canManageOperations: false,
  canViewReports: false,
  canExportData: false,
  canManageSettings: false,
};

const ALL_PERMISSIONS: UserPermissions = {
  canManageCompanies: true,
  canManageUsers: true,
  canManageFeatureFlags: true,
  canViewAuditLog: true,
  canManageSecurity: true,
  canManagePlans: true,
  canViewCustomers: true,
  canEditCustomers: true,
  canDeleteCustomers: true,
  canViewDeals: true,
  canEditDeals: true,
  canApproveQuotes: true,
  canManageContracts: true,
  canViewCommissions: true,
  canViewRevenue: true,
  canManageCampaigns: true,
  canManageLoyalty: true,
  canManageAutomation: true,
  canUseAICFO: true,
  canUseAIWorkflows: true,
  canManageIntegrations: true,
  canManageOperations: true,
  canViewReports: true,
  canExportData: true,
  canManageSettings: true,
};

/**
 * Canonical role → permission mapping. Single place to tweak access
 * control. Platform-level roles (super_admin, admin) get platform
 * admin perms; merchant roles get a progressively narrower slice.
 */
export const ROLE_PERMISSIONS: Record<UserRole, UserPermissions> = {
  super_admin: { ...ALL_PERMISSIONS },
  admin: {
    ...ALL_PERMISSIONS,
    canManageFeatureFlags: false,
    canManagePlans: false,
  },
  merchant_owner: {
    ...EMPTY_PERMISSIONS,
    canViewCustomers: true,
    canEditCustomers: true,
    canDeleteCustomers: true,
    canViewDeals: true,
    canEditDeals: true,
    canApproveQuotes: true,
    canManageContracts: true,
    canViewCommissions: true,
    canViewRevenue: true,
    canManageCampaigns: true,
    canManageLoyalty: true,
    canManageAutomation: true,
    canUseAICFO: true,
    canUseAIWorkflows: true,
    canManageIntegrations: true,
    canManageOperations: true,
    canViewReports: true,
    canExportData: true,
    canManageSettings: true,
    canManageUsers: true,
  },
  merchant_admin: {
    ...EMPTY_PERMISSIONS,
    canViewCustomers: true,
    canEditCustomers: true,
    canDeleteCustomers: true,
    canViewDeals: true,
    canEditDeals: true,
    canApproveQuotes: true,
    canManageContracts: true,
    canViewCommissions: true,
    canViewRevenue: true,
    canManageCampaigns: true,
    canManageLoyalty: true,
    canManageAutomation: true,
    canUseAIWorkflows: true,
    canManageIntegrations: true,
    canManageOperations: true,
    canViewReports: true,
    canExportData: true,
    canManageSettings: true,
    canManageUsers: true,
  },
  merchant_manager: {
    ...EMPTY_PERMISSIONS,
    canViewCustomers: true,
    canEditCustomers: true,
    canViewDeals: true,
    canEditDeals: true,
    canApproveQuotes: true,
    canManageContracts: true,
    canViewCommissions: true,
    canManageCampaigns: true,
    canManageLoyalty: true,
    canUseAIWorkflows: true,
    canManageOperations: true,
    canViewReports: true,
  },
  merchant_employee: {
    ...EMPTY_PERMISSIONS,
    canViewCustomers: true,
    canEditCustomers: true,
    canViewDeals: true,
    canEditDeals: true,
  },
  customer: {
    ...EMPTY_PERMISSIONS,
  },
};

export const getPermissionsForRole = (role: UserRole): UserPermissions => ({
  ...ROLE_PERMISSIONS[role],
});

export type PermissionKey = keyof UserPermissions;
