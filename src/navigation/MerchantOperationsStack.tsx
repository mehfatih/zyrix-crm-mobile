/**
 * MerchantOperationsStack — payments, refunds, and the new-payment-link
 * builder live under the "Operations" entry of the More drawer.
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { NewPaymentLinkScreen } from '../screens/merchant/operations/NewPaymentLinkScreen';
import { NewRefundScreen } from '../screens/merchant/operations/NewRefundScreen';
import { PaymentDetailScreen } from '../screens/merchant/operations/PaymentDetailScreen';
import { PaymentsScreen } from '../screens/merchant/operations/PaymentsScreen';
import { RefundsScreen } from '../screens/merchant/operations/RefundsScreen';
import type { MerchantOperationsStackParamList } from './types';

const Stack = createNativeStackNavigator<MerchantOperationsStackParamList>();

export const MerchantOperationsStack: React.FC = () => (
  <Stack.Navigator
    initialRouteName="Payments"
    screenOptions={{ headerShown: false }}
  >
    <Stack.Screen name="Payments" component={PaymentsScreen} />
    <Stack.Screen name="PaymentDetail" component={PaymentDetailScreen} />
    <Stack.Screen name="NewPaymentLink" component={NewPaymentLinkScreen} />
    <Stack.Screen name="Refunds" component={RefundsScreen} />
    <Stack.Screen name="NewRefund" component={NewRefundScreen} />
  </Stack.Navigator>
);

export default MerchantOperationsStack;
