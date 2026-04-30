/**
 * HelpSearchScreen — live search across /api/docs/:lang/search.
 *
 * Debounces keystrokes (250 ms) so we don't hammer the backend while
 * typing. Tapping a result routes to the article screen. An empty
 * state and "no results" state both use translated copy.
 */

import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ArticleCard } from '../../components/help/ArticleCard';
import { Header } from '../../components/common/Header';
import { Icon } from '../../components/common/Icon';
import { darkColors } from '../../theme/dark';
import { radius, shadows, spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';
import type { SupportedLanguage } from '../../i18n';
import { docsApi, type DocsSearchHit } from '../../services/docsApi';
import type { HelpStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<HelpStackParamList, 'HelpSearch'>;

export const HelpSearchScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<Nav>();
  const lang = (i18n.language as SupportedLanguage) ?? 'en';

  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<readonly DocsSearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length === 0) {
      setHits([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      const results = await docsApi.search(lang, query.trim());
      setHits(results);
      setLoading(false);
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, lang]);

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <Header
        title={t('help.searchTitle')}
        onBack={() => navigation.goBack()}
      />
      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Icon name="search-outline" size={20} color={darkColors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('help.searchPlaceholder')}
            placeholderTextColor={darkColors.textMuted}
            autoFocus
            returnKeyType="search"
            style={styles.searchInput}
          />
          {query.length > 0 ? (
            <Pressable onPress={() => setQuery('')} accessibilityLabel={t('common.cancel')}>
              <Icon name="close-circle" size={20} color={darkColors.textMuted} />
            </Pressable>
          ) : null}
        </View>
      </View>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={darkColors.primary} />
          </View>
        ) : query.trim().length === 0 ? (
          <Text style={styles.empty}>{t('help.searchEmpty')}</Text>
        ) : hits.length === 0 ? (
          <Text style={styles.empty}>{t('help.searchNoResults')}</Text>
        ) : (
          <View style={styles.list}>
            {hits.map((hit) => (
              <ArticleCard
                key={`${hit.category}/${hit.slug}`}
                title={hit.title}
                snippet={hit.snippet}
                onPress={() =>
                  navigation.navigate('HelpArticle', {
                    categoryId: hit.category,
                    slug: hit.slug,
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
  searchWrap: {
    padding: spacing.base,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: darkColors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.base,
    height: 52,
    columnGap: spacing.sm,
    borderWidth: 1,
    borderColor: darkColors.border,
    ...shadows.xs,
  },
  searchInput: {
    flex: 1,
    ...textStyles.body,
    color: darkColors.textPrimary,
    paddingVertical: 0,
  },
  scroll: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.xxxl,
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

export default HelpSearchScreen;
