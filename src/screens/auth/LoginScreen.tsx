/**
 * LoginScreen — email + password form with react-hook-form + zod.
 *
 * Sprint 3 keeps the Sprint 2 mock-login behaviour (so existing test
 * accounts continue to work) but removes the visible "test accounts"
 * hint card — that's demo-mode copy which the spec forbids — and turns
 * the "Create Free Account" link into a real navigation to
 * `RegisterScreen`.
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { z } from 'zod';

import { Button } from '../../components/common/Button';
import { Icon } from '../../components/common/Icon';
import { Input } from '../../components/common/Input';
import { LanguageSwitcher } from '../../components/common/LanguageSwitcher';
import { darkColors } from '../../theme/dark';
import { logSecurityEvent } from '../../utils/securityEvents';
import { radius, shadows, spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';
import { useAuthStore } from '../../store/authStore';
import { useBiometric } from '../../hooks/useBiometric';
import { useUiStore } from '../../store/uiStore';
import { useUserStore } from '../../store/userStore';
import { useToastStore } from '../../store/toastStore';
import {
  appleSignIn,
  googleSignIn,
  isAppleSignInSupported,
} from '../../services/socialAuth';
import {
  getPermissionsForRole,
  type AuthUser,
  type User,
  type UserRole,
} from '../../types/auth';
import type { AuthStackParamList } from '../../navigation/types';

type LoginFormValues = {
  email: string;
  password: string;
};

interface MockIdentity {
  email: string;
  password: string;
  role: UserRole;
  name: string;
  companyId: string | null;
}

const MOCK_USERS: readonly MockIdentity[] = [
  {
    email: 'admin@zyrix.co',
    password: 'password',
    role: 'super_admin',
    name: 'Admin User',
    companyId: null,
  },
  {
    email: 'owner@company.com',
    password: 'password',
    role: 'merchant_owner',
    name: 'Company Owner',
    companyId: 'comp_123',
  },
  {
    email: 'manager@company.com',
    password: 'password',
    role: 'merchant_manager',
    name: 'Sales Manager',
    companyId: 'comp_123',
  },
  {
    email: 'employee@company.com',
    password: 'password',
    role: 'merchant_employee',
    name: 'Employee',
    companyId: 'comp_123',
  },
  {
    email: 'customer@email.com',
    password: 'password',
    role: 'customer',
    name: 'Customer User',
    companyId: 'comp_123',
  },
];

/**
 * Spec §22: unknown emails default to merchant_owner so the app is
 * testable without hard-coded credentials. Name is synthesised from
 * the email local-part for a friendly greeting.
 */
