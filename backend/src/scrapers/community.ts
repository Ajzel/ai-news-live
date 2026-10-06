import { NewsItem } from '../lib/types';
import { fetchWithTimeout } from '../lib/fetch-utils';
import { NewsItemSchema } from '../lib/validation';

async function getHackerNews(): Promise<NewsItem[]> {
  try {
    const res = await fetchWithTimeout(
      'https://hn.algolia.com/api/v1/search_by_date?query=AI&tags=story&numericFilters=points%3E10&hitsPerPage=30'
    );
    if (!res.ok) {
      console.warn(`Hacker News returned ${res.status}`);
      return [];
    }
    const data = await res.json();
    const items: NewsItem[] = [];

    for (const hit of data.hits) {
      if (!hit.title || !hit.url) continue; // skip Ask HN and similar posts
      const parsed = NewsItemSchema.safeParse({
        id: `hn-${hit.objectID}`,
        title: hit.title,
        summary: `${hit.points ?? 0} points, ${hit.num_comments ?? 0} comments on Hacker News`,
        url: hit.url,
        source: 'community',
        sourceName: 'Hacker News',
        publishedAt: new Date(hit.created_at),
        category: 'General',
        engagement: hit.points ?? 0,
      });
      if (parsed.success) items.push(parsed.data);
    }
    return items;
  } catch (error) {
    console.error('Error fetching Hacker News:', error);
    return [];
  }
}

export async function getCommunityNews(): Promise<NewsItem[]> {
  return getHackerNews();
}