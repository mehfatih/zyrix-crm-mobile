/**
 * AdminDashboardScreen — Sprint 2 placeholder. Real platform stats
 * (tenants, revenue, support load) land in Sprint 8.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';

import { PlaceholderAdminScreen } from './PlaceholderAdminScreen';

export const AdminDashboardScreen: React.FC = () => {
  const { t } = useTranslation();
  return (
    <PlaceholderAdminScreen
      title={t('navigation.adminDashboard')}
      sprint={8}
      icon="speedometer-outline"
    />
  );
};

export default AdminDashboardScreen;