const fallbackIdentityFor = (email: string): MockIdentity => {
  const local = email.split('@')[0] ?? 'Owner';
  const name =
    local
      .replace(/[._-]+/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim() || 'Test Owner';
  return {
    email,
    password: '',
    role: 'merchant_owner',
    name,
    companyId: 'comp_123',
  };
};

const buildSchema = (t: (k: string) => string) =>
  z.object({
    email: z.string().min(1, t('auth.required')).email(t('auth.invalidEmail')),
    password: z
      .string()
      .min(1, t('auth.required'))
      .min(6, t('auth.passwordTooShort')),
  });

const mockTokenFor = (email: string): string => {
  const slug = email.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  return `mock-${slug}-${Date.now()}`;
};

type Navigation = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export const LoginScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<Navigation>();
  const language = useUiStore((s) => s.language);
  const loginAuth = useAuthStore((s) => s.login);
  const setUser = useUserStore((s) => s.setUser);
  const setBiometricEnabled = useUserStore((s) => s.setBiometricEnabled);

  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const biometric = useBiometric();
  const [biometricBusy, setBiometricBusy] = useState(false);
  const [enrollPromptOpen, setEnrollPromptOpen] = useState(false);
  const [pendingEnroll, setPendingEnroll] = useState<{
    token: string;
    userId: string;
  } | null>(null);

  const schema = useMemo(() => buildSchema(t), [t]);

  const biometricLabel = useMemo(() => {
    switch (biometric.type) {
      case 'FaceID':
        return t('biometricEnroll.signInWithFaceID');
      case 'TouchID':
        return t('biometricEnroll.signInWithTouchID');
      case 'Fingerprint':
        return t('biometricEnroll.signInWithFingerprint');
      default:
        return t('security.biometricLogin');
    }
  }, [biometric.type, t]);

  const biometricIcon =
    biometric.type === 'FaceID'
      ? 'happy-outline'
      : 'finger-print-outline';

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
    mode: 'onBlur',
  });

  const onSubmit = async (values: LoginFormValues): Promise<void> => {
    setSubmitting(true);
    try {
      // Faux network latency so the loading indicator is visible.
      await new Promise((resolve) => setTimeout(resolve, 450));

      const normalizedEmail = values.email.trim().toLowerCase();
      const matched = MOCK_USERS.find(
        (mock) =>
          mock.email === normalizedEmail && mock.password === values.password
      );
      const identity = matched ?? fallbackIdentityFor(normalizedEmail);

      const userId = `mock-${identity.role}-${normalizedEmail}`;
      const fullUser: User = {
        id: userId,
        email: identity.email,
        name: identity.name,
        role: identity.role,
        companyId: identity.companyId,
        avatar: null,
        phone: null,
        country: null,
        language,
        permissions: getPermissionsForRole(identity.role),
      };

      const authUser: AuthUser = {
        id: userId,
        email: identity.email,
        name: identity.name,
        role: identity.role,
        avatarUrl: null,
        locale: language,
      };

      const issuedToken = mockTokenFor(identity.email);

      // First-time biometric enrolment: if the device supports biometrics
      // but the user hasn't opted in yet, defer auth-store login until
      // after they've answered the prompt — this lets us either save the
      // token to SecureStore (with biometric requirement) or skip cleanly.
      if (
        biometric.isAvailable &&
        !biometric.isEnabled &&
        !biometric.isLoading
      ) {
        setPendingEnroll({ token: issuedToken, userId });
        await setUser(fullUser);
        // Stash the auth credentials in a closure that the modal handlers
        // can resolve after the user picks an answer.
        pendingAuthRef.current = { authUser, token: issuedToken };
        setEnrollPromptOpen(true);
        return;
      }

      await setUser(fullUser);
      await loginAuth({ user: authUser, token: issuedToken });
    } finally {
      setSubmitting(false);
    }
  };

  // Holds the credentials surfaced to the enrolment prompt so we can
  // finalise login regardless of which button the user taps.
  const pendingAuthRef = React.useRef<{
    authUser: AuthUser;
    token: string;
  } | null>(null);

  const finishLoginAfterEnroll = async (): Promise<void> => {
    const pending = pendingAuthRef.current;
    pendingAuthRef.current = null;
    setEnrollPromptOpen(false);
    setPendingEnroll(null);
    if (!pending) return;
    await loginAuth({ user: pending.authUser, token: pending.token });
  };

  const onEnableBiometric = async (): Promise<void> => {
    if (pendingEnroll) {
      const ok = await biometric.enable(pendingEnroll.token, pendingEnroll.userId);
      if (ok) {
        await setBiometricEnabled(true);
      }
    }
    await finishLoginAfterEnroll();
  };

  const onSkipBiometric = async (): Promise<void> => {
    await finishLoginAfterEnroll();
  };

  const onCameraSignIn = (): void => {
    Alert.alert(
      t('biometricEnroll.cameraSignIn'),
      t('biometricEnroll.cameraComingSoon')
    );
  };

  const onForgotPassword = (): void => {
    navigation.navigate('ForgotPassword');
  };

  const onRegister = (): void => {
    navigation.navigate('Register');
  };

  const pushToast = useToastStore((s) => s.show);

  const onGoogleSignIn = async (): Promise<void> => {
    const result = await googleSignIn();
    if (!result.ok) {
      pushToast({
        variant: 'info',
        title: t('auth.continueWithGoogle'),
        description: result.message ?? t('auth.socialNotReady'),
      });
    }
  };

  const onAppleSignIn = async (): Promise<void> => {
    const result = await appleSignIn();
    if (!result.ok) {
      pushToast({
        variant: 'info',
        title: t('auth.continueWithApple'),
        description: result.message ?? t('auth.socialNotReady'),
      });
    }
  };

  const tryBiometric = async (): Promise<void> => {
    setBiometricBusy(true);
    try {
      const result = await biometric.login();
      if (!result) return;
      await logSecurityEvent('login_success', {
        method: 'biometric',
      });
      const fallback = fallbackIdentityFor('owner@company.com');
      const userId = result.userId;
      const fullUser: User = {
        id: userId,
        email: fallback.email,
        name: fallback.name,
        role: fallback.role,
        companyId: fallback.companyId,
        avatar: null,
        phone: null,
        country: null,
        language,
        permissions: getPermissionsForRole(fallback.role),
      };
      const authUser: AuthUser = {
        id: userId,
        email: fallback.email,
        name: fallback.name,
        role: fallback.role,
        avatarUrl: null,
        locale: language,
      };
      await setUser(fullUser);
      await loginAuth({ user: authUser, token: result.token });
    } finally {
      setBiometricBusy(false);
    }
  };

  useEffect(() => {
    if (biometric.isAvailable && biometric.isEnabled && !biometric.isLoading) {
      void tryBiometric();
    }
    // Only run after the availability check resolves.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [biometric.isAvailable, biometric.isEnabled, biometric.isLoading]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <View style={styles.logoBadge}>
                <Text style={styles.logoMark}>Z</Text>
              </View>
              <Text style={styles.appName}>{t('common.appName')}</Text>
              <Text style={styles.title}>{t('auth.welcome')}</Text>
              <Text style={styles.subtitle}>{t('auth.loginSubtitle')}</Text>
            </View>

            <View style={styles.card}>
              {biometric.isAvailable && biometric.isEnabled ? (
                <View style={styles.primaryBiometricBlock}>
                  <Pressable
                    onPress={() => void tryBiometric()}
                    disabled={biometricBusy}
                    accessibilityRole="button"
                    accessibilityLabel={biometricLabel}
                    style={({ pressed }) => [
                      styles.biometricPrimary,
                      pressed ? { opacity: 0.92 } : null,
                    ]}
                  >
                    <View style={styles.biometricIconCircle}>
                      <Icon
                        name={biometricIcon}
                        size={28}
                        color={darkColors.textOnPrimary}
                      />
                    </View>
                    <Text style={styles.biometricPrimaryLabel}>
                      {biometricLabel}
                    </Text>
                  </Pressable>
                  <View style={styles.dividerRow}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>{t('common.or')}</Text>
                    <View style={styles.dividerLine} />
                  </View>
                </View>
              ) : null}

              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label={t('auth.email')}
                    placeholder={t('auth.emailPlaceholder')}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="email"
                    textContentType="emailAddress"
                    error={errors.email?.message}
                    required
                  />
                )}
              />

              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label={t('auth.password')}
                    placeholder={t('auth.passwordPlaceholder')}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="password"
                    textContentType="password"
                    error={errors.password?.message}
                    required
                    rightIcon={
                      <Text style={styles.toggleText}>
                        {showPassword ? '🙈' : '👁️'}
                      </Text>
                    }
                    onRightIconPress={() => setShowPassword((prev) => !prev)}
                  />
                )}
              />

              <Pressable
                onPress={onForgotPassword}
                hitSlop={8}
                style={styles.forgotLink}
              >
                <Text style={styles.linkText}>{t('auth.forgotPassword')}</Text>
              </Pressable>

              <Button
                label={t('auth.loginButton')}
                fullWidth
                loading={submitting}
                onPress={handleSubmit(onSubmit)}
                style={styles.submitButton}
              />

              <View style={styles.socialDivider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>{t('common.or')}</Text>
                <View style={styles.dividerLine} />
              </View>

              <Pressable
                onPress={() => void onGoogleSignIn()}
                accessibilityRole="button"
                accessibilityLabel={t('auth.continueWithGoogle')}
                style={({ pressed }) => [
                  styles.socialBtn,
                  pressed ? { opacity: 0.85 } : null,
                ]}
              >
                <Text style={styles.googleMark}>G</Text>
                <Text style={styles.socialLabel}>
                  {t('auth.continueWithGoogle')}
                </Text>
              </Pressable>

              {isAppleSignInSupported() ? (
                <Pressable
                  onPress={() => void onAppleSignIn()}
                  accessibilityRole="button"
                  accessibilityLabel={t('auth.continueWithApple')}
                  style={({ pressed }) => [
                    styles.socialBtn,
                    styles.appleBtn,
                    pressed ? { opacity: 0.85 } : null,
                  ]}
                >
                  <Text style={styles.appleMark}></Text>
                  <Text style={[styles.socialLabel, styles.appleLabel]}>
                    {t('auth.continueWithApple')}
                  </Text>
                </Pressable>
              ) : null}

              <Pressable
                onPress={onCameraSignIn}
                accessibilityRole="button"
                accessibilityLabel={t('biometricEnroll.cameraSignIn')}
                style={({ pressed }) => [
                  styles.cameraBtn,
                  pressed ? { opacity: 0.85 } : null,
                ]}
              >
                <Icon
                  name="camera-outline"
                  size={20}
                  color={darkColors.lavender}
                />
                <Text style={styles.cameraLabel}>
                  {t('biometricEnroll.cameraSignIn')}
                </Text>
              </Pressable>

              <View style={styles.registerCtaBlock}>
                <Text style={styles.registerText}>{t('auth.noAccount')}</Text>
                <Pressable onPress={onRegister} hitSlop={8}>
                  <Text style={styles.registerCta}>
                    {t('auth.registerCta')}
                  </Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.footer}>
              <LanguageSwitcher />
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      <Modal
        transparent
        visible={enrollPromptOpen}
        animationType="fade"
        onRequestClose={() => void onSkipBiometric()}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconCircle}>
              <Icon name={biometricIcon} size={32} color={darkColors.primary} />
            </View>
            <Text style={styles.modalTitle}>{t('biometricEnroll.title')}</Text>
            <Text style={styles.modalBody}>{t('biometricEnroll.body')}</Text>
            <View style={styles.modalActions}>
              <Pressable
                onPress={() => void onSkipBiometric()}
                style={({ pressed }) => [
                  styles.modalSecondary,
                  pressed ? { opacity: 0.85 } : null,
                ]}
              >
                <Text style={styles.modalSecondaryLabel}>
                  {t('biometricEnroll.later')}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => void onEnableBiometric()}
                style={({ pressed }) => [
                  styles.modalPrimary,
                  pressed ? { opacity: 0.92 } : null,
                ]}
              >
                <Text style={styles.modalPrimaryLabel}>
                  {t('biometricEnroll.enable')}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: darkColors.background,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    padding: spacing.xl,
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: radius.xl,
    backgroundColor: darkColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.base,
    ...shadows.md,
  },
  logoMark: {
    fontSize: 40,
    fontWeight: '800',
    color: darkColors.textOnPrimary,
  },
  appName: {
    ...textStyles.overline,
    color: darkColors.primary,
  },
  title: {
    ...textStyles.h1,
    color: darkColors.textPrimary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    ...textStyles.body,
    color: darkColors.textMuted,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  card: {
    backgroundColor: darkColors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    ...shadows.md,
  },
  toggleText: {
    fontSize: 18,
  },
  forgotLink: {
    alignSelf: 'flex-end',
    marginTop: -spacing.sm,
    marginBottom: spacing.base,
  },
  linkText: {
    ...textStyles.label,
    color: darkColors.textLink,
  },
  submitButton: {
    alignSelf: 'stretch',
    marginTop: spacing.md,
  },
  primaryBiometricBlock: {
    rowGap: spacing.md,
    marginBottom: spacing.md,
  },
  biometricPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: darkColors.primary,
    ...shadows.md,
  },
  biometricIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: darkColors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  biometricPrimaryLabel: {
    ...textStyles.button,
    color: darkColors.textOnPrimary,
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: darkColors.border,
  },
  dividerText: {
    ...textStyles.caption,
    color: darkColors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cameraBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: darkColors.lavenderSoft,
    backgroundColor: darkColors.surface,
    marginTop: spacing.sm,
  },
  cameraLabel: {
    ...textStyles.label,
    color: darkColors.lavender,
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: darkColors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    rowGap: spacing.sm,
    ...shadows.lg,
  },
  modalIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: darkColors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  modalTitle: {
    ...textStyles.h3,
    color: darkColors.textHeading,
    textAlign: 'center',
  },
  modalBody: {
    ...textStyles.body,
    color: darkColors.textMuted,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    columnGap: spacing.sm,
    marginTop: spacing.lg,
    width: '100%',
  },
  modalSecondary: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: darkColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSecondaryLabel: {
    ...textStyles.button,
    color: darkColors.textSecondary,
    fontWeight: '600',
  },
  modalPrimary: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: darkColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalPrimaryLabel: {
    ...textStyles.button,
    color: darkColors.textOnPrimary,
    fontWeight: '700',
  },
  registerCtaBlock: {
    alignItems: 'center',
    marginTop: spacing.xl,
    rowGap: spacing.xs,
  },
  registerText: {
    ...textStyles.body,
    color: darkColors.textMuted,
  },
  registerCta: {
    ...textStyles.h4,
    color: darkColors.primary,
    fontWeight: '700',
  },
  socialDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: darkColors.border,
    backgroundColor: darkColors.surface,
    marginTop: spacing.sm,
  },
  googleMark: {
    fontSize: 20,
    fontWeight: '800',
    color: '#4285F4',
  },
  socialLabel: {
    ...textStyles.button,
    color: darkColors.textPrimary,
    fontWeight: '600',
  },
  appleBtn: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  appleMark: {
    fontSize: 18,
    color: darkColors.textOnPrimary,
    fontWeight: '700',
  },
  appleLabel: {
    color: darkColors.textOnPrimary,
  },
  footer: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
});

export default LoginScreen;
