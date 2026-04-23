/**
 * MerchantComplianceStack — invoices + tax compliance under the
 * "Compliance" entry of the More drawer. Country-specific previews
 * (ZATCA / e-Fatura / generic) are picked inside `InvoiceDetailScreen`.
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { InvoiceDetailScreen } from '../screens/merchant/compliance/InvoiceDetailScreen';
import { InvoicesScreen } from '../screens/merchant/compliance/InvoicesScreen';
import { NewInvoiceScreen } from '../screens/merchant/compliance/NewInvoiceScreen';
import { TaxInvoicesScreen } from '../screens/merchant/compliance/TaxInvoicesScreen';
import type { MerchantComplianceStackParamList } from './types';

const Stack = createNativeStackNavigator<MerchantComplianceStackParamList>();

export const MerchantComplianceStack: React.FC = () => (
  <Stack.Navigator
    initialRouteName="Invoices"
    screenOptions={{ headerShown: false }}
  >
    <Stack.Screen name="Invoices" component={InvoicesScreen} />
    <Stack.Screen name="InvoiceDetail" component={InvoiceDetailScreen} />
    <Stack.Screen name="NewInvoice" component={NewInvoiceScreen} />
    <Stack.Screen name="TaxInvoices" component={TaxInvoicesScreen} />
  </Stack.Navigator>
);

export default MerchantComplianceStack;
