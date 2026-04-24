/**
 * HelpHomeScreen — entry point for the Help Center.
 *
 * Layout:
 *   1. Cyan header with drawer trigger (reuses Header component)
 *   2. Search bar that pushes HelpSearch on focus/submit
 *   3. Category tiles (2-column grid, 10 categories)
 *   4. Popular articles list (top 5 by views, from /docs/:lang/index)
 *   5. "Can't find what you need?" support CTA row (WhatsApp + call)
 *
 * All data comes from docsApi.getIndex which falls back to fixtures when
 * the backend /api/docs/:lang/index route is unavailable — so this
 * screen always renders something useful even offline on first launch.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  DrawerActions,
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ArticleCard } from '../../components/help/ArticleCard';
import { CategoryTile } from '../../components/help/CategoryTile';
import { Header } from '../../components/common/Header';
import { Icon, type AnyIconName } from '../../components/common/Icon';
import { colors } from '../../constants/colors';
import { hitSlop, radius, shadows, spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';
import type { SupportedLanguage } from '../../i18n';
import { docsApi, type DocsIndex } from '../../services/docsApi';
import { docsCache } from '../../services/docsCache';
import type { HelpStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<HelpStackParamList, 'HelpHome'>;

export const HelpHomeScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<Nav>();
  const lang = (i18n.language as SupportedLanguage) ?? 'en';

  const [index, setIndex] = useState<DocsIndex | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cachedSlugs, setCachedSlugs] = useState<readonly string[]>([]);
  const [query, setQuery] = useState('');

  const loadIndex = useCallback(async () => {
    const data = await docsApi.getIndex(lang);
    setIndex(data);
  }, [lang]);

  const loadCached = useCallback(async () => {
    const slugs = await docsCache.listCachedSlugs(lang);
    setCachedSlugs(slugs);
  }, [lang]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      await loadIndex();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [loadIndex]);

  useFocusEffect(
    useCallback(() => {
      void loadCached();
    }, [loadCached])
  );

  const onRefresh = async (): Promise<void> => {
    setRefreshing(true);
    await Promise.all([loadIndex(), loadCached()]);
    setRefreshing(false);
  };

  const openSearch = (): void => {
    navigation.navigate('HelpSearch');
  };

  const openCategory = (categoryId: string): void => {
    navigation.navigate('HelpCategory', { categoryId });
  };

  const openArticle = (categoryId: string, slug: string): void => {
    navigation.navigate('HelpArticle', { categoryId, slug });
  };

  const onSearchSubmit = (): void => {
    if (!query.trim()) return;
    navigation.navigate('HelpSearch');
  };

  const contactSupport = (): void => {
    void Linking.openURL('https://wa.me/966500000000');
  };

  const contactEmail = (): void => {
    void Linking.openURL('mailto:support@zyrix.co');
  };

  const isCached = useMemo(() => {
    const set = new Set(cachedSlugs.map((k) => k.split('/').slice(1).join('/')));
    return (category: string, slug: string) => set.has(`${category}/${slug}`);
  }, [cachedSlugs]);

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <Header
        title={t('help.title')}
        showBack={false}
        leftSlot={
          <Pressable
            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
            hitSlop={hitSlop.md}
            style={styles.headerBtn}
            accessibilityLabel={t('sidebar.search')}
          >
            <Icon name="menu-outline" size={24} color={colors.textInverse} />
          </Pressable>
        }
      />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={styles.heroTitle}>{t('help.heroTitle')}</Text>
        <Text style={styles.heroSubtitle}>{t('help.heroSubtitle')}</Text>

        <Pressable onPress={openSearch} style={styles.searchBar}>
          <Icon name="search-outline" size={20} color={colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('help.searchPlaceholder')}
            placeholderTextColor={colors.textMuted}
            returnKeyType="search"
            onSubmitEditing={onSearchSubmit}
            onFocus={openSearch}
            style={styles.searchInput}
          />
        </Pressable>

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>{t('help.categoriesTitle')}</Text>
            <View style={styles.grid}>
              {(index?.categories ?? []).map((cat) => (
                <CategoryTile
                  key={cat.id}
                  title={t(`help.categories.${cat.id}.title`, { defaultValue: cat.title })}
                  description={t(`help.categories.${cat.id}.description`, {
                    defaultValue: cat.description,
                  })}
                  icon={cat.icon as AnyIconName}
                  accent={cat.accent}
                  articleCountLabel={t('help.articleCount', { count: cat.articleCount })}
                  onPress={() => openCategory(cat.id)}
                />
              ))}
            </View>

            {index?.popular.length ? (
              <>
                <Text style={styles.sectionTitle}>{t('help.popularTitle')}</Text>
                <View style={styles.list}>
                  {index.popular.map((article) => (
                    <ArticleCard
                      key={article.slug}
                      title={article.title}
                      snippet={article.snippet}
                      readTime={article.readTime}
                      offlineLabel={
                        isCached(article.category, article.slug)
                          ? t('help.offlineBadge')
                          : null
                      }
                      onPress={() => openArticle(article.category, article.slug)}
                    />
                  ))}
                </View>
              </>
            ) : null}

            <View style={styles.supportCard}>
              <Text style={styles.supportTitle}>{t('help.supportTitle')}</Text>
              <Text style={styles.supportSubtitle}>{t('help.supportSubtitle')}</Text>
              <View style={styles.supportActions}>
                <Pressable
                  onPress={contactSupport}
                  style={({ pressed }) => [
                    styles.supportBtn,
                    styles.supportBtnPrimary,
                    pressed ? { opacity: 0.88 } : null,
                  ]}
                >
                  <Icon name="logo-whatsapp" size={18} color={colors.textInverse} />
                  <Text style={styles.supportBtnTextPrimary}>
                    {t('help.contactSupport')}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={contactEmail}
                  style={({ pressed }) => [
                    styles.supportBtn,
                    styles.supportBtnSecondary,
                    pressed ? { opacity: 0.88 } : null,
                  ]}
                >
                  <Icon name="mail-outline" size={18} color={colors.primary} />
                  <Text style={styles.supportBtnTextSecondary}>
                    {t('help.scheduleCall')}
                  </Text>
                </Pressable>
              </View>
            </View>
          </>
        )}
      </ScrollView>
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
    rowGap: spacing.base,
    paddingBottom: spacing.xxxl,
  },
  heroTitle: {
    ...textStyles.h2,
    color: colors.textHeading,
  },
  heroSubtitle: {
    ...textStyles.body,
    color: colors.textSecondary,
    marginTop: -spacing.xs,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.base,
    height: 52,
    columnGap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.xs,
  },
  searchInput: {
    flex: 1,
    ...textStyles.body,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  loading: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  sectionTitle: {
    ...textStyles.h4,
    color: colors.textHeading,
    marginTop: spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: spacing.sm,
    rowGap: spacing.sm,
  },
  list: {
    rowGap: spacing.sm,
  },
  supportCard: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.lg,
    padding: spacing.base,
    rowGap: spacing.xs,
    marginTop: spacing.base,
  },
  supportTitle: {
    ...textStyles.h4,
    color: colors.textHeading,
  },
  supportSubtitle: {
    ...textStyles.caption,
    color: colors.textSecondary,
  },
  supportActions: {
    flexDirection: 'row',
    columnGap: spacing.sm,
    marginTop: spacing.xs,
  },
  supportBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: spacing.xs,
    height: 44,
    borderRadius: radius.pill,
  },
  supportBtnPrimary: {
    backgroundColor: colors.primary,
  },
  supportBtnSecondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  supportBtnTextPrimary: {
    ...textStyles.label,
    color: colors.textInverse,
    fontWeight: '700',
  },
  supportBtnTextSecondary: {
    ...textStyles.label,
    color: colors.primary,
    fontWeight: '700',
  },
});

export default HelpHomeScreen;
