import { z } from 'zod';
import { NewsSource, NewsCategory } from './types';

export const NewsItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(500),
  summary: z.string().max(2000).default(''),
  url: z.string().url(),
  source: z.enum(['blog', 'community', 'research', 'news']),
  sourceName: z.string().min(1),
  publishedAt: z.date(),
  category: z.enum(['LLM', 'Robotics', 'Ethics', 'General']),
  engagement: z.number().optional(),
});

export type ValidatedNewsItem = z.infer<typeof NewsItemSchema>;
