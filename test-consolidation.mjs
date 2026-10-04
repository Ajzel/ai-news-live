import { consolidateNews } from './src/lib/scrapers/consolidate';

async function testConsolidation() {
  console.log('Testing consolidateNews...');
  try {
    const news = await consolidateNews();
    console.log(`Fetched ${news.length} news items.`);
    if (news.length > 0) {
      console.log('First item:', news[0]);
    } else {
      console.log('No news items found. Check network or API keys.');
    }
  } catch (error) {
    console.error('Consolidation failed:', error);
  }
}

testConsolidation();
