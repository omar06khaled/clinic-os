import { cn } from "@/lib/utils"
import { CalendarX } from "lucide-react"
import type { SerializedAppointment } from "./appointments-view"
import { AppointmentCard } from "./appointment-card"

// ── Constants ─────────────────────────────────────────────────────────────────

const HOUR_START = 8  // 8 AM
const HOUR_END = 21   // 9 PM (exclusive — last slot is 20:xx)

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Returns the hour (0–23) in Cairo time for an ISO string. */
function getCairoHour(isoString: string): number {
  const date = new Date(isoString)
  return Number(
    date.toLocaleString("en-US", {
      timeZone: "Africa/Cairo",
      hour: "numeric",
      hour12: false,
    })
  )
}

function formatHourLabel(hour: number): string {
  if (hour === 0) return "12:00 ص"
  if (hour === 12) return "12:00 م"
  const suffix = hour < 12 ? "ص" : "م"
  const h = hour > 12 ? hour - 12 : hour
  return `${h}:00 ${suffix}`
}

// ── Component ─────────────────────────────────────────────────────────────────

interface DayViewProps {
  appointments: SerializedAppointment[]
  date: string // YYYY-MM-DD
  onSelect: (apt: SerializedAppointment) => void
}

export function DayView({ appointments, onSelect }: DayViewProps) {
  if (appointments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-28 gap-3" dir="rtl">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <CalendarX className="h-7 w-7 text-muted-foreground/50" />
        </div>
        <p className="text-sm text-muted-foreground">لا يوجد مواعيد لهذا اليوم</p>
      </div>
    )
  }

  // ── Bucket appointments by Cairo hour ─────────────────────────────────────
  const byHour: Record<number, SerializedAppointment[]> = {}
  const early: SerializedAppointment[] = []
  const late: SerializedAppointment[] = []

  for (const apt of appointments) {
    const h = getCairoHour(apt.scheduledAt)
    if (h < HOUR_START) {
      early.push(apt)
    } else if (h >= HOUR_END) {
      late.push(apt)
    } else {
      if (!byHour[h]) byHour[h] = []
      byHour[h].push(apt)
    }
  }

  const hours = Array.from(
    { length: HOUR_END - HOUR_START },
    (_, i) => HOUR_START + i
  )

  return (
    <div className="px-4 py-4 max-w-2xl mx-auto" dir="rtl">
      {/* Pre-hours (before 8 AM) */}
      {early.length > 0 && (
        <div className="mb-4 space-y-2">
          {early.map((apt) => (
            <AppointmentCard key={apt.id} apt={apt} onClick={() => onSelect(apt)} />
          ))}
        </div>
      )}

      {/* Hour rows */}
      {hours.map((hour) => {
        const apts = byHour[hour] ?? []
        const hasApts = apts.length > 0

        return (
          <div key={hour} className="flex gap-3 min-h-[52px]">
            {/* Time label */}
            <div className="flex flex-col items-end w-16 shrink-0 pt-1">
              <span
                className={cn(
                  "text-xs tabular-nums leading-none",
                  hasApts
                    ? "text-foreground font-medium"
                    : "text-muted-foreground/40"
                )}
              >
                {formatHourLabel(hour)}
              </span>
            </div>

            {/* Divider + appointment cards */}
            <div
              className={cn(
                "flex flex-col flex-1 border-t pt-1 pb-3 gap-2",
                hasApts ? "border-border/60" : "border-border/20"
              )}
            >
              {apts.map((apt) => (
                <AppointmentCard
                  key={apt.id}
                  apt={apt}
                  onClick={() => onSelect(apt)}
                />
              ))}
            </div>
          </div>
        )
      })}

      {/* Post-hours (after 9 PM) */}
      {late.length > 0 && (
        <div className="mt-2 space-y-2">
          {late.map((apt) => (
            <AppointmentCard key={apt.id} apt={apt} onClick={() => onSelect(apt)} />
          ))}
        </div>
      )}
    </div>
  )
}
