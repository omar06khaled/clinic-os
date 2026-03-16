// Shown by Next.js while AuditorPage (async server component) is loading

function SkeletonBlock({ h = "h-40" }: { h?: string }) {
  return <div className={`${h} w-full animate-pulse rounded-xl bg-muted`} />
}

export default function AuditorLoading() {
  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="space-y-1.5 animate-pulse">
        <div className="h-6 w-40 bg-muted rounded" />
        <div className="h-4 w-72 bg-muted rounded" />
      </div>

      {/* Disclaimer banner */}
      <SkeletonBlock h="h-16" />

      {/* Reconciliation card */}
      <SkeletonBlock h="h-56" />

      {/* History section */}
      <div className="space-y-3">
        <div className="h-5 w-36 bg-muted rounded animate-pulse" />
        <SkeletonBlock h="h-48" />
        <SkeletonBlock h="h-40" />
      </div>
    </div>
  )
}
