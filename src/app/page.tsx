import { BACKEND_URL } from '@/lib/config';
import Feed from '@/components/feed/Feed';

export const revalidate = 3600; // ISR: revalidate every hour

async function getNews() {
  try {
    const res = await fetch(`${BACKEND_URL}/news`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error('Failed to fetch news:', error);
    return [];
  }
}

export default async function HomePage() {
  const initialNews = await getNews();

  return (
    <main className="min-h-screen bg-white">
      <Feed initialData={initialNews} />
    </main>
  );
}