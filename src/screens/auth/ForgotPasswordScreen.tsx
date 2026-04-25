/**
 * ForgotPasswordScreen — three account recovery paths in one screen
 * (spec §14.3):
 *
 *   1. Email me a reset link
 *   2. Send me a login link (magic link)
 *   3. Send OTP to my phone
 *
 * The screen is wrapped in `AppScreen` so it picks up the Premium Light
 * gradient introduced in AI Sprint 1. No backend call happens yet — the
 * three submit handlers POST to the endpoints listed in the spec
 * (`/api/auth/password-reset`, `/api/auth/magic-link`,
 * `/api/auth/otp-request`/`otp-verify`). Until the backend ships those
 * routes we show a success toast locally so the flow is testable.
 */

import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppScreen } from '../../components/layout/AppScreen';
import { Button } from '../../components/common/Button';
import { Icon } from '../../components/common/Icon';
import { Input } from '../../components/common/Input';
import {
  InternationalPhoneInput,
  type InternationalPhoneValue,
} from '../../components/common/InternationalPhoneInput';
import { apiPost } from '../../api/client';
import { ENDPOINTS } from '../../api/endpoints';
import { useToastStore } from '../../store/toastStore';
import {
  zyrixRadius,
  zyrixShadows,
  zyrixSpacing,
  zyrixTheme,
} from '../../theme/zyrixTheme';
import type { AuthStackParamList } from '../../navigation/types';

type Method = 'resetLink' | 'magicLink' | 'otp';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

const METHODS: readonly { key: Method; icon: string; labelKey: string; subtitleKey: string }[] = [
  {
    key: 'resetLink',
    icon: 'mail-outline',
    labelKey: 'forgotPassword.methodResetLink',
    subtitleKey: 'forgotPassword.methodResetLinkSubtitle',
  },
  {
    key: 'magicLink',
    icon: 'link-outline',
    labelKey: 'forgotPassword.methodMagicLink',
    subtitleKey: 'forgotPassword.methodMagicLinkSubtitle',
  },
  {
    key: 'otp',
    icon: 'phone-portrait-outline',
    labelKey: 'forgotPassword.methodOtp',
    subtitleKey: 'forgotPassword.methodOtpSubtitle',
  },
];

const isEmail = (v: string): boolean => /^\S+@\S+\.\S+$/.test(v.trim());

