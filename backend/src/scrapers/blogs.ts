import Parser from 'rss-parser';
import * as cheerio from 'cheerio';
import { NewsItem } from '../lib/types';
import { fetchWithTimeout } from '../lib/fetch-utils';

const parser = new Parser();

const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
  Accept: 'application/rss+xml, application/xml, text/xml, text/html;q=0.8, */*;q=0.5',
  'Accept-Language': 'en-US,en;q=0.9',
};

const BLOG_FEEDS = [
  { name: 'OpenAI', url: 'https://openai.com/news/rss.xml', category: 'General' as const },
  { name: 'Google DeepMind', url: 'https://deepmind.google/blog/rss.xml', category: 'General' as const },
  { name: 'Hugging Face', url: 'https://huggingface.co/blog/feed.xml', category: 'General' as const },
  { name: 'NVIDIA', url: 'https://blogs.nvidia.com/feed/', category: 'General' as const },
  { name: 'AWS Machine Learning', url: 'https://aws.amazon.com/blogs/machine-learning/feed/', category: 'General' as const },
];

async function fetchRssFeed(feed: { name: string; url: string; category: 'General' }): Promise<NewsItem[]> {
  try {
    const res = await fetchWithTimeout(feed.url, { headers: BROWSER_HEADERS });
    if (!res.ok) {
      console.error(`Feed error [${feed.name}]: HTTP ${res.status}`);
      return [];
    }
    const xml = (await res.text()).trim();
    if (!xml.startsWith('<?xml') && !xml.startsWith('<rss') && !xml.startsWith('<feed')) {
      console.error(`Feed error [${feed.name}]: response was not XML (likely a bot-check page)`);
      return [];
    }

    const feedData = await parser.parseString(xml);
    return feedData.items
      .filter(item => item.title && item.link)
      .map(item => ({
        id: `blog-${feed.name}-${item.guid || item.link}`,
        title: item.title as string,
        summary: item.contentSnippet || item.content || '',
        url: item.link as string,
        source: 'blog' as const,
        sourceName: feed.name,
        publishedAt: new Date(item.isoDate || item.pubDate || Date.now()),
        category: feed.category,
      }))
      .filter(item => !isNaN(item.publishedAt.getTime()))
      .slice(0, 10); // newest 10 per feed so one blog can't flood the list
  } catch (error: any) {
    const cause = error?.cause?.code || error?.cause?.message || '';
    console.error(`Feed error [${feed.name}]: ${error.message} ${cause}`);
    return [];
  }
}

const DATE_RE = /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.? \d{1,2}, \d{4}/;

async function scrapeAnthropic(): Promise<NewsItem[]> {
  try {
    const res = await fetchWithTimeout('https://www.anthropic.com/news', { headers: BROWSER_HEADERS });
    if (!res.ok) {
      console.error(`Anthropic scrape: HTTP ${res.status}`);
      return [];
    }
    const $ = cheerio.load(await res.text());
    const seen = new Set<string>();
    const items: NewsItem[] = [];

    $('a[href^="/news/"]').each((_, el) => {
      const href = ($(el).attr('href') || '').split('?')[0];
      if (!href || href === '/news/' || href === '/news') return;

      const url = `https://www.anthropic.com${href}`;
      if (seen.has(url)) return;

      const fullText = $(el).text().replace(/\s+/g, ' ').trim();
      const dateMatch = fullText.match(DATE_RE);

      // Category, title, summary and date are separate elements inside the card.
      // Read each one on its own so the category label isn't glued onto the title.
      const parts = $(el)
        .find('*')
        .filter((_, c) => $(c).children().length === 0)
        .map((_, c) => $(c).text().replace(/\s+/g, ' ').trim())
        .get()
        .filter(Boolean);

      const candidates = parts
        .filter(p => !DATE_RE.test(p))
        .sort((a, b) => b.length - a.length);

      const title = candidates[0] || fullText.replace(DATE_RE, '').trim();
      if (title.length < 10) return;
      const summary = candidates[1] && candidates[1].length > 40 ? candidates[1] : '';

      const datetimeAttr = $(el).find('time').attr('datetime');
      const published = new Date(datetimeAttr || (dateMatch ? dateMatch[0] : Date.now()));

      seen.add(url);
      items.push({
        id: `blog-anthropic-${url}`,
        title,
        summary,
        url,
        source: 'blog',
        sourceName: 'Anthropic',
        publishedAt: isNaN(published.getTime()) ? new Date() : published,
        category: 'General',
      });
    });

    if (items.length === 0) {
      console.warn('Anthropic scrape found no articles; the page markup may have changed');
    }
    return items.slice(0, 15);
  } catch (error: any) {
    const cause = error?.cause?.code || error?.cause?.message || '';
    console.error(`Anthropic scrape error: ${error.message} ${cause}`);
    return [];
  }
}

export async function getBlogNews(): Promise<NewsItem[]> {
  const [rssResults, anthropicNews] = await Promise.all([
    Promise.all(BLOG_FEEDS.map(fetchRssFeed)),
    scrapeAnthropic(),
  ]);

  // Anthropic has no official RSS. If the direct scrape is blocked, try an RSSHub route.
  const anthropicItems =
    anthropicNews.length > 0
      ? anthropicNews
      : await fetchRssFeed({
          name: 'Anthropic',
          url: 'https://rsshub.app/anthropic/news',
          category: 'General',
        });

  return [...rssResults.flat(), ...anthropicItems];
}