import { NewsItem } from '@/lib/types';

export default function NewsCard({ item }: { item: NewsItem }) {
  const sourceColors = {
    blog: 'bg-blue-100 text-blue-800',
    community: 'bg-green-100 text-green-800',
    research: 'bg-purple-100 text-purple-800',
    news: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow bg-white">
      <div className="flex justify-between items-start mb-2">
        <span className={`text-xs font-medium px-2 py-0.5 rounded ${sourceColors[item.source]}`}>
          {item.sourceName}
        </span>
        <span className="text-xs text-gray-500">
          {item.publishedAt.toLocaleDateString()}
        </span>
      </div>
      <h3 className="text-lg font-semibold mb-2">
        <a href={item.url} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">
          {item.title}
        </a>
      </h3>
      <p className="text-sm text-gray-600 line-clamp-3 mb-4">
        {item.summary}
      </p>
      {item.engagement && (
        <div className="text-xs text-gray-400 flex items-center">
          <span className="mr-1">🔥</span> {item.engagement} engagements
        </div>
      )}
    </div>
  );
}
