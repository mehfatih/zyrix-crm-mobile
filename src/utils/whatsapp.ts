/**
 * WhatsApp deep-link helpers.
 *
 * Tries the native `whatsapp://` scheme first; if the app isn't
 * installed (or the OS can't open the URL) we fall back to the web
 * `wa.me` link which opens WhatsApp Web in a browser.
 */

import { Linking } from 'react-native';

const normalizePhone = (phone: string): string => phone.replace(/[^0-9+]/g, '');

const buildMessage = (parts: readonly (string | undefined)[]): string =>
  parts
    .filter((part): part is string => Boolean(part && part.trim()))
    .join('\n\n');

const openViaWhatsapp = async (phone: string, message: string): Promise<void> => {
  const normalized = normalizePhone(phone);
  const encoded = encodeURIComponent(message);
  const nativeUrl = `whatsapp://send?phone=${normalized}&text=${encoded}`;
  const webUrl = `https://wa.me/${normalized.replace('+', '')}?text=${encoded}`;

  try {
    const supported = await Linking.canOpenURL(nativeUrl);
    if (supported) {
      await Linking.openURL(nativeUrl);
      return;
    }
  } catch (err) {
    console.warn('[whatsapp] canOpenURL failed', err);
  }
  await Linking.openURL(webUrl);
};

export const shareQuoteViaWhatsApp = async (
  params: {
    quoteNumber: string;
    customerPhone: string;
    customerName?: string;
    amount?: string;
    documentUrl?: string;
    message?: string;
  }
): Promise<void> => {
  const body = buildMessage([
    params.message,
    params.customerName ? `Hi ${params.customerName},` : undefined,
    `We've prepared quote ${params.quoteNumber}${params.amount ? ` (${params.amount})` : ''}.`,
    params.documentUrl ? `View: ${params.documentUrl}` : undefined,
  ]);
  await openViaWhatsapp(params.customerPhone, body);
};

export const shareInvoiceViaWhatsApp = async (
  params: {
    invoiceNumber: string;
    customerPhone: string;
    customerName?: string;
    amount?: string;
    documentUrl?: string;
    message?: string;
  }
): Promise<void> => {
  const body = buildMessage([
    params.message,
    params.customerName ? `Hi ${params.customerName},` : undefined,
    `Invoice ${params.invoiceNumber}${params.amount ? ` (${params.amount})` : ''} is ready.`,
    params.documentUrl ? `View: ${params.documentUrl}` : undefined,
  ]);
  await openViaWhatsapp(params.customerPhone, body);
};

export const sendWelcomeMessage = async (
  customerPhone: string,
  customerName: string
): Promise<void> => {
  const body = buildMessage([
    `Welcome ${customerName}!`,
    'Thanks for working with us. Let us know if you have any questions.',
  ]);
  await openViaWhatsapp(customerPhone, body);
};
