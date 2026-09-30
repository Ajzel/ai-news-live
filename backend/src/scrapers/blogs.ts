import Parser from 'rss-parser';
import * as cheerio from 'cheerio';
import { NewsItem } from '../lib/types';
import { fetchWithTimeout } from '../lib/fetch-utils';
import { NewsItemSchema } from '../lib/validation';

const parser = new Parser();

const BLOG_FEEDS = [
  { name: 'OpenAI', url: 'https://openai.com/news/rss.xml', category: 'General' as const },
  { name: 'Anthropic', url: 'https://www.anthropic.com/news', category: 'General' as const }, // This one might need scraping
  { name: 'Google DeepMind', url: 'https://deepmind.google/blog/rss.xml', category: 'General' as const },
];

async function fetchRssFeed(feed: { name: string; url: string; category: any }): Promise<NewsItem[]> {
  try {
    // Note: rss-parser doesn't use native fetch directly for everything,
    // but we can use our timeout logic for the raw fetch if needed.
    // For simplicity, we trust rss-parser's internal fetch or can wrap it.
    const feedData = await parser.parseURL(feed.url);
    return feedData.items.map(item => ({
      id: `blog-${feed.name}-${item.guid || item.link}`,
      title: item.title || 'No Title',
      summary: item.contentSnippet || item.content || '',
      url: item.link || '',
      source: 'blog',
      sourceName: feed.name,
      publishedAt: new Date(item.pubDate || Date.now()),
      category: feed.category,
    }));
  } catch (error) {
    console.error(`Error fetching RSS feed for ${feed.name}:`, error);
    return [];
  }
}

async function scrapeAnthropic(): Promise<NewsItem[]> {
  try {
    const response = await fetchWithTimeout('https://www.anthropic.com/news');
    const data = await response.text();
    const $ = cheerio.load(data);
    const items: NewsItem[] = [];

    $('a.news-card').each((_, el) => {
      const title = $(el).find('h3').text().trim();
      const url = 'https://www.anthropic.com' + $(el).attr('href');
      const summary = $(el).find('p').text().trim();

      if (title && url) {
        items.push({
          id: `blog-anthropic-${url}`,
          title,
          summary,
          url,
          source: 'blog',
          sourceName: 'Anthropic',
          publishedAt: new Date(),
          category: 'General',
        });
      }
    });
    return items;
  } catch (error) {
    console.error('Error scraping Anthropic:', error);
    return [];
  }
}

export async function getBlogNews(): Promise<NewsItem[]> {
  const rssPromises = BLOG_FEEDS
    .filter(f => f.url.endsWith('.xml'))
    .map(fetchRssFeed);

  const [rssNews, anthropicNews] = await Promise.all([
    Promise.all(rssPromises).then(results => results.flat()),
    scrapeAnthropic(),
  ]);

  return [...rssNews, ...anthropicNews];
}
