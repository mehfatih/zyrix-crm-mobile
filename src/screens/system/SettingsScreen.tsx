/**
 * SettingsScreen — system-level settings entry from the SmartSidebar.
 * Re-uses the existing merchant settings home so we don't fork the
 * security / payment-gateway flows; this screen exists so the
 * sidebar route name is co-located with the other system entries.
 */

import React from 'react';

import { MerchantSettingsStack } from '../../navigation/MerchantSettingsStack';

export const SettingsScreen: React.FC = () => <MerchantSettingsStack />;

export default SettingsScreen;
