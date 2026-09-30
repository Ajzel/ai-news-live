'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { NewsItem, NewsSource, NewsCategory } from '@/lib/types';
import NewsCard from './NewsCard';
import FilterBar from './FilterBar';
import LiveIndicator from './LiveIndicator';
import { createClient } from '@/lib/supabase';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function Feed({ initialData }: { initialData: NewsItem[] }) {
  const { data, mutate } = useSWR<NewsItem[]>('/api/fetch-latest', fetcher, {
    fallbackData: initialData,
    refreshInterval: 300000, // 5 minutes
  });

  const [sourceFilter, setSourceFilter] = useState<NewsSource | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<NewsCategory | 'all'>('all');
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const filteredNews = data?.filter(item => {
    const sourceMatch = sourceFilter === 'all' || item.source === sourceFilter;
    const categoryMatch = categoryFilter === 'all' || item.category === categoryFilter;
    return sourceMatch && categoryMatch;
  }) || [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">AI News Live</h1>
          <LiveIndicator />
        </div>
        <div>
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 hidden sm:inline">{user.email}</span>
              <button
                onClick={() => supabase.auth.signOut()}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <a
              href="/login"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Login
            </a>
          )}
        </div>
      </div>

      <FilterBar
        onFilterChange={(s, c) => {
          setSourceFilter(s);
          setCategoryFilter(c);
        }}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredNews.length > 0 ? (
          filteredNews.map(item => (
            <NewsCard key={item.id} item={item} />
          ))
        ) : (
          <div className="col-span-full text-center py-12 text-gray-500">
            No news found for the selected filters.
          </div>
        )}
      </div>
    </div>
  );
}
