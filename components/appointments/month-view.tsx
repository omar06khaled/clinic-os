"use client"

import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import type { SerializedAppointment } from "./appointments-view"
import { formatTime } from "./appointment-card"

// ── Solid bar colours per visit type ─────────────────────────────────────────

const BAR_BG: Record<string, string> = {
  new: "bg-blue-500",
  followup: "bg-purple-500",
  chronic: "bg-orange-400",
  urgent: "bg-red-500",
  walkin: "bg-gray-400",
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Returns true if the Cairo-local date of an ISO string matches dateStr (YYYY-MM-DD). */
function isSameCairoDay(isoString: string, dateStr: string): boolean {
  return (
    new Date(isoString).toLocaleDateString("sv", {
      timeZone: "Africa/Cairo",
    }) === dateStr
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

interface MonthViewProps {
  appointments: SerializedAppointment[]
  /** Any YYYY-MM-DD string within the target month (page always sends the 1st) */
  monthDate: string
  onSelect: (apt: SerializedAppointment) => void
  /** Navigate to day view for the clicked date */
  onDayClick: (dateStr: string) => void
}

export function MonthView({
  appointments,
  monthDate,
  onSelect,
  onDayClick,
}: MonthViewProps) {
  const t = useTranslations("appointments")
  const todayStr = new Date().toLocaleDateString("sv", { timeZone: "Africa/Cairo" })

  const DAY_HEADERS = [
    t("daySun"),
    t("dayMon"),
    t("dayTue"),
    t("dayWed"),
    t("dayThu"),
    t("dayFri"),
    t("daySat"),
  ]

  // ── Calendar math ──────────────────────────────────────────────────────────

  const [y, m] = monthDate.split("-").map(Number)

  const firstDayMs = Date.UTC(y, m - 1, 1)
  const firstDow = new Date(firstDayMs).getUTCDay() // 0 = Sun
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate()
  const prevMonthDays = new Date(Date.UTC(y, m - 1, 0)).getUTCDate()

  type Cell = { dateStr: string; dayNum: number; isCurrentMonth: boolean }
  const cells: Cell[] = []

  // Leading cells from the previous month
  for (let i = firstDow - 1; i >= 0; i--) {
    const day = prevMonthDays - i
    const str = new Date(Date.UTC(y, m - 2, day)).toISOString().slice(0, 10)
    cells.push({ dateStr: str, dayNum: day, isCurrentMonth: false })
  }

  // Current month cells
  for (let day = 1; day <= daysInMonth; day++) {
    const str = new Date(Date.UTC(y, m - 1, day)).toISOString().slice(0, 10)
    cells.push({ dateStr: str, dayNum: day, isCurrentMonth: true })
  }

  // Trailing cells from the next month (fill to complete last row)
  let nextDay = 1
  while (cells.length % 7 !== 0) {
    const str = new Date(Date.UTC(y, m, nextDay)).toISOString().slice(0, 10)
    cells.push({ dateStr: str, dayNum: nextDay, isCurrentMonth: false })
    nextDay++
  }

  const numWeeks = cells.length / 7
  const MAX_VISIBLE = 2

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Day-of-week header ───────────────────────────────────────────── */}
      <div className="grid grid-cols-7 border-b shrink-0">
        {DAY_HEADERS.map((label, i) => (
          <div
            key={i}
            className="py-2 text-center text-[11px] font-medium text-muted-foreground"
          >
            {label}
          </div>
        ))}
      </div>

      {/* ── Calendar grid ────────────────────────────────────────────────── */}
      <div
        className="flex-1 grid grid-cols-7 overflow-y-auto border-l border-t"
        style={{ gridTemplateRows: `repeat(${numWeeks}, minmax(100px, 1fr))` }}
      >
        {cells.map(({ dateStr, dayNum, isCurrentMonth }) => {
          const isToday = dateStr === todayStr
          const dayApts = appointments.filter((a) =>
            isSameCairoDay(a.scheduledAt, dateStr)
          )
          const visible = dayApts.slice(0, MAX_VISIBLE)
          const overflow = dayApts.length - MAX_VISIBLE

          return (
            <div
              key={dateStr}
              onClick={() => onDayClick(dateStr)}
              className={cn(
                "border-r border-b p-1 cursor-pointer transition-colors overflow-hidden",
                "hover:bg-muted/40",
                isToday && "bg-primary/[0.04]",
                !isCurrentMonth && "bg-muted/[0.08]"
              )}
            >
              {/* Date number */}
              <div className="flex items-center justify-center mb-1">
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-medium leading-none",
                    isToday
                      ? "bg-primary text-primary-foreground"
                      : isCurrentMonth
                      ? "text-foreground"
                      : "text-muted-foreground/40"
                  )}
                >
                  {dayNum}
                </span>
              </div>

              {/* Appointment bars */}
              <div className="space-y-0.5">
                {visible.map((apt) => (
                  <button
                    key={apt.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelect(apt)
                    }}
                    className={cn(
                      "w-full rounded text-[10px] px-1 py-0.5 text-white leading-tight",
                      "text-start truncate block",
                      BAR_BG[apt.visitType] ?? "bg-gray-400"
                    )}
                    title={`${apt.patient.name} – ${formatTime(apt.scheduledAt)}`}
                  >
                    {formatTime(apt.scheduledAt)}{" "}
                    <span className="opacity-90">{apt.patient.name}</span>
                  </button>
                ))}

                {overflow > 0 && (
                  <p className="text-[10px] text-muted-foreground ps-0.5 leading-tight">
                    {t("moreAppointments", { count: overflow })}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
