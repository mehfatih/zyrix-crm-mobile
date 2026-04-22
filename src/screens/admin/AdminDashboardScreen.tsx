/**
 * AdminDashboardScreen — Sprint 2 placeholder. Real platform stats
 * (tenants, revenue, support load) land in Sprint 8.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';

import { PlaceholderScreen } from '../common/PlaceholderScreen';

export const AdminDashboardScreen: React.FC = () => {
  const { t } = useTranslation();
  return (
    <PlaceholderScreen
      title={t('navigation.adminDashboard')}
      sprintNumber={8}
      icon="speedometer-outline"
      showMenuButton
    />
  );
};

export default AdminDashboardScreen;
