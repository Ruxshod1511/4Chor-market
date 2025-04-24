export default function Loading() {
  return (
    <div className="min-h-screen p-4 bg-gray-900">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-800 rounded w-1/4"></div>
        <div className="h-64 bg-gray-800 rounded"></div>
      </div>
    </div>
  );
} 