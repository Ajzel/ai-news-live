import { NewsItem } from '../types';
import { fetchWithTimeout } from '../fetch-utils';

async function getHackerNews(): Promise<NewsItem[]> {
  try {
    const topStoriesRes = await fetchWithTimeout('https://hacker-news.firebaseio.com/v0/topstories.json');
    const topStories = await topStoriesRes.json();

    const newsItems: NewsItem[] = [];
    // Fetch only top 20 to avoid hitting rate limits and keep it fast
    for (const id of topStories.slice(0, 20)) {
      const itemRes = await fetchWithTimeout(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
      const item = await itemRes.json();

      if (item.title && item.url && item.text) {
        newsItems.push({
          id: `hn-${id}`,
          title: item.title,
          summary: item.text ? item.text.substring(0, 200) + '...' : 'No summary available',
          url: item.url,
          source: 'community',
          sourceName: 'Hacker News',
          publishedAt: new Date(item.time * 1000),
          category: 'General',
          engagement: item.score,
        });
      }
    }
    return newsItems;
  } catch (error) {
    console.error('Error fetching Hacker News:', error);
    return [];
  }
}

async function getRedditAI(): Promise<NewsItem[]> {
  try {
    const res = await fetchWithTimeout('https://www.reddit.com/r/ArtificialInteligence/top.json?limit=20', {
      headers: {
        'User-Agent': 'AI-News-Live-Bot/1.0',
      },
    });
    const data = await res.json();

    return data.data.children.map((child: any) => {
      const post = child.data;
      return {
        id: `reddit-${post.id}`,
        title: post.title,
        summary: post.selftext ? post.selftext.substring(0, 200) + '...' : 'No summary available',
        url: `https://www.reddit.com${post.permalink}`,
        source: 'community',
        sourceName: 'Reddit',
        publishedAt: new Date(post.created_utc * 1000),
        category: 'General',
        engagement: post.ups,
      };
    });
  } catch (error) {
    console.error('Error fetching Reddit:', error);
    return [];
  }
}

export async function getCommunityNews(): Promise<NewsItem[]> {
  const [hnNews, redditNews] = await Promise.all([
    getHackerNews(),
    getRedditAI(),
  ]);
  return [...hnNews, ...redditNews];
}
