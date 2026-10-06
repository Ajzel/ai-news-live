import { NewsItem } from '../lib/types';
import { getBlogNews } from './blogs';
import { getCommunityNews } from './community';
import { getArXivNews } from './arxiv';
import { getGeneralNews } from './news';
import { NewsItemSchema } from '../lib/validation';
import { withCategory } from '../lib/categorize';

export async function consolidateNews(): Promise<NewsItem[]> {
  const [blogs, community, research, general] = await Promise.all([
    getBlogNews(),
    getCommunityNews(),
    getArXivNews(),
    getGeneralNews(),
  ]);

  // Sources tag everything "General"; assign real categories from title and summary.
  // Items that already have a specific category are left alone.
  const allNews = [...blogs, ...community, ...research, ...general].map(item =>
    item.category === 'General' ? withCategory(item) : item
  );

  // Remove duplicates by URL and validate schema
  const seenUrls = new Set<string>();
  const validNews = allNews.filter(item => {
    // 1. URL duplicate check
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