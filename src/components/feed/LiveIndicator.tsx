export default function LiveIndicator() {
  return (
    <div className="flex items-center gap-2 px-3 py-1 bg-red-50 text-red-600 rounded-full text-xs font-medium border border-red-100">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
      </span>
      Live AI Feed
    </div>
  );
}