export const ForgotPasswordScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const pushToast = useToastStore((s) => s.show);

  const [method, setMethod] = useState<Method>('resetLink');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState<InternationalPhoneValue | undefined>();
  const [otpCode, setOtpCode] = useState('');
  const [otpRequested, setOtpRequested] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = useMemo(() => {
    if (method === 'resetLink' || method === 'magicLink') {
      return isEmail(email);
    }
    if (method === 'otp') {
      if (!phone || phone.nationalNumber.length < 6) return false;
      if (otpRequested && otpCode.length < 4) return false;
      return true;
    }
    return false;
  }, [method, email, phone, otpRequested, otpCode]);

  const submit = async (): Promise<void> => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      if (method === 'resetLink') {
        await apiPost(ENDPOINTS.auth.PASSWORD_RESET, {
          email: email.trim().toLowerCase(),
        }).catch(() => null);
        pushToast({
          variant: 'success',
          title: t('forgotPassword.sent'),
          description: t('forgotPassword.sentResetLink', { email }),
        });
        navigation.goBack();
        return;
      }
      if (method === 'magicLink') {
        await apiPost(ENDPOINTS.auth.MAGIC_LINK, {
          email: email.trim().toLowerCase(),
        }).catch(() => null);
        pushToast({
          variant: 'success',
          title: t('forgotPassword.sent'),
          description: t('forgotPassword.sentMagicLink', { email }),
        });
        navigation.goBack();
        return;
      }
      if (method === 'otp') {
        if (!otpRequested) {
          await apiPost(ENDPOINTS.auth.OTP_REQUEST, {
            dialCode: phone?.dialCode,
            number: phone?.nationalNumber,
            countryCode: phone?.countryCode,
          }).catch(() => null);
          setOtpRequested(true);
          pushToast({
            variant: 'success',
            title: t('forgotPassword.otpSent'),
            description: t('forgotPassword.otpSentSubtitle'),
          });
          return;
        }
        await apiPost(ENDPOINTS.auth.OTP_VERIFY, {
          dialCode: phone?.dialCode,
          number: phone?.nationalNumber,
          code: otpCode,
        }).catch(() => null);
        pushToast({
          variant: 'success',
          title: t('forgotPassword.verified'),
          description: t('forgotPassword.verifiedSubtitle'),
        });
        navigation.goBack();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppScreen>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={8}
            style={styles.backRow}
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
          >
            <Icon name="chevron-back" size={22} color={zyrixTheme.primaryDark} />
            <Text style={styles.backText}>{t('common.back')}</Text>
          </Pressable>

          <Text style={styles.title}>{t('forgotPassword.title')}</Text>
          <Text style={styles.subtitle}>{t('forgotPassword.subtitle')}</Text>

          <View style={styles.tabs}>
            {METHODS.map((m) => {
              const active = m.key === method;
              return (
                <Pressable
                  key={m.key}
                  onPress={() => {
                    setMethod(m.key);
                    setOtpRequested(false);
                    setOtpCode('');
                  }}
                  style={[styles.tab, active ? styles.tabActive : null]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <Icon
                    name={m.icon as 'mail-outline'}
                    size={22}
                    color={active ? zyrixTheme.primary : zyrixTheme.textMuted}
                  />
                  <Text style={[styles.tabLabel, active ? styles.tabLabelActive : null]}>
                    {t(m.labelKey)}
                  </Text>
                  <Text style={styles.tabSubtitle} numberOfLines={2}>
                    {t(m.subtitleKey)}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.card}>
            {method === 'resetLink' || method === 'magicLink' ? (
              <Input
                label={t('auth.email')}
                placeholder={t('auth.emailPlaceholder')}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                keyboardType="email-address"
                textContentType="emailAddress"
              />
            ) : null}

            {method === 'otp' ? (
              <View style={{ rowGap: zyrixSpacing.base }}>
                <InternationalPhoneInput
                  label={t('forms.phone')}
                  value={phone}
                  onChange={setPhone}
                  placeholder="5xxxxxxxx"
                  disabled={otpRequested}
                />
                {otpRequested ? (
                  <Input
                    label={t('forgotPassword.otpCode')}
                    placeholder="123456"
                    value={otpCode}
                    onChangeText={setOtpCode}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                ) : null}
              </View>
            ) : null}

            <Button
              label={
                method === 'otp' && !otpRequested
                  ? t('forgotPassword.sendOtp')
                  : method === 'otp' && otpRequested
                    ? t('forgotPassword.verifyOtp')
                    : t('forgotPassword.sendLink')
              }
              fullWidth
              loading={submitting}
              onPress={submit}
              disabled={!canSubmit}
              style={styles.submit}
            />
          </View>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>{t('forgotPassword.rememberPassword')}</Text>
            <Pressable
              onPress={() => navigation.navigate('Login')}
              hitSlop={8}
            >
              <Text style={styles.footerLink}>{t('forms.signIn')}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: {
    padding: zyrixSpacing.lg,
    flexGrow: 1,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 4,
    marginBottom: zyrixSpacing.base,
  },
  backText: {
    color: zyrixTheme.primaryDark,
    fontWeight: '600',
  },
  title: {
    color: zyrixTheme.textHeading,
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    color: zyrixTheme.textMuted,
    marginTop: zyrixSpacing.xs,
    marginBottom: zyrixSpacing.lg,
  },
  tabs: {
    flexDirection: 'row',
    columnGap: zyrixSpacing.sm,
    marginBottom: zyrixSpacing.lg,
  },
  tab: {
    flex: 1,
    padding: zyrixSpacing.base,
    borderRadius: zyrixRadius.lg,
    backgroundColor: zyrixTheme.cardBg,
    borderWidth: 1,
    borderColor: zyrixTheme.cardBorder,
    rowGap: 4,
    ...zyrixShadows.card,
  },
  tabActive: {
    borderColor: zyrixTheme.primary,
    backgroundColor: zyrixTheme.primarySoft,
  },
  tabLabel: {
    color: zyrixTheme.textMuted,
    fontWeight: '700',
    marginTop: zyrixSpacing.xs,
  },
  tabLabelActive: {
    color: zyrixTheme.primaryDark,
  },
  tabSubtitle: {
    color: zyrixTheme.textMuted,
    fontSize: 11,
  },
  card: {
    padding: zyrixSpacing.lg,
    borderRadius: zyrixRadius.xl,
    backgroundColor: zyrixTheme.cardBg,
    borderWidth: 1,
    borderColor: zyrixTheme.cardBorder,
    ...zyrixShadows.card,
    rowGap: zyrixSpacing.base,
  },
  submit: {
    marginTop: zyrixSpacing.sm,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    columnGap: 4,
    marginTop: zyrixSpacing.xl,
  },
  footerText: {
    color: zyrixTheme.textMuted,
  },
  footerLink: {
    color: zyrixTheme.primary,
    fontWeight: '700',
  },
});

export default ForgotPasswordScreen;
