import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Initialize Redis for rate limiting
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '10 s'), // 10 requests per 10 seconds
});

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. CORS Configuration
  const response = NextResponse.next();
  response.headers.set('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGINS || '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: response.headers,
    });
  }

  // 2. Rate Limiting for API routes
  if (pathname.startsWith('/api/')) {
    const ip = request.ip ?? '127.0.0.1';
    const { success } = await ratelimit.limit(ip);

    if (!success) {
      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: {
          'Content-Type': 'text/plain',
          'Retry-After': '10',
        },
      });
    }
  }

  return response;
}

export const config = {
  matcher: '/api/:path*',
};
