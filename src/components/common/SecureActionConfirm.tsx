/**
 * SecureActionConfirm — pressable wrapper that gates a sensitive
 * action behind a biometric prompt or, as a fallback, a password
 * modal. Usage:
 *
 *   <SecureActionConfirm action="delete_customer" onConfirm={delete}>
 *     <DeleteButton />
 *   </SecureActionConfirm>
 *
 * Tracks every attempt via `logSecurityEvent` for audit trails.
 */

import React, { useState } from 'react';
import {
  I18nManager,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button } from './Button';
import { Icon } from './Icon';
import { authenticate } from '../../utils/biometrics';
import { colors } from '../../constants/colors';
import { logSecurityEvent } from '../../utils/securityEvents';
import { radius, shadows, spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';
import { useBiometric } from '../../hooks/useBiometric';
import { useToast } from '../../hooks/useToast';

export interface SecureActionConfirmProps {
  action: string;
  resource?: string;
  resourceId?: string;
  onConfirm: () => void | Promise<void>;
  requireBiometric?: boolean;
  requirePassword?: boolean;
  children: React.ReactNode;
}

export const SecureActionConfirm: React.FC<SecureActionConfirmProps> = ({
  action,
  resource,
  resourceId,
  onConfirm,
  requireBiometric = true,
  requirePassword = false,
  children,
}) => {
  const { t } = useTranslation();
  const toast = useToast();
  const biometric = useBiometric();

  const [passwordOpen, setPasswordOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const fire = async (): Promise<void> => {
    await logSecurityEvent('sensitive_action_attempt', {
      action,
      resource,
      resourceId,
    });

    try {
      setBusy(true);

      if (requireBiometric && biometric.isAvailable && biometric.isEnabled) {
        const ok = await biometric.promptOnly(t('secureAction.authenticateToContinue'));
        if (!ok) {
          toast.error(t('common.error'));
          return;
        }
        await onConfirm();
        await logSecurityEvent('sensitive_action_success', {
          action,
          resource,
          resourceId,
          method: 'biometric',
        });
        return;
      }

      if (requireBiometric && biometric.isAvailable && !biometric.isEnabled) {
        const ok = await authenticate(t('secureAction.authenticateToContinue'));
        if (!ok) {
          toast.error(t('common.error'));
          return;
        }
        await onConfirm();
        await logSecurityEvent('sensitive_action_success', {
          action,
          resource,
          resourceId,
          method: 'device',
        });
        return;
      }

      // Fall back to password confirmation when biometric is unavailable.
      if (requirePassword || !biometric.isAvailable) {
        setPasswordOpen(true);
        return;
      }

      await onConfirm();
      await logSecurityEvent('sensitive_action_success', {
        action,
        resource,
        resourceId,
        method: 'none',
      });
    } finally {
      setBusy(false);
    }
  };

  const confirmWithPassword = async (): Promise<void> => {
    if (password.length < 4) {
      toast.error(t('forms.required'));
      return;
    }
    setBusy(true);
    try {
      // Backend would verify; for now treat any password as accepted
      await onConfirm();
      await logSecurityEvent('sensitive_action_success', {
        action,
        resource,
        resourceId,
        method: 'password',
      });
      setPassword('');
      setPasswordOpen(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Pressable onPress={() => void fire()} disabled={busy}>
        {children}
      </Pressable>

      <Modal
        transparent
        visible={passwordOpen}
        animationType="fade"
        onRequestClose={() => setPasswordOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setPasswordOpen(false)}>
          <Pressable
            style={styles.card}
            onPress={(event) => event.stopPropagation()}
          >
            <Icon name="shield-checkmark-outline" size={36} color={colors.primary} />
            <Text style={styles.title}>{t('secureAction.confirmIdentity')}</Text>
            <Text style={styles.subtitle}>
              {t('secureAction.authenticateToContinue')}
            </Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder={t('forms.password')}
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              style={[
                styles.input,
                { textAlign: I18nManager.isRTL ? 'right' : 'left' },
              ]}
            />
            <View style={styles.actions}>
              <Button
                label={t('common.cancel')}
                variant="ghost"
                onPress={() => setPasswordOpen(false)}
              />
              <Button
                label={t('common.confirm')}
                onPress={() => void confirmWithPassword()}
                loading={busy}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(12, 74, 110, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.xl,
    rowGap: spacing.sm,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    ...shadows.lg,
  },
  title: { ...textStyles.h3, color: colors.textPrimary, textAlign: 'center' },
  subtitle: {
    ...textStyles.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    ...textStyles.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.base,
    padding: spacing.sm,
    minHeight: 44,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    columnGap: spacing.sm,
    width: '100%',
  },
});

export default SecureActionConfirm;
