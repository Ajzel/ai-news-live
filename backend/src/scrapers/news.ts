import { NewsItem } from '../lib/types';
import { fetchWithTimeout } from '../lib/fetch-utils';

export async function getGeneralNews(): Promise<NewsItem[]> {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) {
    console.warn('NEWS_API_KEY is not defined. Skipping general news.');
    return [];
  }

  try {
    const res = await fetchWithTimeout(`https://newsapi.org/v2/everything?q=artificial+intelligence&sortBy=publishedAt&apiKey=${apiKey}&pageSize=20`);
    const data = await res.json();

    if (data.status !== 'ok') {
      console.error('NewsAPI error:', data.message);
      return [];
    }

    return data.articles.map((article: any) => ({
      id: `newsapi-${article.url}`,
      title: article.title,
      summary: article.description || '',
      url: article.url,
      source: 'news',
      sourceName: article.source.name,
      publishedAt: new Date(article.publishedAt),
      category: 'General',
    }));
  } catch (error) {
    console.error('Error fetching general news:', error);
    return [];
  }
}
