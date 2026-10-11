import type { NewsItem, NewsCategory, NewsSource, NotificationPrefs } from '@/lib/types';

export const ALL_CATEGORIES: NewsCategory[] = ['LLM', 'Robotics', 'Ethics', 'General'];
export const ALL_SOURCES: NewsSource[] = ['blog', 'community', 'research', 'news'];

export const DEFAULT_PREFS: NotificationPrefs = {
  enabled: false,
  categories: ALL_CATEGORIES,
  sources: ALL_SOURCES,
  keywords: [],
};

/** Does a story match what this user asked to be notified about? */
export function matchesPrefs(item: NewsItem, prefs: NotificationPrefs): boolean {
  if (!prefs.categories.includes(item.category)) return false;
  if (!prefs.sources.includes(item.source)) return false;
  if (prefs.keywords.length === 0) return true;
  const text = `${item.title} ${item.summary}`.toLowerCase();
  return prefs.keywords.some(k => text.includes(k.toLowerCase()));
}

/** "gpt, Claude ,, robot" -> ["gpt", "Claude", "robot"] (max 20, deduped) */
export function parseKeywords(raw: string): string[] {
  const seen = new Set<string>();
  for (const part of raw.split(',')) {
    const k = part.trim();
    if (k) seen.add(k.slice(0, 40));
  }
  return [...seen].slice(0, 20);
}

const seenKey = (userId: string) => `ainl:seen:${userId}`;
const MAX_SEEN = 1000;

/** IDs already shown to this user on this browser, or null if never recorded. */
export function loadSeen(userId: string): Set<string> | null {
  try {
    const raw = localStorage.getItem(seenKey(userId));
    return raw ? new Set<string>(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function saveSeen(userId: string, ids: Iterable<string>): void {
  try {
    localStorage.setItem(seenKey(userId), JSON.stringify([...ids].slice(-MAX_SEEN)));
  } catch {
    // Storage can be blocked (private mode); alerts then just baseline again next load.
  }
}
