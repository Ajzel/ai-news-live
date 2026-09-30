export type NewsSource = 'blog' | 'community' | 'research' | 'news';
export type NewsCategory = 'LLM' | 'Robotics' | 'Ethics' | 'General';

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: NewsSource;
  sourceName: string;
  publishedAt: Date;
  category: NewsCategory;
  engagement?: number;
}
