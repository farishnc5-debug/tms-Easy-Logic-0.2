export default function Loading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading">
      <div className="skeleton h-8 w-56" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-24" />
        ))}
      </div>
      <div className="skeleton h-72" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="skeleton h-48" />
        <div className="skeleton h-48" />
        <div className="skeleton h-48" />
      </div>
    </div>
  );
}
