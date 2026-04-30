/**
 * HelpCategoryScreen — list of articles inside a single docs category.
 * Route params carry the categoryId (sales / growth / ai / ...), and
 * we render one ArticleCard per article. Offline-cached articles get
 * a badge so the user knows they can open them without connectivity.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ArticleCard } from '../../components/help/ArticleCard';
import { Header } from '../../components/common/Header';
import { darkColors } from '../../theme/dark';
import { spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';
import type { SupportedLanguage } from '../../i18n';
import {
  docsApi,
  type DocsArticleMeta,
  type DocsCategoryId,
} from '../../services/docsApi';
import { docsCache } from '../../services/docsCache';
import type { HelpStackParamList } from '../../navigation/types';

type Route = RouteProp<HelpStackParamList, 'HelpCategory'>;
type Nav = NativeStackNavigationProp<HelpStackParamList, 'HelpCategory'>;

export const HelpCategoryScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const lang = (i18n.language as SupportedLanguage) ?? 'en';
  const categoryId = route.params.categoryId as DocsCategoryId;

  const [articles, setArticles] = useState<readonly DocsArticleMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cached, setCached] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    const data = await docsApi.getCategory(lang, categoryId);
    setArticles(data);
  }, [lang, categoryId]);

  const loadCached = useCallback(async () => {
    const slugs = await docsCache.listCachedSlugs(lang);
    const set = new Set(
      slugs
        .filter((k) => k.startsWith(`${categoryId}/`))
        .map((k) => k.slice(`${categoryId}/`.length))
    );
    setCached(set);
  }, [lang, categoryId]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      await load();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      void loadCached();
    }, [loadCached])
  );

  const onRefresh = async (): Promise<void> => {
    setRefreshing(true);
    await Promise.all([load(), loadCached()]);
    setRefreshing(false);
  };

  const categoryTitle = t(`help.categories.${categoryId}.title`, {
    defaultValue: categoryId,
  });

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <Header
        title={categoryTitle}
        subtitle={t('help.articleCount', { count: articles.length })}
        onBack={() => navigation.goBack()}
      />
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={darkColors.primary} />
          </View>
        ) : articles.length === 0 ? (
          <Text style={styles.empty}>{t('help.noArticles')}</Text>
        ) : (
          <View style={styles.list}>
            {articles.map((article) => (
              <ArticleCard
                key={article.slug}
                title={article.title}
                snippet={article.snippet}
                readTime={article.readTime}
                offlineLabel={cached.has(article.slug) ? t('help.offlineBadge') : null}
                onPress={() =>
                  navigation.navigate('HelpArticle', {
                    categoryId,
                    slug: article.slug,
                  })
                }
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: darkColors.background },
  scroll: {
    padding: spacing.base,
    paddingBottom: spacing.xxl,
  },
  loading: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  empty: {
    ...textStyles.body,
    color: darkColors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xxl,
  },
  list: {
    rowGap: spacing.sm,
  },
});

export default HelpCategoryScreen;
