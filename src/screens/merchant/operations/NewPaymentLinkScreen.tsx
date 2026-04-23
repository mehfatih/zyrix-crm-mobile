/**
 * NewPaymentLinkScreen — generate a payment link with country-aware
 * payment method picker. After generation we surface the URL with
 * share buttons (WhatsApp, Email, SMS, copy link) and a placeholder
 * QR (the actual QR is generated server-side once the link is hit).
 */

import React, { useMemo, useState } from 'react';
import {
  Alert,
  I18nManager,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';

import { Button } from '../../../components/common/Button';
import { DatePicker } from '../../../components/forms/DatePicker';
import { Header } from '../../../components/common/Header';
import { Icon, type AnyIconName } from '../../../components/common/Icon';
import { LocalizedCurrencyInput } from '../../../components/common/LocalizedCurrencyInput';
import { QRCodeDisplay } from '../../../components/feature-specific/QRCodeDisplay';
import { SearchableDropdown, type DropdownItem } from '../../../components/forms/SearchableDropdown';
import { colors } from '../../../constants/colors';
import { listCustomers } from '../../../api/customers';
import { radius, shadows, spacing } from '../../../constants/spacing';
import { textStyles } from '../../../constants/typography';
import { useCountryConfig } from '../../../hooks/useCountryConfig';
import { useCreatePaymentLink } from '../../../hooks/usePayments';
import { useToast } from '../../../hooks/useToast';
import type { PaymentMethodKey } from '../../../types/billing';

const today7 = (): Date => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 7);
  return d;
};

