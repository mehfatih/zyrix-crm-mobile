/**
 * EditCustomerScreen — flat scrollable editor for an existing customer.
 * Changes save through `useUpdateCustomer` which invalidates the list.
 */

import React, { useEffect, useState } from 'react';
import {
  I18nManager,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';

import { Button } from '../../../components/common/Button';
import { Header } from '../../../components/common/Header';
import { Input } from '../../../components/common/Input';
import { PhoneInput } from '../../../components/common/PhoneInput';
import { TagsInput } from '../../../components/forms/TagsInput';
import { TaxIdInput } from '../../../components/common/TaxIdInput';
import { darkColors } from '../../../theme/dark';
import { radius, shadows, spacing } from '../../../constants/spacing';
import { textStyles } from '../../../constants/typography';
import { useCustomer, useUpdateCustomer } from '../../../hooks/useCustomers';
import type { MerchantSalesStackParamList } from '../../../navigation/types';

type Route = RouteProp<MerchantSalesStackParamList, 'EditCustomer'>;

export const EditCustomerScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute<Route>();
  const customerId = route.params.customerId;

  const { data: customer, isLoading } = useCustomer(customerId);
  const updateMut = useUpdateCustomer();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [taxId, setTaxId] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!customer) return;
    setName(customer.name);
    setEmail(customer.email);
    setPhone(customer.phone);
    setCompany(customer.company);
    setTaxId(customer.taxId ?? '');
    setTags(customer.tags);
  }, [customer]);

  const onSave = async (): Promise<void> => {
    try {
      await updateMut.mutateAsync({
        id: customerId,
        data: {
          name,
          email,
          phone,
          company,
          taxId: taxId || undefined,
          tags,
        },
      });
      navigation.goBack();
    } catch (err) {
      console.warn('[editCustomer] save failed', err);
    }
  };

  if (isLoading || !customer) {
    return (
      <SafeAreaView style={styles.safe}>
        <Header
          title={t('common.edit')}
          onBack={() => navigation.goBack()}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <Header
        title={`${t('common.edit')} — ${customer.name}`}
        onBack={() => navigation.goBack()}
      />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Input
            label={t('forms.fullName')}
            value={name}
            onChangeText={setName}
            required
          />
          <Input
            label={t('forms.email')}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <PhoneInput
            label={t('forms.phone')}
            value={phone}
            onChangeText={setPhone}
          />
          <Input
            label={t('customers.contactInfo')}
            value={company}
            onChangeText={setCompany}
          />
          <TaxIdInput value={taxId} onChangeText={setTaxId} />
          <TagsInput
            label={t('customers.tags')}
            value={tags}
            onChange={setTags}
          />
          <Text style={styles.fieldLabel}>
            {t('quoteBuilder.internalNotes')}
          </Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            multiline
            placeholder={t('quoteBuilder.internalNotes')}
            placeholderTextColor={darkColors.textMuted}
            style={[
              styles.textarea,
              { textAlign: I18nManager.isRTL ? 'right' : 'left' },
            ]}
          />
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <Button
          label={t('common.save')}
          onPress={() => void onSave()}
          loading={updateMut.isPending}
          fullWidth
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: darkColors.background },
  scroll: {
    padding: spacing.base,
    paddingBottom: spacing.xxxl,
  },
  card: {
    backgroundColor: darkColors.surface,
    padding: spacing.base,
    borderRadius: radius.lg,
    rowGap: spacing.sm,
    ...shadows.xs,
  },
  fieldLabel: {
    ...textStyles.label,
    color: darkColors.textSecondary,
  },
  textarea: {
    ...textStyles.body,
    color: darkColors.textPrimary,
    borderWidth: 1,
    borderColor: darkColors.border,
    borderRadius: radius.base,
    padding: spacing.sm,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  footer: {
    padding: spacing.base,
    borderTopWidth: 1,
    borderTopColor: darkColors.divider,
    backgroundColor: darkColors.surface,
  },
});

export default EditCustomerScreen;
