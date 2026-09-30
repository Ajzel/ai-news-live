import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';
import { consolidateNews } from './scrapers/consolidate';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS || '*',
  methods: ['GET'],
}));

// Rate Limiting
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '10 s'),
});

const rateLimitMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
  try {
    const { success } = await ratelimit.limit(ip);
    if (!success) {
      return res.status(429).send('Too Many Requests');
    }
    next();
  } catch (error) {
    console.error('Rate limit error:', error);
    next(); // Allow request if rate limiter fails
  }
};

// News endpoint
app.get('/news', rateLimitMiddleware, async (req, res) => {
  try {
    const news = await consolidateNews();
    res.json(news);
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

app.listen(port, () => {
  console.log(`Backend server running on port ${port}`);
});
