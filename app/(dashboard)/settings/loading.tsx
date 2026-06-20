export default function Loading() {
  return (
    <div className="page-container">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="h-48 skeleton rounded-2xl" />
        <div className="lg:col-span-3 h-96 skeleton rounded-2xl" />
      </div>
    </div>
  );
}
