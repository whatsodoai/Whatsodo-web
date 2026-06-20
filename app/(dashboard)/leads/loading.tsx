export default function Loading() {
  return (
    <div className="page-container">
      <div className="flex items-center justify-between">
        <div className="h-5 w-24 skeleton rounded-lg" />
        <div className="h-9 w-28 skeleton rounded-xl" />
      </div>
      <div className="flex gap-3">
        <div className="h-10 flex-1 skeleton rounded-xl" />
        <div className="h-10 w-48 skeleton rounded-xl" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-14 skeleton rounded-xl" />
        ))}
      </div>
    </div>
  );
}
