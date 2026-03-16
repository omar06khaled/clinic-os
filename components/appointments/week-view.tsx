"use client"

import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { CalendarX } from "lucide-react"
import type { SerializedAppointment } from "./appointments-view"
import { AppointmentCard } from "./appointment-card"

// ── Helpers ───────────────────────────────────────────────────────────────────

function addDaysToStr(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number)
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10)
}

/** Returns true if the Cairo-local date of an ISO string matches dateStr (YYYY-MM-DD). */
function isSameCairoDay(isoString: string, dateStr: string): boolean {
  const cairo = new Date(isoString).toLocaleDateString("sv", {
    timeZone: "Africa/Cairo",
  })
  return cairo === dateStr
}

// ── Component ─────────────────────────────────────────────────────────────────

interface WeekViewProps {
  appointments: SerializedAppointment[]
  /** Sunday of the displayed week (YYYY-MM-DD) */
  weekStartDate: string
  onSelect: (apt: SerializedAppointment) => void
}

export function WeekView({ appointments, weekStartDate, onSelect }: WeekViewProps) {
  const t = useTranslations("appointments")
  const todayStr = new Date().toLocaleDateString("sv", { timeZone: "Africa/Cairo" })

  const DAY_LABELS = [
    t("daySun"),
    t("dayMon"),
    t("dayTue"),
    t("dayWed"),
    t("dayThu"),
    t("dayFri"),
    t("daySat"),
  ]

  // Build 7 day descriptors (Sun → Sat)
  const days = Array.from({ length: 7 }, (_, i) => {
    const dateStr = addDaysToStr(weekStartDate, i)
    const [y, m, d] = dateStr.split("-").map(Number)
    const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay() // 0=Sun
    const dayApts = appointments.filter((a) => isSameCairoDay(a.scheduledAt, dateStr))
    return { dateStr, dow, dayApts, dayNum: d }
  })

  const totalCount = appointments.length

  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-[560px]">
        {days.map(({ dateStr, dow, dayApts, dayNum }) => {
          const isToday = dateStr === todayStr

          return (
            <div
              key={dateStr}
              className={cn(
                "flex flex-1 flex-col min-w-0 border-l last:border-l-0 first:border-l-0",
                isToday && "bg-primary/[0.03]"
              )}
            >
              {/* Day header */}
              <div
                className={cn(
                  "sticky top-0 z-10 flex flex-col items-center gap-0.5 px-1 py-2 border-b bg-background",
                  isToday && "bg-primary/[0.04]"
                )}
              >
                <span
                  className={cn(
                    "text-[10px] font-medium leading-none",
                    isToday ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {DAY_LABELS[dow]}
                </span>

                {/* Date circle */}
                <div
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold leading-none",
                    isToday
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground"
                  )}
                >
                  {dayNum}
                </div>

                {/* Appointment count */}
                {dayApts.length > 0 && (
                  <span
                    className={cn(
                      "text-[9px] font-medium leading-none",
                      isToday ? "text-primary/70" : "text-muted-foreground/60"
                    )}
                  >
                    {dayApts.length}
                  </span>
                )}
              </div>

              {/* Appointment cards */}
              <div className="p-1.5 space-y-1 min-h-[380px]">
                {dayApts.map((apt) => (
                  <AppointmentCard
                    key={apt.id}
                    apt={apt}
                    compact
                    onClick={() => onSelect(apt)}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Empty state (no appointments the entire week) */}
      {totalCount === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <CalendarX className="h-7 w-7 text-muted-foreground/50" />
          </div>
          <p className="text-sm text-muted-foreground">{t("emptyWeek")}</p>
        </div>
      )}
    </div>
  )
}
