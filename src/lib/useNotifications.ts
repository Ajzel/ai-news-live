'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase';
import type { NewsItem, NotificationPrefs } from '@/lib/types';
import {
  DEFAULT_PREFS,
  ALL_CATEGORIES,
  ALL_SOURCES,
  matchesPrefs,
  loadSeen,
  saveSeen,
} from '@/lib/notifications';

type Row = {
  enabled: boolean;
  categories: string[];
  sources: string[];
  keywords: string[];
};

/** Load and save the signed-in user's notification preferences. */
export function useNotificationPrefs(userId: string | undefined) {
  const supabase = useMemo(() => createClient(), []);
  // Prefs are stored with the user they belong to, so a different user never sees stale ones.
  const [state, setState] = useState<{ uid: string; prefs: NotificationPrefs } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const prefs = userId && state?.uid === userId ? state.prefs : null;
  const setPrefs = useCallback(
    (next: NotificationPrefs) => userId && setState({ uid: userId, prefs: next }),
    [userId],
  );

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    supabase
      .from('notification_preferences')
      .select('enabled, categories, sources, keywords')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setError(error.message);
          setPrefs(DEFAULT_PREFS);
          return;
        }
        const row = data as Row | null;
        setPrefs(
          row
            ? {
                enabled: row.enabled,
                categories: row.categories.filter(c =>
                  (ALL_CATEGORIES as string[]).includes(c),
                ) as NotificationPrefs['categories'],
                sources: row.sources.filter(s =>
                  (ALL_SOURCES as string[]).includes(s),
                ) as NotificationPrefs['sources'],
                keywords: row.keywords,
              }
            : DEFAULT_PREFS,
        );
      });
    return () => {
      cancelled = true;
    };
  }, [userId, supabase, setPrefs]);

  const save = useCallback(
    async (next: NotificationPrefs): Promise<boolean> => {
      if (!userId) return false;
      setError(null);
      const { error } = await supabase.from('notification_preferences').upsert({
        user_id: userId,
        enabled: next.enabled,
        categories: next.categories,
        sources: next.sources,
        keywords: next.keywords,
        updated_at: new Date().toISOString(),
      });
      if (error) {
        setError(error.message);
        return false;
      }
      setPrefs(next);
      return true;
    },
    [userId, supabase, setPrefs],
  );

  return { prefs, save, error };
}

function show(title: string, body: string, url?: string, tag?: string) {
  try {
    const n = new Notification(title, { body, tag });
    if (url) {
      n.onclick = () => {
        window.open(url, '_blank', 'noopener,noreferrer');
        n.close();
      };
    }
  } catch {
    // Some mobile browsers only allow notifications through a service worker.
  }
}

export function sendTestNotification() {
  show('AI News Live', 'Notifications are working. You will be alerted about new stories.', undefined, 'ainl-test');
}

/**
 * Fires a browser notification for stories that arrive while the tab is open
 * and match the user's preferences. The first load only records what is already
 * there, so turning alerts on never floods the user with the whole feed.
 */
export function useNewsNotifications(
  userId: string | undefined,
  items: NewsItem[] | undefined,
  prefs: NotificationPrefs | null,
) {
  useEffect(() => {
    if (!userId || !items || !prefs) return;

    const seen = loadSeen(userId);
    const ids = items.map(i => i.id);

    if (seen === null) {
      saveSeen(userId, ids); // baseline, no alerts
      return;
    }

    const fresh = items.filter(i => !seen.has(i.id));
    if (fresh.length === 0) return;
    saveSeen(userId, [...seen, ...fresh.map(i => i.id)]);

    if (!prefs.enabled) return;
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;

    const matches = fresh.filter(i => matchesPrefs(i, prefs));
    if (matches.length === 0) return;

    if (matches.length <= 3) {
      for (const m of matches) show(`${m.category} · ${m.sourceName}`, m.title, m.url, m.id);
    } else {
      show(
        `${matches.length} new AI stories`,
        matches.slice(0, 3).map(m => m.title).join('\n'),
        undefined,
        'ainl-batch',
      );
    }
  }, [userId, items, prefs]);
}
