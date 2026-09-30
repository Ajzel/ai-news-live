import { NewsItem } from '../types';
import { getBlogNews } from './blogs';
import { getCommunityNews } from './community';
import { getArXivNews } from './arxiv';
import { getGeneralNews } from './news';
import { NewsItemSchema } from '../validation';

export async function consolidateNews(): Promise<NewsItem[]> {
  const [blogs, community, research, general] = await Promise.all([
    getBlogNews(),
    getCommunityNews(),
    getArXivNews(),
    getGeneralNews(),
  ]);

  const allNews = [...blogs, ...community, ...research, ...general];

  // Remove duplicates by URL and validate schema
  const seenUrls = new Set();
  const validNews = allNews.filter(item => {
    // 1. URL Duplicate check
    if (!item.url || seenUrls.has(item.url)) {
      return false;
    }
    seenUrls.add(item.url);

    // 2. Schema validation
    const result = NewsItemSchema.safeParse(item);
    if (!result.success) {
      console.warn(`Invalid news item filtered out: ${item.title}. Errors:`, result.error.format());
      return false;
    }
    return true;
  });

  // Sort by date descending
  return validNews.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
}
