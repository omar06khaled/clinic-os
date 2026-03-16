"use client"

import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Clock } from "lucide-react"
import type { SerializedAppointment } from "./appointments-view"

// ── Shared label / colour maps ────────────────────────────────────────────────

export const VISIT_TYPE_LABELS: Record<string, string> = {
  new: "جديد",
  followup: "متابعة",
  chronic: "مزمن",
  urgent: "طارئ",
  walkin: "بدون موعد",
}

export const VISIT_TYPE_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  followup: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  chronic: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  urgent: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  walkin: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
}

export const STATUS_BORDER: Record<string, string> = {
  scheduled: "border-r-[3px] border-r-blue-400",
  arrived: "border-r-[3px] border-r-green-400",
  noshow: "border-r-[3px] border-r-red-400",
  cancelled: "border-r-[3px] border-r-gray-300 opacity-50",
}

/** Format an ISO string to Cairo local time (UTC+2), 12-hour clock. */
export function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString("en-US", {
    timeZone: "Africa/Cairo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
}

// ── Component ─────────────────────────────────────────────────────────────────

interface AppointmentCardProps {
  apt: SerializedAppointment
  /** Compact mode: used inside week-view columns */
  compact?: boolean
  onClick?: () => void
}

export function AppointmentCard({
  apt,
  compact = false,
  onClick,
}: AppointmentCardProps) {
  const t = useTranslations("appointments")

  const visitTypeLabel: Record<string, string> = {
    new: t("visitTypeNew"),
    followup: t("visitTypeFollowup"),
    chronic: t("visitTypeChronic"),
    urgent: t("visitTypeUrgent"),
    walkin: t("visitTypeWalkin"),
  }

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick?.()}
      className={cn(
        "rounded-lg border bg-card cursor-pointer select-none",
        "transition-colors hover:bg-accent/40 active:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        STATUS_BORDER[apt.status] ?? "border-r-[3px] border-r-border",
        compact ? "p-2" : "p-3"
      )}
      dir="rtl"
    >
      {/* Row 1: name + type badge + status badge */}
      <div className="flex items-start justify-between gap-1 flex-wrap">
        <div className="flex items-center gap-1 flex-wrap min-w-0">
          <span
            className={cn(
              "font-medium truncate max-w-[120px]",
              compact ? "text-[11px]" : "text-sm"
            )}
          >
            {apt.patient.name}
          </span>

          {apt.patient.isNew && (
            <span className="inline-flex shrink-0 items-center rounded-full bg-blue-100 px-1.5 text-[9px] font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
              {t("newPatientBadge")}
            </span>
          )}

          <span
            className={cn(
              "inline-flex shrink-0 items-center rounded-full px-1.5 font-medium",
              compact ? "text-[9px]" : "text-[10px]",
              VISIT_TYPE_COLORS[apt.visitType] ?? "bg-gray-100 text-gray-700"
            )}
          >
            {visitTypeLabel[apt.visitType] ?? apt.visitType}
          </span>
        </div>

        {/* Status pill (non-scheduled) */}
        {apt.status !== "scheduled" && (
          <span
            className={cn(
              "shrink-0 inline-flex items-center rounded-full px-1.5 font-medium",
              compact ? "text-[9px]" : "text-[10px]",
              apt.status === "arrived" &&
                "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
              apt.status === "noshow" &&
                "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
              apt.status === "cancelled" && "bg-gray-100 text-gray-500"
            )}
          >
            {apt.status === "arrived"
              ? t("statusArrived")
              : apt.status === "noshow"
                ? t("statusNoshow")
                : t("statusCancelled")}
          </span>
        )}
      </div>

      {/* Row 2: time + confirm + phone (non-compact) */}
      <div className="flex items-center gap-2 mt-1 flex-wrap">
        <div className="flex items-center gap-0.5">
          <Clock
            className={cn(
              "text-muted-foreground",
              compact ? "h-2.5 w-2.5" : "h-3 w-3"
            )}
          />
          <span
            className={cn(
              "tabular-nums text-muted-foreground",
              compact ? "text-[9px]" : "text-xs"
            )}
          >
            {formatTime(apt.scheduledAt)}
          </span>
        </div>

        {apt.confirmStatus === "confirmed" && (
          <span
            className={cn(
              "text-green-600 font-medium dark:text-green-400",
              compact ? "text-[9px]" : "text-[10px]"
            )}
          >
            {t("statusConfirmed")}
          </span>
        )}

        {!compact && (
          <span className="text-xs text-muted-foreground" dir="ltr">
            {apt.patient.phone}
          </span>
        )}
      </div>

      {/* Row 3: complaint (non-compact) */}
      {!compact && apt.complaint && (
        <p className="text-xs text-muted-foreground mt-1 truncate">
          {apt.complaint}
        </p>
      )}

      {/* Row 4: payment badge (non-compact) */}
      {!compact && apt.paymentStatus === "paid" && apt.amountPaid != null && (
        <span className="inline-flex items-center mt-1 rounded-full bg-green-100 px-1.5 text-[10px] font-medium text-green-700 dark:bg-green-900/40 dark:text-green-300">
          {t("paidBadge", { amount: apt.amountPaid.toLocaleString("en-US") })}
        </span>
      )}
    </div>
  )
}
