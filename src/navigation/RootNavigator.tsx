/**
 * RootNavigator — picks the correct top-level navigator based on
 * authentication + role.
 *
 *   not authenticated          → AuthNavigator
 *   super_admin | admin        → AdminNavigator   (drawer)
 *   merchant_*                 → MerchantNavigator (bottom tabs)
 *   customer                   → CustomerNavigator (bottom tabs)
 *   authenticated, no role yet → LoadingScreen     (profile hydrating)
 *
 * While either the auth or user store is still hydrating we show the
 * SplashScreen; once hydrated, any transient gap (authenticated but
 * profile not yet loaded) falls through to LoadingScreen rather than
 * a blank frame.
 */

import React, { useEffect } from 'react';

import { AdminNavigator } from './AdminNavigator';
import { AuthNavigator } from './AuthNavigator';
import { CustomerNavigator } from './CustomerNavigator';
import { MerchantNavigator } from './MerchantNavigator';
import { LoadingScreen } from '../screens/common/LoadingScreen';
import { SplashScreen } from '../screens/auth/SplashScreen';
import { useAuthStore } from '../store/authStore';
import { useCountryConfigStore } from '../store/countryConfigStore';
import { useUiStore } from '../store/uiStore';
import { useUserStore } from '../store/userStore';
import type { UserRole } from '../types/auth';

const pickNavigator = (role: UserRole | null): React.ReactElement => {
  switch (role) {
    case 'super_admin':
    case 'admin':
      return <AdminNavigator />;
    case 'merchant_owner':
    case 'merchant_admin':
    case 'merchant_manager':
    case 'merchant_employee':
      return <MerchantNavigator />;
    case 'customer':
      return <CustomerNavigator />;
    default:
      return <LoadingScreen />;
  }
};

export const RootNavigator: React.FC = () => {
  const authHasHydrated = useAuthStore((s) => s.hasHydrated);
  const uiHasHydrated = useUiStore((s) => s.hasHydrated);
  const userHasHydrated = useUserStore((s) => s.hasHydrated);
  const countryHasHydrated = useCountryConfigStore((s) => s.hasHydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const currentUser = useUserStore((s) => s.currentUser);

  const hydrateAuth = useAuthStore((s) => s.hydrate);
  const hydrateUi = useUiStore((s) => s.hydrate);
  const hydrateUser = useUserStore((s) => s.hydrate);
  const hydrateCountry = useCountryConfigStore((s) => s.hydrate);

  useEffect(() => {
    void hydrateAuth();
    void hydrateUi();
    void hydrateUser();
    void hydrateCountry();
  }, [hydrateAuth, hydrateUi, hydrateUser, hydrateCountry]);

  if (
    !authHasHydrated ||
    !uiHasHydrated ||
    !userHasHydrated ||
    !countryHasHydrated
  ) {
    return <SplashScreen />;
  }

  if (!isAuthenticated) {
    return <AuthNavigator />;
  }

  return pickNavigator(currentUser?.role ?? null);
};

export default RootNavigator;
