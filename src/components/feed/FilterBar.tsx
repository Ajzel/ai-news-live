'use client';

import { useState } from 'react';
import { NewsSource, NewsCategory } from '@/lib/types';

export default function FilterBar({
  onFilterChange
}: {
  onFilterChange: (source: NewsSource | 'all', category: NewsCategory | 'all') => void
}) {
  const [source, setSource] = useState<NewsSource | 'all'>('all');
  const [category, setCategory] = useState<NewsCategory | 'all'>('all');

  const handleSourceChange = (s: NewsSource | 'all') => {
    setSource(s);
    onFilterChange(s, category);
  };

  const handleCategoryChange = (c: NewsCategory | 'all') => {
    setCategory(c);
    onFilterChange(source, c);
  };

  const sources: (NewsSource | 'all')[] = ['all', 'blog', 'community', 'research', 'news'];
  const categories: (NewsCategory | 'all')[] = ['all', 'LLM', 'Robotics', 'Ethics', 'General'];

  return (
    <div className="flex flex-wrap gap-4 mb-8 p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">Source:</span>
        <div className="flex gap-1">
          {sources.map(s => (
            <button
              key={s}
              onClick={() => handleSourceChange(s)}
              className={`px-3 py-1 text-xs rounded-full capitalize transition-colors ${
                source === s ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border hover:bg-gray-100'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">Category:</span>
        <div className="flex gap-1">
          {categories.map(c => (
            <button
              key={c}
              onClick={() => handleCategoryChange(c)}
              className={`px-3 py-1 text-xs rounded-full capitalize transition-colors ${
                category === c ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border hover:bg-gray-100'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
