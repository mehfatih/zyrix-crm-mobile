/**
 * recommendations service — fetches AI-driven home-screen suggestions
 * for the AIRecommendationsCard slider.
 *
 * Backend wiring is deferred (Sprint 4 will expose
 * GET /api/recommendations behind a Gemini call). For now we ship a
 * deterministic localized fallback set so the card never appears blank.
 *
 * Caches results in AsyncStorage for 15 minutes per user.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import { apiGet } from '../api/client';
import type { AnyIconName } from '../components/common/Icon';

const CACHE_PREFIX = 'aiRecsCache.';
const CACHE_TTL_MS = 15 * 60 * 1000;
const ENDPOINT = '/api/recommendations';

const USE_FALLBACK = true;

export type RecommendationType =
  | 'overdue_task'
  | 'hot_lead'
  | 'performance'
  | 'stalling_deal'
  | 'revenue_insight'
  | 'celebration'
  | 'regional_pattern'
  | 'tip';

export interface Recommendation {
  id: string;
  type: RecommendationType;
  icon: AnyIconName;
  /** i18n key under aiRecs.* — preferred when present. */
  titleKey?: string;
  /** i18n key under aiRecs.* — preferred when present. */
  bodyKey?: string;
  /** Plain string fallback if no titleKey provided. */
  title?: string;
  body?: string;
  ctaKey: string;
  ctaAction:
    | 'send_whatsapp'
    | 'call'
    | 'view_stats'
    | 'review_deal'
    | 'view_forecast'
    | 'write_message'
    | 'see_breakdown'
    | 'open_screen';
  entityId?: string;
  /** Optional screen + parent-tab to navigate when the CTA is tapped. */
  navigate?: { tab: string; screen: string };
}

interface CacheEntry {
  ts: number;
  recs: Recommendation[];
}

const FALLBACK_RECS: Recommendation[] = [
  {
    id: 'rec_overdue',
    type: 'overdue_task',
    icon: 'time-outline',
    titleKey: 'aiRecs.rec1Title',
    bodyKey: 'aiRecs.rec1Body',
    ctaKey: 'aiRecs.ctaSendWhatsApp',
    ctaAction: 'send_whatsapp',
  },
  {
    id: 'rec_hot',
    type: 'hot_lead',
    icon: 'flash-outline',
    titleKey: 'aiRecs.rec2Title',
    bodyKey: 'aiRecs.rec2Body',
    ctaKey: 'aiRecs.ctaCallNow',
    ctaAction: 'call',
  },
  {
    id: 'rec_perf',
    type: 'performance',
    icon: 'trending-up-outline',
    titleKey: 'aiRecs.rec3Title',
    bodyKey: 'aiRecs.rec3Body',
    ctaKey: 'aiRecs.ctaViewStats',
    ctaAction: 'view_stats',
    navigate: { tab: 'MoreTab', screen: 'Reports' },
  },
  {
    id: 'rec_stall',
    type: 'stalling_deal',
    icon: 'alert-circle-outline',
    titleKey: 'aiRecs.rec4Title',
    bodyKey: 'aiRecs.rec4Body',
    ctaKey: 'aiRecs.ctaReviewDeal',
    ctaAction: 'review_deal',
    navigate: { tab: 'SalesTab', screen: 'Deals' },
  },
  {
    id: 'rec_rev',
    type: 'revenue_insight',
    icon: 'cash-outline',
    titleKey: 'aiRecs.rec5Title',
    bodyKey: 'aiRecs.rec5Body',
    ctaKey: 'aiRecs.ctaViewForecast',
    ctaAction: 'view_forecast',
    navigate: { tab: 'SalesTab', screen: 'QuotasForecast' },
  },
  {
    id: 'rec_anniv',
    type: 'celebration',
    icon: 'gift-outline',
    titleKey: 'aiRecs.rec6Title',
    bodyKey: 'aiRecs.rec6Body',
    ctaKey: 'aiRecs.ctaWriteMessage',
    ctaAction: 'write_message',
  },
  {
    id: 'rec_region',
    type: 'regional_pattern',
    icon: 'location-outline',
    titleKey: 'aiRecs.rec7Title',
    bodyKey: 'aiRecs.rec7Body',
    ctaKey: 'aiRecs.ctaSeeBreakdown',
    ctaAction: 'see_breakdown',
    navigate: { tab: 'SalesTab', screen: 'Territories' },
  },
];

const TIPS_FALLBACK: Recommendation[] = [
  {
    id: 'tip_import',
    type: 'tip',
    icon: 'cloud-upload-outline',
    titleKey: 'aiRecs.tip1Title',
    bodyKey: 'aiRecs.tip1Body',
    ctaKey: 'aiRecs.tip1Cta',
    ctaAction: 'open_screen',
    navigate: { tab: 'SalesTab', screen: 'Customers' },
  },
  {
    id: 'tip_deal',
    type: 'tip',
    icon: 'briefcase-outline',
    titleKey: 'aiRecs.tip2Title',
    bodyKey: 'aiRecs.tip2Body',
    ctaKey: 'aiRecs.tip2Cta',
    ctaAction: 'open_screen',
    navigate: { tab: 'SalesTab', screen: 'NewDeal' },
  },
  {
    id: 'tip_wa',
    type: 'tip',
    icon: 'logo-whatsapp',
    titleKey: 'aiRecs.tip3Title',
    bodyKey: 'aiRecs.tip3Body',
    ctaKey: 'aiRecs.tip3Cta',
    ctaAction: 'open_screen',
    navigate: { tab: 'MoreTab', screen: 'Integrations' },
  },
];

export const getFallbackTips = (): Recommendation[] => TIPS_FALLBACK.slice();

const readCache = async (userKey: string): Promise<CacheEntry | null> => {
  try {
    const raw = await AsyncStorage.getItem(`${CACHE_PREFIX}${userKey}`);
    if (!raw) return null;
    return JSON.parse(raw) as CacheEntry;
  } catch {
    return null;
  }
};

const writeCache = async (
  userKey: string,
  recs: Recommendation[]
): Promise<void> => {
  try {
    const entry: CacheEntry = { ts: Date.now(), recs };
    await AsyncStorage.setItem(
      `${CACHE_PREFIX}${userKey}`,
      JSON.stringify(entry)
    );
  } catch {
    // ignore — caching is best-effort
  }
};

export interface FetchRecommendationsOptions {
  userKey?: string;
  force?: boolean;
}

export const fetchRecommendations = async (
  options: FetchRecommendationsOptions = {}
): Promise<Recommendation[]> => {
  const userKey = options.userKey ?? 'me';

  if (!options.force) {
    const cached = await readCache(userKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
      return cached.recs;
    }
  }

  if (USE_FALLBACK) {
    const recs = FALLBACK_RECS.slice();
    await writeCache(userKey, recs);
    return recs;
  }

  try {
    const response = await apiGet<{ recommendations: Recommendation[] }>(
      ENDPOINT
    );
    const recs = response?.recommendations ?? [];
    await writeCache(userKey, recs);
    return recs.length > 0 ? recs : TIPS_FALLBACK.slice();
  } catch {
    return TIPS_FALLBACK.slice();
  }
};
