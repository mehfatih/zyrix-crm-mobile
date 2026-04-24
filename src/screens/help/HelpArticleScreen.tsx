/**
 * HelpArticleScreen — renders a single docs article natively.
 *
 * Data path:
 *   1. Try AsyncStorage cache (docsCache.recall).
 *   2. Fetch from /api/docs/:lang/:category/:slug.
 *   3. On success: update cache (LRU, last 20).
 *
 * Footer actions:
 *   - "Was this helpful?" thumbs up/down -> docsApi.submitFeedback
 *   - Share (native Share sheet) with article URL
 *   - Previous / Next navigation when the backend supplies siblings
 *
 * An offline banner surfaces whenever NetInfo reports no connection so
 * users understand they're reading a cached copy.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import NetInfo from '@react-native-community/netinfo';
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Header } from '../../components/common/Header';
import { Icon } from '../../components/common/Icon';
import { MarkdownRenderer } from '../../components/help/MarkdownRenderer';
import { colors } from '../../constants/colors';
import { radius, shadows, spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';
import type { SupportedLanguage } from '../../i18n';
import {
  docsApi,
  type DocsArticle,
  type DocsCategoryId,
} from '../../services/docsApi';
import { docsCache } from '../../services/docsCache';
import type { HelpStackParamList } from '../../navigation/types';

type Route = RouteProp<HelpStackParamList, 'HelpArticle'>;
type Nav = NativeStackNavigationProp<HelpStackParamList, 'HelpArticle'>;

type FeedbackState = 'none' | 'up' | 'down';

export const HelpArticleScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const lang = (i18n.language as SupportedLanguage) ?? 'en';
  const { categoryId, slug } = route.params;
  const category = categoryId as DocsCategoryId;

  const [article, setArticle] = useState<DocsArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [offline, setOffline] = useState(false);
  const [fromCache, setFromCache] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>('none');

  const load = useCallback(async () => {
    const cached = await docsCache.recall(lang, category, slug);
    if (cached) {
      setArticle(cached);
      setFromCache(true);
      setLoading(false);
    }
    try {
      const fresh = await docsApi.getArticle(lang, category, slug);
      setArticle(fresh);
      setFromCache(false);
      void docsCache.remember(lang, category, slug, fresh);
    } catch {
      if (!cached) {
        setArticle(null);
      }
    } finally {
      setLoading(false);
    }
  }, [lang, category, slug]);

  useEffect(() => {
    setFeedback('none');
    setLoading(true);
    void load();
  }, [load]);

  useEffect(() => {
    const sub = NetInfo.addEventListener((state) => {
      setOffline(!(state.isConnected && state.isInternetReachable !== false));
    });
    return () => sub();
  }, []);

  const onRefresh = async (): Promise<void> => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const onShare = async (): Promise<void> => {
    if (!article) return;
    const url = `https://crm.zyrix.co/${lang}/docs/${category}/${article.slug}`;
    try {
      await Share.share({ message: `${article.title}\n${url}`, url, title: article.title });
    } catch {
      // user dismissed — ignore
    }
  };

  const submitFeedback = async (helpful: boolean): Promise<void> => {
    if (!article) return;
    setFeedback(helpful ? 'up' : 'down');
    await docsApi.submitFeedback(article.slug, helpful);
    Alert.alert(t('help.feedbackThanksTitle'), t('help.feedbackThanksBody'));
  };

  const goSibling = (target: string | null | undefined): void => {
    if (!target) return;
    navigation.setParams({ categoryId, slug: target });
  };

  const categoryTitle = t(`help.categories.${category}.title`, {
    defaultValue: category,
  });

  const breadcrumb = useMemo(
    () => `${t('help.title')} · ${categoryTitle}`,
    [t, categoryTitle]
  );

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <Header
        title={article?.title ?? t('help.articleLoading')}
        subtitle={breadcrumb}
        onBack={() => navigation.goBack()}
        rightSlot={
          article ? (
            <Pressable
              onPress={() => void onShare()}
              accessibilityLabel={t('help.share')}
              style={styles.headerAction}
            >
              <Icon name="share-social-outline" size={22} color={colors.textInverse} />
            </Pressable>
          ) : null
        }
      />
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading && !article ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : !article ? (
          <Text style={styles.empty}>{t('help.articleMissing')}</Text>
        ) : (
          <>
            {offline ? (
              <View style={styles.offlineBanner}>
                <Icon name="cloud-offline-outline" size={18} color={colors.warning} />
                <Text style={styles.offlineText}>
                  {fromCache ? t('help.readingOffline') : t('help.offlineBanner')}
                </Text>
              </View>
            ) : null}

            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Icon name="time-outline" size={14} color={colors.textMuted} />
                <Text style={styles.metaText}>{article.readTime}</Text>
              </View>
              <View style={styles.metaItem}>
                <Icon name="calendar-outline" size={14} color={colors.textMuted} />
                <Text style={styles.metaText}>{article.updatedAt}</Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaText}>
                  {article.plans.map((p) => p.toUpperCase()).join(' · ')}
                </Text>
              </View>
            </View>

            <MarkdownRenderer source={article.markdown} />

            <View style={styles.feedbackCard}>
              <Text style={styles.feedbackTitle}>{t('help.wasThisHelpful')}</Text>
              <View style={styles.feedbackRow}>
                <Pressable
                  onPress={() => void submitFeedback(true)}
                  style={({ pressed }) => [
                    styles.feedbackBtn,
                    feedback === 'up' ? styles.feedbackBtnActive : null,
                    pressed ? { opacity: 0.88 } : null,
                  ]}
                >
                  <Icon
                    name="thumbs-up-outline"
                    size={18}
                    color={feedback === 'up' ? colors.textInverse : colors.primary}
                  />
                  <Text
                    style={[
                      styles.feedbackBtnText,
                      feedback === 'up' ? styles.feedbackBtnTextActive : null,
                    ]}
                  >
                    {t('help.yes')}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => void submitFeedback(false)}
                  style={({ pressed }) => [
                    styles.feedbackBtn,
                    feedback === 'down' ? styles.feedbackBtnActive : null,
                    pressed ? { opacity: 0.88 } : null,
                  ]}
                >
                  <Icon
                    name="thumbs-down-outline"
                    size={18}
                    color={feedback === 'down' ? colors.textInverse : colors.primary}
                  />
                  <Text
                    style={[
                      styles.feedbackBtnText,
                      feedback === 'down' ? styles.feedbackBtnTextActive : null,
                    ]}
                  >
                    {t('help.no')}
                  </Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.navRow}>
              <Pressable
                onPress={() => goSibling(article.prevSlug)}
                disabled={!article.prevSlug}
                style={({ pressed }) => [
                  styles.navBtn,
                  !article.prevSlug ? styles.navBtnDisabled : null,
                  pressed ? { opacity: 0.88 } : null,
                ]}
              >
                <Icon name="chevron-back" size={18} color={colors.primary} />
                <Text style={styles.navBtnText}>{t('help.previous')}</Text>
              </Pressable>
              <Pressable
                onPress={() => goSibling(article.nextSlug)}
                disabled={!article.nextSlug}
                style={({ pressed }) => [
                  styles.navBtn,
                  !article.nextSlug ? styles.navBtnDisabled : null,
                  pressed ? { opacity: 0.88 } : null,
                ]}
              >
                <Text style={styles.navBtnText}>{t('help.next')}</Text>
                <Icon name="chevron-forward" size={18} color={colors.primary} />
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  headerAction: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    padding: spacing.base,
    paddingBottom: spacing.xxxl,
    rowGap: spacing.sm,
  },
  loading: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  empty: {
    ...textStyles.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xxl,
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.xs,
    backgroundColor: colors.warningSoft,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  offlineText: {
    ...textStyles.caption,
    color: '#92400E',
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: spacing.sm,
    rowGap: spacing.xxs,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.xxs,
  },
  metaText: {
    ...textStyles.caption,
    color: colors.textMuted,
  },
  feedbackCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.base,
    rowGap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.base,
    ...shadows.xs,
  },
  feedbackTitle: {
    ...textStyles.bodyMedium,
    color: colors.textHeading,
    fontWeight: '700',
  },
  feedbackRow: {
    flexDirection: 'row',
    columnGap: spacing.sm,
  },
  feedbackBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: spacing.xs,
    height: 42,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  feedbackBtnActive: {
    backgroundColor: colors.primary,
  },
  feedbackBtnText: {
    ...textStyles.label,
    color: colors.primary,
    fontWeight: '700',
  },
  feedbackBtnTextActive: {
    color: colors.textInverse,
  },
  navRow: {
    flexDirection: 'row',
    columnGap: spacing.sm,
    marginTop: spacing.sm,
  },
  navBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: spacing.xs,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  navBtnDisabled: {
    opacity: 0.4,
  },
  navBtnText: {
    ...textStyles.label,
    color: colors.primary,
    fontWeight: '700',
  },
});

export default HelpArticleScreen;
