/**
 * RegisterScreen — create-account form with react-hook-form + zod.
 *
 * Sprint 3 is still pre-backend: on submit we synthesise a
 * `merchant_owner` user locally, stash it in the user/auth stores with
 * a mock token, and hand off to `OnboardingScreen`. The real API call
 * lands in Sprint 4.
 */

import React, { useMemo, useState } from 'react';
import {
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
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { z } from 'zod';

import { Button } from '../../components/common/Button';
import { Icon } from '../../components/common/Icon';
import { Input } from '../../components/common/Input';
import { PhoneInput } from '../../components/common/PhoneInput';
import { colors } from '../../constants/colors';
import { radius, shadows, spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { useUiStore } from '../../store/uiStore';
import { useUserStore } from '../../store/userStore';
import {
  appleSignIn,
  googleSignIn,
  isAppleSignInSupported,
} from '../../services/socialAuth';
import {
  getPermissionsForRole,
  type AuthUser,
  type User,
} from '../../types/auth';
import type { AuthStackParamList } from '../../navigation/types';

const buildSchema = (t: (k: string, opts?: Record<string, unknown>) => string) =>
  z
    .object({
      fullName: z.string().min(2, t('forms.required')),
      email: z.string().min(1, t('forms.required')).email(t('forms.invalidEmail')),
      password: z
        .string()
        .min(8, t('forms.passwordTooShort'))
        .regex(/[A-Za-z]/, t('forms.passwordWeak'))
        .regex(/[0-9]/, t('forms.passwordWeak')),
      confirmPassword: z.string().min(1, t('forms.required')),
      phone: z.string(),
      agreeTerms: z
        .boolean()
        .refine((v) => v === true, { message: t('forms.mustAgreeTerms') }),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t('forms.passwordsNoMatch'),
      path: ['confirmPassword'],
    });

type RegisterFormValues = z.infer<ReturnType<typeof buildSchema>>;

const mockTokenFor = (email: string): string => {
  const slug = email.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  return `mock-${slug}-${Date.now()}`;
};

type Navigation = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

export const RegisterScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<Navigation>();
  const language = useUiStore((s) => s.language);
  const loginAuth = useAuthStore((s) => s.login);
  const setUser = useUserStore((s) => s.setUser);

  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const schema = useMemo(() => buildSchema(t), [t]);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
      agreeTerms: false,
    },
    mode: 'onBlur',
  });

  const agreeTerms = watch('agreeTerms');

  const onSubmit = async (values: RegisterFormValues): Promise<void> => {
    setSubmitting(true);
    try {
      // Simulate network so the loading indicator is visible.
      await new Promise((resolve) => setTimeout(resolve, 450));

      const email = values.email.trim().toLowerCase();
      const userId = `mock-merchant_owner-${email}`;
      const fullUser: User = {
        id: userId,
        email,
        name: values.fullName.trim(),
        role: 'merchant_owner',
        companyId: 'comp_new',
        avatar: null,
        phone: values.phone || null,
        country: null,
        language,
        permissions: getPermissionsForRole('merchant_owner'),
      };

      const authUser: AuthUser = {
        id: userId,
        email,
        name: fullUser.name,
        role: 'merchant_owner',
        avatarUrl: null,
        locale: language,
      };

      await setUser(fullUser);
      await loginAuth({ user: authUser, token: mockTokenFor(email) });

      navigation.navigate('Onboarding');
    } finally {
      setSubmitting(false);
    }
  };

  const goToLogin = (): void => {
    navigation.navigate('Login');
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
              <Text style={styles.title}>{t('forms.createAccount')}</Text>
              <Text style={styles.subtitle}>
                {t('onboarding.welcomeSubtitle')}
              </Text>
            </View>

            <View style={styles.card}>
              <Controller
                control={control}
                name="fullName"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label={t('forms.fullName')}
                    placeholder={t('forms.fullNamePlaceholder')}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    autoCapitalize="words"
                    error={errors.fullName?.message}
                    required
                  />
                )}
              />

              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label={t('forms.email')}
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
                    label={t('forms.password')}
                    placeholder={t('auth.passwordPlaceholder')}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="password-new"
                    textContentType="newPassword"
                    error={errors.password?.message}
                    required
                    rightIcon={
                      <Text style={styles.toggleText}>
                        {showPassword ? '🙈' : '👁️'}
                      </Text>
                    }
                    onRightIconPress={() => setShowPassword((p) => !p)}
                  />
                )}
              />

              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label={t('forms.confirmPassword')}
                    placeholder={t('auth.passwordPlaceholder')}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    error={errors.confirmPassword?.message}
                    required
                  />
                )}
              />

              <Controller
                control={control}
                name="phone"
                render={({ field: { onChange, onBlur, value } }) => (
                  <PhoneInput
                    label={t('forms.phone')}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.phone?.message}
                  />
                )}
              />

              <Pressable
                style={styles.termsRow}
                onPress={() => setValue('agreeTerms', !agreeTerms, { shouldValidate: true })}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: agreeTerms }}
              >
                <View
                  style={[
                    styles.checkbox,
                    agreeTerms ? styles.checkboxChecked : null,
                  ]}
                >
                  {agreeTerms ? (
                    <Icon name="checkmark" size={14} color={colors.textInverse} />
                  ) : null}
                </View>
                <Text style={styles.termsText}>{t('forms.agreeTerms')}</Text>
              </Pressable>
              {errors.agreeTerms ? (
                <Text style={styles.termsError}>
                  {errors.agreeTerms.message}
                </Text>
              ) : null}

              <Button
                label={t('forms.createAccount')}
                fullWidth
                loading={submitting}
                onPress={handleSubmit(onSubmit)}
                style={styles.submit}
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

              <View style={styles.loginRow}>
                <Text style={styles.loginText}>
                  {t('forms.alreadyHaveAccount')}
                </Text>
                <Pressable onPress={goToLogin} hitSlop={8}>
                  <Text style={styles.loginLink}>{t('forms.signIn')}</Text>
                </Pressable>
              </View>
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
  flex: { flex: 1 },
  scroll: {
    padding: spacing.xl,
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: radius.xl,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.base,
    ...shadows.md,
  },
  logoMark: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.white,
  },
  title: {
    ...textStyles.h2,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    ...textStyles.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    ...shadows.md,
  },
  toggleText: { fontSize: 18 },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.sm,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  checkboxChecked: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  termsText: {
    ...textStyles.caption,
    color: colors.textSecondary,
    flex: 1,
  },
  termsError: {
    ...textStyles.caption,
    color: colors.error,
    marginBottom: spacing.sm,
  },
  submit: {
    alignSelf: 'stretch',
    marginTop: spacing.sm,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    columnGap: spacing.xs,
    marginTop: spacing.lg,
  },
  loginText: {
    ...textStyles.body,
    color: colors.textMuted,
  },
  loginLink: {
    ...textStyles.label,
    color: colors.primary,
    fontWeight: '700',
    marginStart: spacing.xs,
  },
  socialDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  dividerText: {
    ...textStyles.caption,
    color: colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    marginTop: spacing.sm,
  },
  googleMark: {
    fontSize: 20,
    fontWeight: '800',
    color: '#4285F4',
  },
  socialLabel: {
    ...textStyles.button,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  appleBtn: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  appleMark: {
    fontSize: 18,
    color: colors.white,
    fontWeight: '700',
  },
  appleLabel: {
    color: colors.white,
  },
});

export default RegisterScreen;
