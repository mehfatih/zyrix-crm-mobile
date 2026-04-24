/**
 * AIRecommendationsCard — premium gradient card pinned to the bottom of
 * the merchant home screen. Uses a horizontal pager with auto-advance
 * (7s per slide), pagination dots in the header, a skeleton shimmer
 * while recommendations load, and a deterministic fallback set if the
 * service fails so the card is never blank.
 */

import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  forwardRef,
} from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Linking,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import PagerView, {
  type PagerViewOnPageSelectedEvent,
} from 'react-native-pager-view';

import { AIRecommendationSlide } from './AIRecommendationSlide';
import { Icon } from './common/Icon';
import { colors, gradients } from '../constants/colors';
import { spacing } from '../constants/spacing';
import { textStyles } from '../constants/typography';
import {
  fetchRecommendations,
  getFallbackTips,
  type Recommendation,
} from '../services/recommendations';

const CARD_HEIGHT = 220;
const HORIZONTAL_MARGIN = 16;
const AUTO_ADVANCE_MS = 7000;

const screenWidth = Dimensions.get('window').width;
const pagerWidth = screenWidth - HORIZONTAL_MARGIN * 2;

export interface AIRecommendationsCardHandle {
  refresh: () => Promise<void>;
}

export interface AIRecommendationsCardProps {
  /** Optional userKey for cache scoping (defaults to "me"). */
  userKey?: string;
}

export const AIRecommendationsCard = forwardRef<
  AIRecommendationsCardHandle,
  AIRecommendationsCardProps
>(({ userKey }, ref) => {
  const { t } = useTranslation();
  const navigation = useNavigation();

  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIdx, setActiveIdx] = useState(0);

  const pagerRef = useRef<PagerView>(null);
  const autoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const shimmer = useRef(new Animated.Value(0)).current;

  const load = useCallback(
    async (force: boolean): Promise<void> => {
      try {
        setLoading(true);
        const result = await fetchRecommendations({ userKey, force });
        setRecs(result.length > 0 ? result : getFallbackTips());
      } catch {
        setRecs(getFallbackTips());
      } finally {
        setLoading(false);
      }
    },
    [userKey]
  );

  useEffect(() => {
    void load(false);
  }, [load]);

  useImperativeHandle(
    ref,
    () => ({
      refresh: () => load(true),
    }),
    [load]
  );

  // Shimmer animation for the skeleton.
  useEffect(() => {
    if (!loading) return;
    Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1200,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      })
    ).start();
    return () => {
      shimmer.stopAnimation();
      shimmer.setValue(0);
    };
  }, [loading, shimmer]);

  // Auto-advance the pager.
  useEffect(() => {
    if (loading || recs.length <= 1) return;
    autoTimerRef.current = setInterval(() => {
      setActiveIdx((prev) => {
        const next = (prev + 1) % recs.length;
        pagerRef.current?.setPage(next);
        return next;
      });
    }, AUTO_ADVANCE_MS);
    return () => {
      if (autoTimerRef.current) clearInterval(autoTimerRef.current);
      autoTimerRef.current = null;
    };
  }, [loading, recs.length]);

  const onPageSelected = useCallback(
    (event: PagerViewOnPageSelectedEvent): void => {
      const next = event.nativeEvent.position;
      setActiveIdx((prev) => {
        if (prev !== next) {
          void Haptics.selectionAsync();
        }
        return next;
      });
    },
    []
  );

  const onCtaPress = useCallback(
    (rec: Recommendation): void => {
      switch (rec.ctaAction) {
        case 'send_whatsapp':
          void Linking.openURL('https://wa.me/').catch(() => undefined);
          return;
        case 'call':
          void Linking.openURL('tel:').catch(() => undefined);
          return;
        case 'view_stats':
        case 'view_forecast':
        case 'review_deal':
        case 'see_breakdown':
        case 'open_screen': {
          const target = rec.navigate;
          if (!target) return;
          try {
            (navigation as unknown as {
              navigate: (route: string, params?: unknown) => void;
            }).navigate(target.tab, { screen: target.screen });
          } catch {
            // route may not be registered yet
          }
          return;
        }
        case 'write_message':
        default:
          // No-op fallback; caller may wire up specific flows later.
          return;
      }
    },
    [navigation]
  );

  const dots = useMemo(() => {
    return recs.map((rec, idx) => (
      <View
        key={rec.id}
        style={[
          styles.dot,
          { opacity: idx === activeIdx ? 1 : 0.4 },
        ]}
      />
    ));
  }, [recs, activeIdx]);

  const shimmerOpacity = shimmer.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.4, 0.7, 0.4],
  });

  return (
    <View style={styles.outer}>
      <LinearGradient
        colors={gradients.premium as unknown as readonly [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Icon name="sparkles" size={16} color={colors.white} />
            <Text style={styles.headerTitle}>{t('aiRecs.title')}</Text>
          </View>
          <View style={styles.dotsRow}>{dots}</View>
        </View>

        {loading ? (
          <View style={styles.skeletonWrap}>
            <Animated.View
              style={[styles.skeletonLine, { opacity: shimmerOpacity, width: '70%' }]}
            />
            <Animated.View
              style={[styles.skeletonLine, { opacity: shimmerOpacity, width: '90%' }]}
            />
            <Animated.View
              style={[styles.skeletonLine, { opacity: shimmerOpacity, width: '40%' }]}
            />
            <Text style={styles.loadingText}>{t('aiRecs.loading')}</Text>
          </View>
        ) : (
          <PagerView
            ref={pagerRef}
            style={styles.pager}
            initialPage={0}
            onPageSelected={onPageSelected}
          >
            {recs.map((rec) => (
              <View key={rec.id} style={styles.page}>
                <AIRecommendationSlide
                  recommendation={rec}
                  onCtaPress={onCtaPress}
                />
              </View>
            ))}
          </PagerView>
        )}
      </LinearGradient>
    </View>
  );
});

AIRecommendationsCard.displayName = 'AIRecommendationsCard';

const styles = StyleSheet.create({
  outer: {
    width: pagerWidth,
    alignSelf: 'center',
  },
  card: {
    height: CARD_HEIGHT,
    borderRadius: 24,
    padding: 20,
    shadowColor: 'rgba(167,139,250,0.25)',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 1,
    shadowRadius: 30,
    elevation: 12,
    overflow: 'hidden',
  },
  header: {
    height: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 8,
  },
  headerTitle: {
    ...textStyles.label,
    fontSize: 13,
    fontWeight: '700',
    color: colors.white,
  },
  dotsRow: {
    flexDirection: 'row',
    columnGap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.white,
  },
  pager: {
    flex: 1,
    marginTop: spacing.md,
  },
  page: {
    flex: 1,
  },
  skeletonWrap: {
    flex: 1,
    justifyContent: 'center',
    rowGap: 10,
  },
  skeletonLine: {
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  loadingText: {
    ...textStyles.caption,
    color: 'rgba(255,255,255,0.85)',
    marginTop: spacing.sm,
  },
});

export default AIRecommendationsCard;
