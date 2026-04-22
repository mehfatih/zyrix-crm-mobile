/**
 * LoginScreen — email + password form with react-hook-form + zod.
 *
 * For Sprint 2 the backend isn't wired up yet, so the form accepts a
 * small set of mock credentials that map to different roles. A
 * successful login writes to both `authStore` (token/session) and
 * `userStore` (profile + permissions); the RootNavigator then picks
 * the correct post-login navigator based on that role.
 */

import React, { useMemo, useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
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
import { z } from 'zod';

import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { LanguageSwitcher } from '../../components/common/LanguageSwitcher';
import { colors } from '../../constants/colors';
import { radius, shadows, spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';
import { useAuthStore } from '../../store/authStore';
import { useUiStore } from '../../store/uiStore';
import { useUserStore } from '../../store/userStore';
import {
  getPermissionsForRole,
  type AuthUser,
  type User,
  type UserRole,
} from '../../types/auth';

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
  const name = local
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
    email: z
      .string()
      .min(1, t('auth.required'))
      .email(t('auth.invalidEmail')),
    password: z
      .string()
      .min(1, t('auth.required'))
      .min(6, t('auth.passwordTooShort')),
  });

const mockTokenFor = (email: string): string => {
  const slug = email.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  return `mock-${slug}-${Date.now()}`;
};

export const LoginScreen: React.FC = () => {
  const { t } = useTranslation();
  const language = useUiStore((s) => s.language);
  const loginAuth = useAuthStore((s) => s.login);
  const setUser = useUserStore((s) => s.setUser);

  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const schema = useMemo(() => buildSchema(t), [t]);

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
      // Known mock → use it. Unknown email → spec §22 fallback: merchant_owner.
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

      await setUser(fullUser);
      await loginAuth({ user: authUser, token: mockTokenFor(identity.email) });
    } finally {
      setSubmitting(false);
    }
  };

  const onForgotPassword = (): void => {
    Alert.alert(t('auth.forgotPassword'));
  };

  const onRegister = (): void => {
    Alert.alert(t('auth.register'));
  };

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

              <View style={styles.registerRow}>
                <Text style={styles.registerText}>{t('auth.noAccount')}</Text>
                <Pressable onPress={onRegister} hitSlop={6}>
                  <Text style={[styles.linkText, styles.registerCta]}>
                    {t('auth.registerCta')}
                  </Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.hintCard}>
              <Text style={styles.hintTitle}>{t('auth.testAccountsTitle')}</Text>
              {MOCK_USERS.map((user) => (
                <Text key={user.email} style={styles.hintLine}>
                  • {user.email} / {user.password}
                </Text>
              ))}
            </View>

            <View style={styles.footer}>
              <LanguageSwitcher />
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
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
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.base,
    ...shadows.md,
  },
  logoMark: {
    fontSize: 40,
    fontWeight: '800',
    color: colors.white,
  },
  appName: {
    ...textStyles.overline,
    color: colors.primary,
  },
  title: {
    ...textStyles.h1,
    color: colors.textPrimary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    ...textStyles.body,
    color: colors.textMuted,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.surface,
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
    color: colors.textLink,
  },
  submitButton: {
    alignSelf: 'stretch',
    marginTop: spacing.md,
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
    columnGap: spacing.xs,
  },
  registerText: {
    ...textStyles.body,
    color: colors.textMuted,
  },
  registerCta: {
    marginStart: spacing.xs,
    color: colors.primary,
  },
  hintCard: {
    marginTop: spacing.lg,
    padding: spacing.base,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  hintTitle: {
    ...textStyles.label,
    color: colors.primaryDark,
    marginBottom: spacing.xs,
  },
  hintLine: {
    ...textStyles.caption,
    color: colors.textSecondary,
  },
  footer: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
});

export default LoginScreen;
