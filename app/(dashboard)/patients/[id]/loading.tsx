// Shown by Next.js while the patient profile page (async server component) is loading

export default function PatientProfileLoading() {
  return (
    <div className="flex h-full overflow-hidden">
      {/* Zone 1 — left rail */}
      <div className="hidden md:flex w-[220px] shrink-0 flex-col border-l bg-muted/20 p-4 space-y-4 animate-pulse">
        {/* Avatar + name */}
        <div className="flex flex-col items-center gap-2 pt-2">
          <div className="w-16 h-16 rounded-full bg-muted" />
          <div className="h-4 w-28 bg-muted rounded" />
          <div className="h-3 w-20 bg-muted rounded" />
        </div>
        {/* Condition badges */}
        <div className="space-y-2">
          <div className="h-3 w-20 bg-muted rounded" />
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-6 w-16 bg-muted rounded-full" />
            ))}
          </div>
        </div>
        {/* Stats */}
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-1">
            <div className="h-3 w-16 bg-muted rounded" />
            <div className="h-4 w-10 bg-muted rounded" />
          </div>
        ))}
      </div>

      {/* Zone 2 — main content */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Tab bar */}
        <div className="flex gap-4 px-4 pt-4 border-b animate-pulse">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-8 w-20 bg-muted rounded-t-md" />
          ))}
        </div>

        {/* Content skeleton */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 animate-pulse">
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-muted/40 rounded-lg p-3 space-y-1.5">
                <div className="h-6 w-12 bg-muted rounded mx-auto" />
                <div className="h-3 w-20 bg-muted rounded mx-auto" />
              </div>
            ))}
          </div>

          {/* Field blocks */}
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-3 w-20 bg-muted rounded" />
              <div className="h-9 w-full bg-muted rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
