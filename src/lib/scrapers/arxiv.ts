import * as cheerio from 'cheerio';
import { NewsItem } from '../types';
import { fetchWithTimeout } from '../fetch-utils';

export async function getArXivNews(): Promise<NewsItem[]> {
  try {
    // Search for cs.AI and cs.LG (AI and Machine Learning)
    const url = 'http://export.arxiv.org/api/query?search_query=cat:cs.AI+OR+cat:cs.LG&start=0&max_results=20&sortBy=submittedDate&sortOrder=descending';
    const res = await fetchWithTimeout(url);
    const xml = await res.text();
    const $ = cheerio.load(xml, { xmlMode: true });

    const entries: NewsItem[] = [];
    $('entry').each((_, el) => {
      const title = $(el).find('title').text().replace(/\\n/g, ' ').trim();
      const summary = $(el).find('summary').text().replace(/\\n/g, ' ').trim();
      const url = $(el).find('id').text().trim();
      const publishedDate = $(el).find('published').text().trim();

      entries.push({
        id: `arxiv-${$(el).find('id').text().trim()}`,
        title,
        summary: summary.substring(0, 200) + '...',
        url,
        source: 'research',
        sourceName: 'ArXiv',
        publishedAt: new Date(publishedDate),
        category: 'General',
      });
    });
    return entries;
  } catch (error) {
    console.error('Error fetching ArXiv:', error);
    return [];
  }
}
