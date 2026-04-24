/**
 * quickAddUsageTracker — persists usage stats and pinned tiles for the
 * "+" quick-add bottom sheet so the most-used actions float to the top.
 *
 * Score formula: (recent uses in last 30 days) * 2 + (all-time uses).
 * Pinned tiles always sort above unpinned ones, in pin order.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const USAGE_KEY = 'quickAddUsage';
const PINNED_KEY = 'quickAddPinned';
const RECENT_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

export type QuickAddTileKey =
  | 'contact'
  | 'company'
  | 'deal'
  | 'task'
  | 'ticket'
  | 'email'
  | 'note'
  | 'meeting'
  | 'campaign'
  | 'segment'
  | 'scanQR'
  | 'voiceNote';

export const QUICK_ADD_TILE_KEYS: readonly QuickAddTileKey[] = [
  'contact',
  'company',
  'deal',
  'task',
  'ticket',
  'email',
  'note',
  'meeting',
  'campaign',
  'segment',
  'scanQR',
  'voiceNote',
];

interface UsageRecord {
  total: number;
  /** Unix timestamps of recent uses, trimmed to RECENT_WINDOW_MS. */
  recent: number[];
}

type UsageMap = Partial<Record<QuickAddTileKey, UsageRecord>>;

const emptyMap = (): UsageMap => ({});

const safeParse = <T>(raw: string | null, fallback: T): T => {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const readUsage = async (): Promise<UsageMap> => {
  const raw = await AsyncStorage.getItem(USAGE_KEY);
  return safeParse<UsageMap>(raw, emptyMap());
};

const writeUsage = async (map: UsageMap): Promise<void> => {
  await AsyncStorage.setItem(USAGE_KEY, JSON.stringify(map));
};

const readPinned = async (): Promise<QuickAddTileKey[]> => {
  const raw = await AsyncStorage.getItem(PINNED_KEY);
  const list = safeParse<QuickAddTileKey[]>(raw, []);
  return list.filter((key): key is QuickAddTileKey =>
    QUICK_ADD_TILE_KEYS.includes(key as QuickAddTileKey)
  );
};

const writePinned = async (list: QuickAddTileKey[]): Promise<void> => {
  await AsyncStorage.setItem(PINNED_KEY, JSON.stringify(list));
};

export const recordUsage = async (key: QuickAddTileKey): Promise<void> => {
  const map = await readUsage();
  const now = Date.now();
  const cutoff = now - RECENT_WINDOW_MS;
  const existing = map[key] ?? { total: 0, recent: [] };
  const recent = existing.recent.filter((t) => t >= cutoff);
  recent.push(now);
  map[key] = { total: existing.total + 1, recent };
  await writeUsage(map);
};

const score = (record: UsageRecord | undefined): number => {
  if (!record) return 0;
  const cutoff = Date.now() - RECENT_WINDOW_MS;
  const recentCount = record.recent.filter((t) => t >= cutoff).length;
  return recentCount * 2 + record.total;
};

export interface SortedTilesResult {
  order: QuickAddTileKey[];
  pinned: ReadonlySet<QuickAddTileKey>;
}

export const getSortedTiles = async (): Promise<SortedTilesResult> => {
  const [map, pinned] = await Promise.all([readUsage(), readPinned()]);
  const pinSet = new Set<QuickAddTileKey>(pinned);

  const unpinned = QUICK_ADD_TILE_KEYS.filter((k) => !pinSet.has(k));
  unpinned.sort((a, b) => {
    const diff = score(map[b]) - score(map[a]);
    if (diff !== 0) return diff;
    // Stable secondary: keep default order.
    return QUICK_ADD_TILE_KEYS.indexOf(a) - QUICK_ADD_TILE_KEYS.indexOf(b);
  });

  return { order: [...pinned, ...unpinned], pinned: pinSet };
};

export const togglePin = async (key: QuickAddTileKey): Promise<boolean> => {
  const list = await readPinned();
  const idx = list.indexOf(key);
  let nowPinned: boolean;
  if (idx >= 0) {
    list.splice(idx, 1);
    nowPinned = false;
  } else {
    list.unshift(key);
    nowPinned = true;
  }
  await writePinned(list);
  return nowPinned;
};

export const isPinned = async (key: QuickAddTileKey): Promise<boolean> => {
  const list = await readPinned();
  return list.includes(key);
};

export const __resetForTests = async (): Promise<void> => {
  await AsyncStorage.multiRemove([USAGE_KEY, PINNED_KEY]);
};
