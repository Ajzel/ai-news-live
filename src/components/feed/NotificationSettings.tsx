'use client';

import { useEffect, useRef, useState } from 'react';
import type { NotificationPrefs, NewsCategory, NewsSource } from '@/lib/types';
import { ALL_CATEGORIES, ALL_SOURCES, parseKeywords } from '@/lib/notifications';
import { sendTestNotification } from '@/lib/useNotifications';

type Props = {
  prefs: NotificationPrefs | null;
  save: (next: NotificationPrefs) => Promise<boolean>;
  error: string | null;
};

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter(v => v !== value) : [...list, value];
}

export default function NotificationSettings({ prefs, save, error }: Props) {
  const [open, setOpen] = useState(false);
  // null = "no unsaved edits", fall back to what is saved
  const [edits, setDraft] = useState<NotificationPrefs | null>(null);
  const [kwEdits, setKeywordText] = useState<string | null>(null);
  const draft = edits ?? prefs;
  const keywordText = kwEdits ?? prefs?.keywords.join(', ') ?? '';
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const supported = typeof Notification !== 'undefined';
  const permission = supported ? Notification.permission : 'denied';

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!draft) return null;

  const onToggleEnabled = async (on: boolean) => {
    setMessage(null);
    if (on) {
      if (!supported) {
        setMessage('This browser does not support notifications.');
        return;
      }
      const result = await Notification.requestPermission();
      if (result !== 'granted') {
        setMessage('Notifications are blocked. Allow them for this site in your browser settings, then try again.');
        return;
      }
    }
    setDraft({ ...draft, enabled: on });
  };

  const onSave = async () => {
    setSaving(true);
    setMessage(null);
    const ok = await save({ ...draft, keywords: parseKeywords(keywordText) });
    setSaving(false);
    if (ok) {
      setDraft(null);
      setKeywordText(null);
      setMessage('Saved.');
    }
  };

  const active = prefs?.enabled && permission === 'granted';
  const nothingSelected = draft.categories.length === 0 || draft.sources.length === 0;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-label="Notification settings"
        className="relative px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
      >
        <span aria-hidden>🔔</span>
        {active && (
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-green-500" aria-hidden />
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[90vw] z-20 p-4 bg-white border border-gray-200 rounded-xl shadow-lg text-gray-800">
          <h2 className="text-sm font-semibold mb-3">Notifications</h2>

          <label className="flex items-center justify-between mb-4 text-sm">
            <span>Alert me about new stories</span>
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={draft.enabled}
              onChange={e => onToggleEnabled(e.target.checked)}
            />
          </label>

          <fieldset className="mb-3" disabled={!draft.enabled}>
            <legend className="text-xs font-medium text-gray-500 mb-1">Categories</legend>
            <div className="flex flex-wrap gap-1">
              {ALL_CATEGORIES.map((c: NewsCategory) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setDraft({ ...draft, categories: toggle(draft.categories, c) })}
                  className={`px-3 py-1 text-xs rounded-full border transition-colors disabled:opacity-50 ${
                    draft.categories.includes(c)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="mb-3" disabled={!draft.enabled}>
            <legend className="text-xs font-medium text-gray-500 mb-1">Sources</legend>
            <div className="flex flex-wrap gap-1">
              {ALL_SOURCES.map((s: NewsSource) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setDraft({ ...draft, sources: toggle(draft.sources, s) })}
                  className={`px-3 py-1 text-xs rounded-full border capitalize transition-colors disabled:opacity-50 ${
                    draft.sources.includes(s)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </fieldset>

          <label className="block mb-3">
            <span className="block text-xs font-medium text-gray-500 mb-1">
              Only if it mentions (optional, comma separated)
            </span>
            <input
              type="text"
              disabled={!draft.enabled}
              value={keywordText}
              onChange={e => setKeywordText(e.target.value)}
              placeholder="claude, agents, robotics"
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md text-black disabled:opacity-50"
            />
          </label>

          {nothingSelected && draft.enabled && (
            <p className="text-xs text-amber-700 mb-2">
              Pick at least one category and one source, or nothing will match.
            </p>
          )}
          {message && <p className="text-xs text-gray-600 mb-2">{message}</p>}
          {error && <p className="text-xs text-red-600 mb-2">{error}</p>}

          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              onClick={sendTestNotification}
              disabled={!supported || permission !== 'granted'}
              className="text-xs text-blue-700 hover:underline disabled:text-gray-400 disabled:no-underline"
            >
              Send test
            </button>
          </div>

          <p className="mt-3 text-[11px] leading-snug text-gray-500">
            Alerts appear while AI News Live is open in a browser tab. The feed checks for new stories every 5 minutes.
          </p>
        </div>
      )}
    </div>
  );
}
