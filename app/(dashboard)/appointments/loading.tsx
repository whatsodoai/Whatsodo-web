export default function Loading() {
  return (
    <div className="page-container">
      <div className="flex items-center justify-between">
        <div className="h-5 w-40 skeleton rounded-lg" />
        <div className="flex gap-2">
          <div className="h-9 w-32 skeleton rounded-xl" />
          <div className="h-9 w-36 skeleton rounded-xl" />
        </div>
      </div>
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-8 w-24 skeleton rounded-lg" />
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-20 skeleton rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
