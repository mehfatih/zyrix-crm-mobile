/**
 * useRole — reads the current user's role and returns a handful of
 * boolean helpers for conditional rendering.
 *
 *   const { role, isSuperAdmin, isAdmin, isMerchant, isCustomer } = useRole();
 */

import { useMemo } from 'react';

import type { UserRole } from '../types/auth';
import { useUserStore } from '../store/userStore';

export interface UseRoleResult {
  role: UserRole | null;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isPlatformStaff: boolean;
  isMerchant: boolean;
  isMerchantOwner: boolean;
  isMerchantAdmin: boolean;
  isMerchantManager: boolean;
  isMerchantEmployee: boolean;
  isCustomer: boolean;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: readonly UserRole[]) => boolean;
}

const MERCHANT_ROLES: ReadonlyArray<UserRole> = [
  'merchant_owner',
  'merchant_admin',
  'merchant_manager',
  'merchant_employee',
];

export const useRole = (): UseRoleResult => {
  const currentUser = useUserStore((s) => s.currentUser);
  const role = currentUser?.role ?? null;

  return useMemo<UseRoleResult>(() => {
    const isSuperAdmin = role === 'super_admin';
    const isAdmin = role === 'admin';
    const isPlatformStaff = isSuperAdmin || isAdmin;
    const isMerchantOwner = role === 'merchant_owner';
    const isMerchantAdmin = role === 'merchant_admin';
    const isMerchantManager = role === 'merchant_manager';
    const isMerchantEmployee = role === 'merchant_employee';
    const isMerchant = Boolean(role && MERCHANT_ROLES.includes(role));
    const isCustomer = role === 'customer';

    const hasRole = (target: UserRole): boolean => role === target;
    const hasAnyRole = (targets: readonly UserRole[]): boolean =>
      Boolean(role && targets.includes(role));

    return {
      role,
      isSuperAdmin,
      isAdmin,
      isPlatformStaff,
      isMerchant,
      isMerchantOwner,
      isMerchantAdmin,
      isMerchantManager,
      isMerchantEmployee,
      isCustomer,
      hasRole,
      hasAnyRole,
    };
  }, [role]);
};
