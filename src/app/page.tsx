import { consolidateNews } from '@/lib/scrapers/consolidate';
import Feed from '@/components/feed/Feed';

export const revalidate = 3600; // ISR: revalidate every hour

export default async function HomePage() {
  const initialNews = await consolidateNews();

  return (
    <main className="min-h-screen bg-white">
      <Feed initialData={initialNews} />
    </main>
  );
}
