// Shown by Next.js while DashboardPage (async server component) is loading

function SkeletonCard() {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm animate-pulse space-y-3">
      <div className="h-3 w-24 bg-muted rounded" />
      <div className="h-7 w-16 bg-muted rounded" />
      <div className="h-3 w-32 bg-muted rounded" />
    </div>
  )
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b animate-pulse">
      <div className="w-8 h-8 rounded-full bg-muted shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 w-28 bg-muted rounded" />
        <div className="h-3 w-16 bg-muted rounded" />
      </div>
      <div className="h-5 w-14 bg-muted rounded-full" />
    </div>
  )
}

export default function DashboardLoading() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="space-y-1.5 animate-pulse">
        <div className="h-7 w-48 bg-muted rounded" />
        <div className="h-4 w-36 bg-muted rounded" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>

      {/* Quick actions bar */}
      <div className="flex gap-2 animate-pulse">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-9 w-28 bg-muted rounded-md" />
        ))}
      </div>

      {/* Timeline skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b animate-pulse">
            <div className="h-4 w-24 bg-muted rounded" />
          </div>
          {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm animate-pulse space-y-3">
          <div className="h-4 w-28 bg-muted rounded" />
          <div className="h-28 w-28 rounded-full bg-muted mx-auto" />
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-3 w-full bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
