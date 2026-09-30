import { NextResponse } from 'next/server';
import { consolidateNews } from '@/lib/scrapers/consolidate';

export async function GET() {
  try {
    const news = await consolidateNews();
    return NextResponse.json(news);
  } catch (error) {
    console.error('Error fetching latest news:', error);
    return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
  }
}
