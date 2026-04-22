/**
 * usePermissions — thin hook exposing the current user's permission
 * matrix and a small set of helpers for use in UI code.
 *
 *   const { hasPermission, canDo, canAccess } = usePermissions();
 *   if (hasPermission('canViewRevenue')) { ... }
 *
 * `canDo` and `canAccess` are sugar on top of `hasPermission`:
 *   - canDo('editDeals')  → checks canEditDeals
 *   - canAccess('customers') → checks canViewCustomers
 * The string form keeps call sites readable without importing the
 * PermissionKey union everywhere.
 */

import { useCallback, useMemo } from 'react';

import { EMPTY_PERMISSIONS, type PermissionKey, type UserPermissions } from '../types/auth';
import { useUserStore } from '../store/userStore';

type ModuleKey =
  | 'companies'
  | 'users'
  | 'featureFlags'
  | 'auditLog'
  | 'security'
  | 'plans'
  | 'customers'
  | 'deals'
  | 'quotes'
  | 'contracts'
  | 'commissions'
  | 'revenue'
  | 'campaigns'
  | 'loyalty'
  | 'automation'
  | 'aiCfo'
  | 'aiWorkflows'
  | 'integrations'
  | 'operations'
  | 'reports'
  | 'settings';

type ActionKey =
  | 'manageCompanies'
  | 'manageUsers'
  | 'manageFeatureFlags'
  | 'viewAuditLog'
  | 'manageSecurity'
  | 'managePlans'
  | 'viewCustomers'
  | 'editCustomers'
  | 'deleteCustomers'
  | 'viewDeals'
  | 'editDeals'
  | 'approveQuotes'
  | 'manageContracts'
  | 'viewCommissions'
  | 'viewRevenue'
  | 'manageCampaigns'
  | 'manageLoyalty'
  | 'manageAutomation'
  | 'useAICFO'
  | 'useAIWorkflows'
  | 'manageIntegrations'
  | 'manageOperations'
  | 'viewReports'
  | 'exportData'
  | 'manageSettings';

const ACTION_TO_PERMISSION: Record<ActionKey, PermissionKey> = {
  manageCompanies: 'canManageCompanies',
  manageUsers: 'canManageUsers',
  manageFeatureFlags: 'canManageFeatureFlags',
  viewAuditLog: 'canViewAuditLog',
  manageSecurity: 'canManageSecurity',
  managePlans: 'canManagePlans',
  viewCustomers: 'canViewCustomers',
  editCustomers: 'canEditCustomers',
  deleteCustomers: 'canDeleteCustomers',
  viewDeals: 'canViewDeals',
  editDeals: 'canEditDeals',
  approveQuotes: 'canApproveQuotes',
  manageContracts: 'canManageContracts',
  viewCommissions: 'canViewCommissions',
  viewRevenue: 'canViewRevenue',
  manageCampaigns: 'canManageCampaigns',
  manageLoyalty: 'canManageLoyalty',
  manageAutomation: 'canManageAutomation',
  useAICFO: 'canUseAICFO',
  useAIWorkflows: 'canUseAIWorkflows',
  manageIntegrations: 'canManageIntegrations',
  manageOperations: 'canManageOperations',
  viewReports: 'canViewReports',
  exportData: 'canExportData',
  manageSettings: 'canManageSettings',
};

const MODULE_TO_PERMISSION: Record<ModuleKey, PermissionKey> = {
  companies: 'canManageCompanies',
  users: 'canManageUsers',
  featureFlags: 'canManageFeatureFlags',
  auditLog: 'canViewAuditLog',
  security: 'canManageSecurity',
  plans: 'canManagePlans',
  customers: 'canViewCustomers',
  deals: 'canViewDeals',
  quotes: 'canApproveQuotes',
  contracts: 'canManageContracts',
  commissions: 'canViewCommissions',
  revenue: 'canViewRevenue',
  campaigns: 'canManageCampaigns',
  loyalty: 'canManageLoyalty',
  automation: 'canManageAutomation',
  aiCfo: 'canUseAICFO',
  aiWorkflows: 'canUseAIWorkflows',
  integrations: 'canManageIntegrations',
  operations: 'canManageOperations',
  reports: 'canViewReports',
  settings: 'canManageSettings',
};

export interface UsePermissionsResult {
  permissions: UserPermissions;
  hasPermission: (key: PermissionKey) => boolean;
  canDo: (action: ActionKey) => boolean;
  canAccess: (module: ModuleKey) => boolean;
}

export const usePermissions = (): UsePermissionsResult => {
  const permissions = useUserStore((s) => s.permissions);

  const effective = useMemo<UserPermissions>(
    () => permissions ?? { ...EMPTY_PERMISSIONS },
    [permissions]
  );

  const hasPermission = useCallback(
    (key: PermissionKey): boolean => Boolean(effective[key]),
    [effective]
  );

  const canDo = useCallback(
    (action: ActionKey): boolean => {
      const key = ACTION_TO_PERMISSION[action];
      return key ? Boolean(effective[key]) : false;
    },
    [effective]
  );

  const canAccess = useCallback(
    (module: ModuleKey): boolean => {
      const key = MODULE_TO_PERMISSION[module];
      return key ? Boolean(effective[key]) : false;
    },
    [effective]
  );

  return { permissions: effective, hasPermission, canDo, canAccess };
};

export type { ActionKey, ModuleKey };
