// Automatically shown by Next.js while PatientsPage (async server component) is loading

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b animate-pulse">
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-muted flex-shrink-0" />

      {/* Name + phone */}
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-36 bg-muted rounded" />
        <div className="h-3 w-24 bg-muted rounded" />
      </div>

      {/* Last visit */}
      <div className="hidden sm:block space-y-1.5 text-right">
        <div className="h-3 w-14 bg-muted rounded ml-auto" />
        <div className="h-3 w-20 bg-muted rounded ml-auto" />
      </div>

      {/* Total visits */}
      <div className="hidden md:block space-y-1.5 text-right">
        <div className="h-3 w-10 bg-muted rounded ml-auto" />
        <div className="h-3 w-6 bg-muted rounded ml-auto" />
      </div>

      {/* Balance */}
      <div className="space-y-1.5 text-right">
        <div className="h-3 w-12 bg-muted rounded ml-auto" />
        <div className="h-3 w-8 bg-muted rounded ml-auto" />
      </div>

      {/* Chevron */}
      <div className="w-4 h-4 bg-muted rounded flex-shrink-0" />
    </div>
  )
}

export default function PatientsLoading() {
  return (
    <div className="flex flex-col h-full" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-5 pb-3 border-b animate-pulse">
        <div className="h-6 w-20 bg-muted rounded" />
        <div className="h-4 w-16 bg-muted rounded" />
      </div>

      {/* Search bar */}
      <div className="px-4 py-3 border-b animate-pulse">
        <div className="h-9 w-full bg-muted rounded-md" />
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 px-4 py-2.5 border-b overflow-hidden animate-pulse">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex-shrink-0 h-7 w-16 bg-muted rounded-full" />
        ))}
      </div>

      {/* Rows */}
      <div className="flex-1 overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
    </div>
  )
}
