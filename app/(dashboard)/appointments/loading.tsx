// Shown by Next.js while AppointmentsPage (async server component) is loading

function SkeletonAppointmentCard() {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl border bg-card animate-pulse">
      <div className="w-10 h-10 rounded-full bg-muted shrink-0 mt-0.5" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-28 bg-muted rounded" />
        <div className="h-3 w-16 bg-muted rounded" />
        <div className="h-5 w-12 bg-muted rounded-full" />
      </div>
      <div className="h-3 w-10 bg-muted rounded" />
    </div>
  )
}

export default function AppointmentsLoading() {
  return (
    <div className="flex flex-col h-full" dir="rtl">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b animate-pulse">
        <div className="flex gap-2">
          <div className="h-8 w-16 bg-muted rounded-md" />
          <div className="h-8 w-16 bg-muted rounded-md" />
        </div>
        <div className="flex gap-2">
          <div className="h-8 w-8 bg-muted rounded-md" />
          <div className="h-8 w-24 bg-muted rounded-md" />
          <div className="h-8 w-8 bg-muted rounded-md" />
        </div>
        <div className="h-9 w-28 bg-muted rounded-md" />
      </div>

      {/* Hour slots */}
      <div className="flex-1 overflow-hidden p-4 space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="h-3 w-12 bg-muted rounded mt-1 shrink-0" />
            <div className="flex-1 space-y-2">
              {i % 2 === 0 && <SkeletonAppointmentCard />}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
