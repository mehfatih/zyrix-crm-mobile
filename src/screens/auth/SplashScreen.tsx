/**
 * SplashScreen — post-bootstrap welcome screen.
 *
 * Sprint 1 (app) redesign: full-screen celebration gradient (coral →
 * peach), animated Zyrix logo, a tagline that cycles through the three
 * supported languages every 4s, and two pill-shaped CTAs:
 *
 *   1. "Create for free"  → Register
 *   2. "Sign in"          → Login
 *
 * The language switcher lives in the top-right corner (text-only, no
 * flags). Rendering this screen does NOT mutate country or currency —
 * switching language from here is purely a UI concern.
 *
 * The previous cyan-only bootstrap spinner moved to `LoadingScreen` and
 * is used by RootNavigator while stores hydrate.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Constants from 'expo-constants';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { LanguageSwitcher } from '../../components/common/LanguageSwitcher';
import { colors, gradients } from '../../constants/colors';
import { radius, shadows, spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';
import { useUiStore } from '../../store/uiStore';
import type { AuthStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Splash'>;

interface Tagline {
  lang: 'ar' | 'en' | 'tr';
  text: string;
}

const TAGLINES: readonly Tagline[] = [
  { lang: 'ar', text: 'إدارة علاقات العملاء — صُنع لك' },
  { lang: 'en', text: 'Customer Relationships, Built for You' },
  { lang: 'tr', text: 'Müşteri İlişkileri, Sizin İçin Tasarlandı' },
];

const TAGLINE_INTERVAL_MS = 4000;

interface PillButtonProps {
  label: string;
  onPress: (event: GestureResponderEvent) => void;
  variant: 'primary' | 'secondary';
  testID?: string;
}

const PillButton: React.FC<PillButtonProps> = ({
  label,
  onPress,
  variant,
  testID,
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (value: number): void => {
    Animated.timing(scale, {
      toValue: value,
      duration: 120,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  };

  const primary = variant === 'primary';

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={label}
        onPressIn={() => animateTo(0.97)}
        onPressOut={() => animateTo(1)}
        onPress={onPress}
        style={styles.pillPressable}
      >
        {primary ? (
          <LinearGradient
            colors={[...gradients.hero]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.pillPrimary}
          >
            <Text style={styles.pillPrimaryLabel}>{label}</Text>
          </LinearGradient>
        ) : (
          <View style={styles.pillSecondary}>
            <Text style={styles.pillSecondaryLabel}>{label}</Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
};

export const SplashScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const language = useUiStore((s) => s.language);
  const markLanguageSelected = useUiStore((s) => s.markLanguageSelected);

  const [taglineIndex, setTaglineIndex] = useState(0);
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoTranslate = useRef(new Animated.Value(12)).current;
  const taglineOpacity = useRef(new Animated.Value(1)).current;

  const appVersion =
    (Constants.expoConfig?.version as string | undefined) ??
    (Constants.manifest2?.extra?.expoClient?.version as string | undefined) ??
    '1.0.0';

  useEffect(() => {
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(logoTranslate, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [logoOpacity, logoTranslate]);

  // Seed the cycling tagline so the first visible one matches the user's
  // current UI language, then rotate every TAGLINE_INTERVAL_MS.
  useEffect(() => {
    const seed = TAGLINES.findIndex((t) => t.lang === language);
    setTaglineIndex(seed >= 0 ? seed : 0);
  }, [language]);

  useEffect(() => {
    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(taglineOpacity, {
          toValue: 0,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }),
      ]).start();
      setTaglineIndex((i) => (i + 1) % TAGLINES.length);
    }, TAGLINE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [taglineOpacity]);

  const currentTagline = TAGLINES[taglineIndex];

  const go = async (route: keyof AuthStackParamList): Promise<void> => {
    // Treat the first tap on either CTA as an implicit language confirmation
    // so the welcome screen doesn't reappear on relaunch.
    await markLanguageSelected();
    navigation.navigate(route);
  };

  const buttonLabels = useMemo(
    () => ({
      createFree: {
        en: 'Create for free',
        ar: 'أنشئ حسابك مجانًا',
        tr: 'Ücretsiz başla',
      },
      signIn: {
        en: 'Sign in',
        ar: 'تسجيل الدخول',
        tr: 'Giriş yap',
      },
    }),
    []
  );

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[...gradients.celebration]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.topBar}>
          <View />
          <LanguageSwitcher />
        </View>

        <View style={styles.logoWrap}>
          <Animated.View
            style={[
              styles.logoCard,
              {
                opacity: logoOpacity,
                transform: [{ translateY: logoTranslate }],
              },
            ]}
          >
            <Text style={styles.logoMark}>Z</Text>
          </Animated.View>
          <Animated.Text
            style={[
              styles.brand,
              { opacity: logoOpacity },
            ]}
          >
            Zyrix
          </Animated.Text>
        </View>

        <View style={styles.taglineWrap}>
          <Animated.Text
            style={[
              styles.tagline,
              { opacity: taglineOpacity },
              currentTagline.lang === 'ar'
                ? { writingDirection: 'rtl' }
                : null,
            ]}
            numberOfLines={2}
          >
            {currentTagline.text}
          </Animated.Text>
        </View>

        <View style={styles.buttons}>
          <PillButton
            label={buttonLabels.createFree[language as 'ar' | 'en' | 'tr']}
            variant="primary"
            onPress={() => void go('Register')}
            testID="splash-create-free"
          />
          <View style={{ height: spacing.lg }} />
          <PillButton
            label={buttonLabels.signIn[language as 'ar' | 'en' | 'tr']}
            variant="secondary"
            onPress={() => void go('Login')}
            testID="splash-sign-in"
          />
        </View>

        <Text style={styles.version}>v{appVersion}</Text>
      </SafeAreaView>
    </View>
  );
};

const BUTTON_HEIGHT = 56;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.coral,
  },
  safe: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
  },
  logoWrap: {
    alignItems: 'center',
    marginTop: spacing.xxl,
    rowGap: spacing.md,
  },
  logoCard: {
    width: 112,
    height: 112,
    borderRadius: radius.xxl,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lg,
  },
  logoMark: {
    fontSize: 64,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -2,
  },
  brand: {
    ...textStyles.display,
    color: colors.white,
    letterSpacing: 1,
  },
  taglineWrap: {
    paddingHorizontal: spacing.base,
    minHeight: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagline: {
    ...textStyles.h3,
    color: colors.white,
    textAlign: 'center',
    fontWeight: '600',
  },
  buttons: {
    paddingBottom: spacing.md,
  },
  pillPressable: {
    width: '100%',
  },
  pillPrimary: {
    height: BUTTON_HEIGHT,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    ...shadows.md,
  },
  pillPrimaryLabel: {
    ...textStyles.button,
    color: colors.white,
    fontSize: 17,
  },
  pillSecondary: {
    height: BUTTON_HEIGHT,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  pillSecondaryLabel: {
    ...textStyles.button,
    color: colors.primary,
    fontSize: 17,
  },
  version: {
    ...textStyles.caption,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    marginTop: spacing.md,
  },
});

export default SplashScreen;
