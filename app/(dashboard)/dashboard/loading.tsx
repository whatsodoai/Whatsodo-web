export default function Loading() {
  return (
    <div className="page-container">
      <div className="h-14 skeleton rounded-2xl" />
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 skeleton rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-64 skeleton rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
