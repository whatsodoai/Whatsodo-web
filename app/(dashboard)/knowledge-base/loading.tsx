export default function Loading() {
  return (
    <div className="page-container">
      <div className="flex items-center justify-between">
        <div className="h-10 w-48 skeleton rounded-xl" />
        <div className="h-9 w-28 skeleton rounded-xl" />
      </div>
      <div className="h-10 w-80 skeleton rounded-xl" />
      <div className="h-96 skeleton rounded-2xl" />
      <div className="h-48 skeleton rounded-2xl" />
    </div>
  );
}