export const NewPaymentLinkScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const toast = useToast();
  const { config } = useCountryConfig();
  const createMut = useCreatePaymentLink();

  const customersQuery = useQuery({
    queryKey: ['customers', 'picker'],
    queryFn: () => listCustomers({ pageSize: 100 }),
  });

  const customerOptions = useMemo<DropdownItem[]>(
    () =>
      (customersQuery.data?.items ?? []).map((c) => ({
        id: c.id,
        label: c.name,
        subtitle: c.email,
      })),
    [customersQuery.data]
  );

  const [customer, setCustomer] = useState<DropdownItem | null>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [expiresAt, setExpiresAt] = useState<Date | null>(today7());
  const [allowPartial, setAllowPartial] = useState(false);
  const [notes, setNotes] = useState('');
  const [selectedMethods, setSelectedMethods] = useState<PaymentMethodKey[]>(
    config.paymentMethods.slice(0, 3) as PaymentMethodKey[]
  );
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);

  const toggleMethod = (method: PaymentMethodKey): void => {
    setSelectedMethods((prev) =>
      prev.includes(method)
        ? prev.filter((m) => m !== method)
        : [...prev, method]
    );
  };

  const canGenerate =
    Number(amount.replace(/,/g, '')) > 0 &&
    description.trim().length > 0 &&
    selectedMethods.length > 0 &&
    !!expiresAt;

  const generate = async (): Promise<void> => {
    if (!canGenerate || !expiresAt) return;
    try {
      const link = await createMut.mutateAsync({
        amount: Number(amount.replace(/,/g, '')),
        currency: config.currency,
        description,
        customerId: customer?.id,
        expiresAt: expiresAt.toISOString().slice(0, 10),
        paymentMethods: selectedMethods,
        allowPartial,
        customerNotes: notes,
      });
      setGeneratedUrl(link.url);
    } catch (err) {
      console.warn('[paymentLink] failed', err);
    }
  };

  const share = async (channel: 'whatsapp' | 'email' | 'sms' | 'copy'): Promise<void> => {
    if (!generatedUrl) return;
    if (channel === 'copy') {
      toast.success(t('paymentLinks.linkCopied'));
      return;
    }
    if (channel === 'whatsapp') {
      const url = `https://wa.me/?text=${encodeURIComponent(`${description}\n${generatedUrl}`)}`;
      try {
        await Linking.openURL(url);
      } catch (err) {
        toast.error(t('common.error'), (err as Error).message);
      }
      return;
    }
    if (channel === 'email') {
      try {
        await Linking.openURL(
          `mailto:?subject=${encodeURIComponent(description)}&body=${encodeURIComponent(generatedUrl)}`
        );
      } catch (err) {
        toast.error(t('common.error'), (err as Error).message);
      }
      return;
    }
    if (channel === 'sms') {
      try {
        await Linking.openURL(`sms:?body=${encodeURIComponent(generatedUrl)}`);
      } catch (err) {
        toast.error(t('common.error'), (err as Error).message);
      }
    }
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <Header
        title={t('payments.newPaymentLink')}
        onBack={() => navigation.goBack()}
      />
      {generatedUrl ? (
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.successCard}>
            <View style={styles.successCircle}>
              <Icon name="checkmark" size={36} color={colors.textInverse} />
            </View>
            <Text style={styles.successTitle}>{t('paymentLinks.linkGenerated')}</Text>
            <Pressable
              onPress={() => Linking.openURL(generatedUrl)}
              style={styles.linkBox}
            >
              <Text style={styles.linkText} numberOfLines={1}>
                {generatedUrl}
              </Text>
            </Pressable>
            <QRCodeDisplay base64Data={undefined} size={150} />
          </View>

          <View style={styles.shareRow}>
            {(
              [
                { key: 'whatsapp', icon: 'logo-whatsapp', label: 'paymentLinks.shareViaWhatsApp' },
                { key: 'email', icon: 'mail-outline', label: 'paymentLinks.shareViaEmail' },
                { key: 'sms', icon: 'chatbubble-outline', label: 'paymentLinks.shareViaSMS' },
                { key: 'copy', icon: 'copy-outline', label: 'paymentLinks.copyToClipboard' },
              ] as const
            ).map((entry) => (
              <Pressable
                key={entry.key}
                onPress={() => void share(entry.key)}
                style={({ pressed }) => [
                  styles.shareBtn,
                  pressed ? { opacity: 0.85 } : null,
                ]}
              >
                <Icon name={entry.icon as AnyIconName} size={22} color={colors.primary} />
                <Text style={styles.shareLabel}>{t(entry.label)}</Text>
              </Pressable>
            ))}
          </View>

          <Button
            label={t('common.continue')}
            onPress={() => navigation.goBack()}
            fullWidth
          />
        </ScrollView>
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.scroll}>
            <View style={styles.card}>
              <SearchableDropdown
                items={customerOptions}
                value={customer}
                onChange={setCustomer}
                label={t('quoteBuilder.customer')}
              />
              <LocalizedCurrencyInput
                label={t('payments.amount')}
                value={amount}
                onChangeText={setAmount}
              />
              <Text style={styles.fieldLabel}>{t('payments.description')}</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder={t('payments.description')}
                placeholderTextColor={colors.textMuted}
                style={[
                  styles.textInput,
                  { textAlign: I18nManager.isRTL ? 'right' : 'left' },
                ]}
              />
              <DatePicker
                label={t('payments.expiresOn')}
                value={expiresAt}
                onChange={setExpiresAt}
                minDate={new Date()}
              />
            </View>

            <View style={styles.card}>
              <Text style={styles.fieldLabel}>{t('paymentMethods.cash')}</Text>
              <View style={styles.methodRow}>
                {config.paymentMethods.map((method) => {
                  const checked = selectedMethods.includes(method as PaymentMethodKey);
                  return (
                    <Pressable
                      key={method}
                      onPress={() => toggleMethod(method as PaymentMethodKey)}
                      style={[
                        styles.methodChip,
                        checked ? styles.methodChipActive : null,
                      ]}
                    >
                      <Icon
                        name={checked ? 'checkmark-circle' : 'ellipse-outline'}
                        size={16}
                        color={checked ? colors.primary : colors.border}
                      />
                      <Text
                        style={[
                          styles.methodLabel,
                          checked ? { color: colors.primaryDark, fontWeight: '700' } : null,
                        ]}
                      >
                        {t(`paymentMethods.${method}`, method)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.toggleRow}>
                <Text style={styles.fieldLabel}>
                  {t('paymentLinks.allowPartialPayment')}
                </Text>
                <Switch
                  value={allowPartial}
                  onValueChange={setAllowPartial}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={colors.white}
                />
              </View>
              <Text style={styles.fieldLabel}>
                {t('quoteBuilder.customerNotes')}
              </Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder={t('quoteBuilder.customerNotes')}
                placeholderTextColor={colors.textMuted}
                multiline
                style={[
                  styles.textarea,
                  { textAlign: I18nManager.isRTL ? 'right' : 'left' },
                ]}
              />
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Button
              label={t('paymentLinks.generateLink')}
              onPress={() => void generate()}
              disabled={!canGenerate}
              loading={createMut.isPending}
              fullWidth
            />
          </View>
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: {
    padding: spacing.base,
    paddingBottom: spacing.xxxl,
    rowGap: spacing.base,
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.base,
    borderRadius: radius.lg,
    rowGap: spacing.sm,
    ...shadows.xs,
  },
  fieldLabel: {
    ...textStyles.label,
    color: colors.textSecondary,
  },
  textInput: {
    ...textStyles.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.base,
    padding: spacing.sm,
    minHeight: 44,
  },
  textarea: {
    ...textStyles.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.base,
    padding: spacing.sm,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  methodRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  methodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  methodChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  methodLabel: {
    ...textStyles.caption,
    color: colors.textSecondary,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footer: {
    padding: spacing.base,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    backgroundColor: colors.surface,
  },
  successCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.xl,
    alignItems: 'center',
    rowGap: spacing.sm,
    ...shadows.md,
  },
  successCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    ...textStyles.h3,
    color: colors.textPrimary,
  },
  linkBox: {
    width: '100%',
    backgroundColor: colors.primarySoft,
    padding: spacing.sm,
    borderRadius: radius.base,
  },
  linkText: {
    ...textStyles.body,
    color: colors.primaryDark,
    textAlign: 'center',
  },
  shareRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  shareBtn: {
    flex: 1,
    minWidth: 140,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  shareLabel: {
    ...textStyles.button,
    color: colors.primary,
  },
});

export default NewPaymentLinkScreen;
