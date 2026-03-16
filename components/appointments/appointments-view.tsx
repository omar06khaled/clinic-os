"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from "lucide-react"

import { DayView } from "./day-view"
import { WeekView } from "./week-view"
import { AppointmentDetailPanel } from "./appointment-detail-panel"
import { AddAppointmentDialog } from "./add-appointment-dialog"

// ── Shared type (also imported by page.tsx and sub-components) ────────────────

export type SerializedAppointment = {
  id: string
  scheduledAt: string // ISO
  visitType: string
  status: string
  paymentStatus: string
  paymentMethod: string | null
  amountPaid: number | null
  confirmStatus: string
  complaint: string | null
  notes: string | null
  patient: {
    id: string
    name: string
    phone: string
    isNew: boolean
  }
}

// ── Date helpers ──────────────────────────────────────────────────────────────

function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number)
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10)
}

function getWeekSunday(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number)
  const ms = Date.UTC(y, m - 1, d)
  const dow = new Date(ms).getUTCDay() // 0 = Sun
  return new Date(ms - dow * 86_400_000).toISOString().slice(0, 10)
}

function formatDayLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number)
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("ar-EG", {
    timeZone: "UTC",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function formatWeekLabel(weekSunday: string): string {
  const [sy, sm, sd] = weekSunday.split("-").map(Number)
  const satStr = addDays(weekSunday, 6)
  const [ey, em, ed] = satStr.split("-").map(Number)

  const start = new Date(Date.UTC(sy, sm - 1, sd)).toLocaleDateString("ar-EG", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
  })
  const end = new Date(Date.UTC(ey, em - 1, ed)).toLocaleDateString("ar-EG", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
    year: "numeric",
  })
  return `${start} – ${end}`
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface AppointmentsViewProps {
  appointments: SerializedAppointment[]
  initialView: "day" | "week"
  initialDate: string // YYYY-MM-DD
  defaultFee: number
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AppointmentsView({
  appointments,
  initialView,
  initialDate,
  defaultFee,
}: AppointmentsViewProps) {
  const router = useRouter()
  const t = useTranslations("appointments")
  const [isPending, startTransition] = useTransition()

  // Local state for optimistic navigation feedback
  const [view, setView] = useState<"day" | "week">(initialView)
  const [date, setDate] = useState(initialDate)

  // UI state
  const [selectedApt, setSelectedApt] = useState<SerializedAppointment | null>(null)
  const [addOpen, setAddOpen] = useState(false)

  const todayStr = new Date().toLocaleDateString("sv", { timeZone: "Africa/Cairo" })

  // ── Navigation ──────────────────────────────────────────────────────────

  function navigate(newView: "day" | "week", newDate: string) {
    setView(newView)
    setDate(newDate)
    setSelectedApt(null)
    startTransition(() => {
      router.push(`/appointments?view=${newView}&date=${newDate}`)
    })
  }

  function handlePrev() {
    if (view === "day") {
      navigate("day", addDays(date, -1))
    } else {
      navigate("week", addDays(getWeekSunday(date), -7))
    }
  }

  function handleNext() {
    if (view === "day") {
      navigate("day", addDays(date, 1))
    } else {
      navigate("week", addDays(getWeekSunday(date), 7))
    }
  }

  function handleToday() {
    navigate(view, todayStr)
  }

  function handleToggleView(newView: "day" | "week") {
    // When switching to week, anchor to the week containing the current date
    const anchor = newView === "week" ? getWeekSunday(date) : date
    navigate(newView, anchor)
  }

  // ── Labels ──────────────────────────────────────────────────────────────

  const weekSunday = getWeekSunday(date)
  const label =
    view === "day" ? formatDayLabel(date) : formatWeekLabel(weekSunday)
  const isToday = view === "day" && date === todayStr

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full">

      {/* ── Sticky header bar ─────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b bg-background px-4 py-3 flex-wrap gap-y-2">

        {/* Title + current date label */}
        <div className="flex items-center gap-2 min-w-0">
          <CalendarDays className="h-5 w-5 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold leading-tight">{t("pageTitle")}</h1>
              {isToday && (
                <span className="shrink-0 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                  {t("todayBadge")}
                </span>
              )}
            </div>
            <p className="truncate text-xs text-muted-foreground">{label}</p>
          </div>
        </div>

        {/* Prev / Today / Next */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={handlePrev}
            disabled={isPending}
            aria-label={t("prevAriaLabel")}
          >
            {/* ChevronRight navigates "back" in RTL */}
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-3 text-xs"
            onClick={handleToday}
            disabled={isPending}
          >
            {t("todayButton")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={handleNext}
            disabled={isPending}
            aria-label={t("nextAriaLabel")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>

        {/* Day / Week toggle */}
        <div className="flex items-center rounded-md border bg-muted/30 p-0.5">
          {(["day", "week"] as const).map((v) => (
            <button
              key={v}
              onClick={() => handleToggleView(v)}
              className={cn(
                "rounded px-3 py-1 text-xs font-medium transition-colors",
                view === v
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {v === "day" ? t("viewDay") : t("viewWeek")}
            </button>
          ))}
        </div>
      </div>

      {/* ── Appointment count summary strip ───────────────────────────── */}
      {appointments.length > 0 && (
        <div
          className="flex items-center gap-3 border-b bg-muted/20 px-4 py-1.5 text-xs text-muted-foreground"
        >
          <span>{t("countAppointments", { count: appointments.length })}</span>
          {(() => {
            const arrived = appointments.filter((a) => a.status === "arrived").length
            const scheduled = appointments.filter((a) => a.status === "scheduled").length
            const noshow = appointments.filter((a) => a.status === "noshow").length
            return (
              <>
                {arrived > 0 && (
                  <span className="text-green-600 dark:text-green-400">
                    {t("countArrived", { count: arrived })}
                  </span>
                )}
                {scheduled > 0 && <span>{t("countUpcoming", { count: scheduled })}</span>}
                {noshow > 0 && (
                  <span className="text-red-500">{t("countNoshow", { count: noshow })}</span>
                )}
              </>
            )
          })()}
        </div>
      )}

      {/* ── Main content ──────────────────────────────────────────────── */}
      <div
        className={cn(
          "flex-1 overflow-y-auto",
          isPending && "pointer-events-none opacity-60"
        )}
      >
        {view === "day" ? (
          <DayView
            appointments={appointments}
            date={date}
            onSelect={setSelectedApt}
          />
        ) : (
          <WeekView
            appointments={appointments}
            weekStartDate={weekSunday}
            onSelect={setSelectedApt}
          />
        )}
      </div>

      {/* ── Floating + Add Appointment button ─────────────────────────── */}
      <button
        onClick={() => setAddOpen(true)}
        aria-label={t("addAriaLabel")}
        className={cn(
          "fixed z-30 flex h-14 w-14 items-center justify-center rounded-full",
          "bg-primary text-primary-foreground shadow-lg",
          "hover:bg-primary/90 active:scale-95 transition-all",
          // Above mobile bottom bar (pb-16), normal on desktop
          "bottom-20 left-4 md:bottom-6 md:left-6"
        )}
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* ── Detail side panel ─────────────────────────────────────────── */}
      {selectedApt && (
        <AppointmentDetailPanel
          apt={selectedApt}
          defaultFee={defaultFee}
          onClose={() => setSelectedApt(null)}
        />
      )}

      {/* ── Add appointment dialog ────────────────────────────────────── */}
      <AddAppointmentDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        defaultDate={date}
      />
    </div>
  )
}
