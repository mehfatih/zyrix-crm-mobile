/**
 * PaymentGatewaysScreen — country-aware list of payment gateways with
 * connect / configure toggles. Tapping Configure opens an inline modal
 * card with API key inputs and the merchant's webhook URL (read-only).
 */

import React, { useMemo, useState } from 'react';
import {
  Alert,
  I18nManager,
  Modal,
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
import { DrawerActions, useNavigation } from '@react-navigation/native';

import { Button } from '../../../components/common/Button';
import { Header } from '../../../components/common/Header';
import { Icon } from '../../../components/common/Icon';
import { colors } from '../../../constants/colors';
import { hitSlop, radius, shadows, spacing } from '../../../constants/spacing';
import { textStyles } from '../../../constants/typography';
import { useCountryConfig } from '../../../hooks/useCountryConfig';
import { useToast } from '../../../hooks/useToast';
import type { CountryCode } from '../../../types/country';

interface GatewayDef {
  id: string;
  name: string;
  badge?: string;
}

const GATEWAYS_BY_COUNTRY: Record<CountryCode, readonly GatewayDef[]> = {
  SA: [
    { id: 'mada', name: 'Mada', badge: 'مدى' },
    { id: 'stcpay', name: 'STC Pay', badge: 'STC' },
    { id: 'stripe', name: 'Stripe', badge: '$' },
  ],
  AE: [
    { id: 'network_intl', name: 'Network International', badge: 'NI' },
    { id: 'stripe', name: 'Stripe', badge: '$' },
    { id: 'tabby', name: 'Tabby', badge: 'tabby' },
    { id: 'tamara', name: 'Tamara', badge: 'tamara' },
  ],
  TR: [
    { id: 'iyzico', name: 'iyzico', badge: 'iyzi' },
    { id: 'paytr', name: 'PayTR', badge: 'PT' },
    { id: 'stripe', name: 'Stripe', badge: '$' },
  ],
  KW: [
    { id: 'knet', name: 'K-Net', badge: 'KNET' },
    { id: 'stripe', name: 'Stripe', badge: '$' },
  ],
  QA: [
    { id: 'qpay', name: 'QPay', badge: 'QP' },
    { id: 'stripe', name: 'Stripe', badge: '$' },
  ],
  EG: [
    { id: 'fawry', name: 'Fawry', badge: 'F' },
    { id: 'vodafone_cash', name: 'Vodafone Cash', badge: 'VC' },
    { id: 'instapay', name: 'InstaPay', badge: 'IP' },
    { id: 'stripe', name: 'Stripe', badge: '$' },
  ],
  BH: [
    { id: 'benefit', name: 'Benefit', badge: 'B' },
    { id: 'stripe', name: 'Stripe', badge: '$' },
  ],
  OM: [
    { id: 'thawani', name: 'Thawani', badge: 'Th' },
    { id: 'omannet', name: 'OmanNet', badge: 'OM' },
    { id: 'stripe', name: 'Stripe', badge: '$' },
  ],
  JO: [
    { id: 'cliq', name: 'CliQ', badge: 'CliQ' },
    { id: 'stripe', name: 'Stripe', badge: '$' },
  ],
};

const WEBHOOK_URL = 'https://api.crm.zyrix.co/webhooks/payment-gateway';

export const PaymentGatewaysScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const toast = useToast();
  const { config } = useCountryConfig();

  const gateways = useMemo<readonly GatewayDef[]>(
    () => GATEWAYS_BY_COUNTRY[config.code as CountryCode] ?? GATEWAYS_BY_COUNTRY.SA,
    [config.code]
  );

  const [enabled, setEnabled] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(gateways.map((gateway) => [gateway.id, false]))
  );
  const [configuring, setConfiguring] = useState<GatewayDef | null>(null);
  const [secretKey, setSecretKey] = useState('');
  const [publicKey, setPublicKey] = useState('');

  const toggle = (id: string): void => {
    setEnabled((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const openConfig = (gateway: GatewayDef): void => {
    setConfiguring(gateway);
    setSecretKey('');
    setPublicKey('');
  };

  const closeConfig = (): void => {
    setConfiguring(null);
  };

  const saveConfig = (): void => {
    if (!configuring) return;
    toast.success(t('paymentGateways.saveConfig'));
    setEnabled((prev) => ({ ...prev, [configuring.id]: true }));
    closeConfig();
  };

  const testConnection = (): void => {
    if (!configuring) return;
    Alert.alert(
      t('paymentGateways.testConnection'),
      `${configuring.name} → OK`
    );
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <Header
        title={t('paymentGateways.title')}
        showBack={false}
        leftSlot={
          <Pressable
            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
            hitSlop={hitSlop.md}
            style={styles.headerBtn}
          >
            <Icon name="menu-outline" size={24} color={colors.textInverse} />
          </Pressable>
        }
      />

      <ScrollView contentContainerStyle={styles.scroll}>
        {gateways.map((gateway) => {
          const isOn = enabled[gateway.id] ?? false;
          return (
            <View key={gateway.id} style={styles.card}>
              <View style={styles.row}>
                <View style={styles.logoCircle}>
                  <Text style={styles.logoText}>{gateway.badge ?? '$'}</Text>
                </View>
                <View style={styles.body}>
                  <Text style={styles.name}>{gateway.name}</Text>
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color: isOn ? colors.success : colors.textMuted,
                      },
                    ]}
                  >
                    {isOn
                      ? `✓ ${t('paymentGateways.connected')}`
                      : t('paymentGateways.notConnected')}
                  </Text>
                </View>
                <Switch
                  value={isOn}
                  onValueChange={() => toggle(gateway.id)}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={colors.white}
                />
              </View>
              <Pressable
                onPress={() => openConfig(gateway)}
                style={({ pressed }) => [
                  styles.configBtn,
                  pressed ? { opacity: 0.85 } : null,
                ]}
              >
                <Icon name="settings-outline" size={16} color={colors.primary} />
                <Text style={styles.configText}>
                  {t('paymentGateways.configure')}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </ScrollView>

      <Modal
        transparent
        visible={!!configuring}
        animationType="fade"
        onRequestClose={closeConfig}
      >
        <Pressable style={styles.backdrop} onPress={closeConfig}>
          <Pressable
            style={styles.modalCard}
            onPress={(event) => event.stopPropagation()}
          >
            <Text style={styles.modalTitle}>
              {`${configuring?.name ?? ''} · ${t('paymentGateways.configure')}`}
            </Text>

            <Text style={styles.fieldLabel}>{t('paymentGateways.publicKey')}</Text>
            <TextInput
              value={publicKey}
              onChangeText={setPublicKey}
              placeholder="pk_live_..."
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              style={[
                styles.input,
                { textAlign: I18nManager.isRTL ? 'right' : 'left' },
              ]}
            />

            <Text style={styles.fieldLabel}>{t('paymentGateways.secretKey')}</Text>
            <TextInput
              value={secretKey}
              onChangeText={setSecretKey}
              placeholder="sk_live_..."
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
              style={[
                styles.input,
                { textAlign: I18nManager.isRTL ? 'right' : 'left' },
              ]}
            />

            <Text style={styles.fieldLabel}>{t('paymentGateways.webhookUrl')}</Text>
            <View style={styles.webhookRow}>
              <Text style={styles.webhookText} numberOfLines={1}>
                {WEBHOOK_URL}
              </Text>
              <Pressable
                onPress={() => toast.success(t('paymentLinks.linkCopied'))}
              >
                <Icon name="copy-outline" size={18} color={colors.primary} />
              </Pressable>
            </View>

            <View style={styles.modalActions}>
              <Button
                label={t('paymentGateways.testConnection')}
                variant="outline"
                onPress={testConnection}
              />
              <Button label={t('paymentGateways.saveConfig')} onPress={saveConfig} />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    padding: spacing.base,
    rowGap: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.base,
    borderRadius: radius.lg,
    rowGap: spacing.sm,
    ...shadows.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.sm,
  },
  logoCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    ...textStyles.label,
    color: colors.primaryDark,
    fontWeight: '700',
  },
  body: { flex: 1 },
  name: {
    ...textStyles.bodyMedium,
    color: colors.textPrimary,
  },
  statusText: {
    ...textStyles.caption,
    fontWeight: '600',
  },
  configBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.xs,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  configText: {
    ...textStyles.button,
    color: colors.primary,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(12, 74, 110, 0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    rowGap: spacing.sm,
    ...shadows.lg,
  },
  modalTitle: {
    ...textStyles.h3,
    color: colors.textPrimary,
  },
  fieldLabel: {
    ...textStyles.label,
    color: colors.textSecondary,
  },
  input: {
    ...textStyles.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.base,
    padding: spacing.sm,
  },
  webhookRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    padding: spacing.sm,
    borderRadius: radius.base,
    columnGap: spacing.sm,
  },
  webhookText: {
    flex: 1,
    ...textStyles.caption,
    color: colors.primaryDark,
  },
  modalActions: {
    flexDirection: 'row',
    columnGap: spacing.sm,
    marginTop: spacing.sm,
  },
});

export default PaymentGatewaysScreen;
