/**
 * docsCache — offline cache for the Help Center.
 *
 * Keeps the last 20 read articles in AsyncStorage with an LRU policy,
 * plus a TTL so stale content eventually refetches. Screens call
 * `remember` after a successful load and `recall` when the device is
 * offline. `listCachedSlugs` feeds the "available offline" badge on
 * article cards.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import type { DocsArticle } from './docsApi';
import type { SupportedLanguage } from '../i18n';

const STORAGE_KEY = '@zyrix/docs-cache/v1';
const MAX_ARTICLES = 20;
const TTL_MS = 7 * 24 * 60 * 60 * 1000;

interface CacheEntry {
  key: string;
  article: DocsArticle;
  savedAt: number;
}

interface CacheShape {
  entries: CacheEntry[];
}

const buildKey = (
  lang: SupportedLanguage,
  category: string,
  slug: string
): string => `${lang}/${category}/${slug}`;

const readCache = async (): Promise<CacheShape> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return { entries: [] };
    const parsed = JSON.parse(raw) as CacheShape;
    if (!parsed || !Array.isArray(parsed.entries)) return { entries: [] };
    return parsed;
  } catch {
    return { entries: [] };
  }
};

const writeCache = async (shape: CacheShape): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(shape));
  } catch {
    // Disk full or quota exceeded — ignore silently.
  }
};

export const docsCache = {
  async remember(
    lang: SupportedLanguage,
    category: string,
    slug: string,
    article: DocsArticle
  ): Promise<void> {
    const key = buildKey(lang, category, slug);
    const cache = await readCache();
    const filtered = cache.entries.filter((e) => e.key !== key);
    filtered.unshift({ key, article, savedAt: Date.now() });
    const trimmed = filtered.slice(0, MAX_ARTICLES);
    await writeCache({ entries: trimmed });
  },

  async recall(
    lang: SupportedLanguage,
    category: string,
    slug: string
  ): Promise<DocsArticle | null> {
    const key = buildKey(lang, category, slug);
    const cache = await readCache();
    const hit = cache.entries.find((e) => e.key === key);
    if (!hit) return null;
    if (Date.now() - hit.savedAt > TTL_MS) return null;
    return hit.article;
  },

  async listCachedSlugs(lang: SupportedLanguage): Promise<readonly string[]> {
    const cache = await readCache();
    const prefix = `${lang}/`;
    return cache.entries
      .filter((e) => e.key.startsWith(prefix) && Date.now() - e.savedAt <= TTL_MS)
      .map((e) => e.key.slice(prefix.length));
  },

  async clear(): Promise<void> {
    await writeCache({ entries: [] });
  },
};
