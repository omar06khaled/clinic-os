"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { RecordPaymentDialog } from "./record-payment-dialog"
import { markArrived, markNoShow } from "@/app/(dashboard)/actions"
import {
  CheckCircle2,
  XCircle,
  Banknote,
  FileText,
  Clock,
  User,
  CalendarX,
} from "lucide-react"

export type SerializedAppointment = {
  id: string
  scheduledAt: string // ISO string
  visitType: string
  status: string
  paymentStatus: string
  paymentMethod: string | null
  amountPaid: number | null
  confirmStatus: string
  complaint: string | null
  patient: {
    id: string
    name: string
    phone: string
    isNew: boolean
  }
}

interface TodayTimelineProps {
  appointments: SerializedAppointment[]
  defaultFee: number
}

const VISIT_TYPE_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  followup: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  chronic: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  urgent: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  walkin: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
}

const CARD_BORDER: Record<string, string> = {
  scheduled: "border-l-4 border-l-blue-400",
  arrived: "border-l-4 border-l-green-400",
  noshow: "border-l-4 border-l-red-400",
  cancelled: "border-l-4 border-l-gray-300",
}

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
}

interface AppointmentCardProps {
  apt: SerializedAppointment
  defaultFee: number
}

function AppointmentCard({ apt, defaultFee }: AppointmentCardProps) {
  const router = useRouter()
  const t = useTranslations("dashboard")
  const [isPending, startTransition] = useTransition()
  const [pendingAction, setPendingAction] = useState<"arrived" | "noshow" | null>(null)
  const [paymentOpen, setPaymentOpen] = useState(false)

  function handleMarkArrived() {
    setPendingAction("arrived")
    startTransition(async () => {
      await markArrived(apt.id)
      setPendingAction(null)
    })
  }

  function handleMarkNoShow() {
    setPendingAction("noshow")
    startTransition(async () => {
      await markNoShow(apt.id)
      setPendingAction(null)
    })
  }

  // Visit type label map (resolved at render time)
  const visitTypeLabel: Record<string, string> = {
    new: t("visitTypeNew"),
    followup: t("visitTypeFollowup"),
    chronic: t("visitTypeChronic"),
    urgent: t("visitTypeUrgent"),
    walkin: t("visitTypeWalkin"),
  }

  return (
    <>
      <div
        className={cn(
          "rounded-lg border bg-card p-4 transition-opacity",
          CARD_BORDER[apt.status] ?? "border-l-4 border-l-border",
          isPending && "opacity-60"
        )}
      >
        <div className="flex items-start justify-between gap-3 flex-wrap">
          {/* Patient info */}
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
              <User className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              {/* Name + badges */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold text-sm">{apt.patient.name}</span>
                {apt.patient.isNew && (
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-1.5 py-0 text-[10px] font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                    {t("newPatientBadge")}
                  </span>
                )}
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-1.5 py-0 text-[10px] font-medium",
                    VISIT_TYPE_COLORS[apt.visitType] ?? "bg-gray-100 text-gray-700"
                  )}
                >
                  {visitTypeLabel[apt.visitType] ?? apt.visitType}
                </span>
              </div>

              {/* Complaint */}
              {apt.complaint && (
                <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[220px]">
                  {apt.complaint}
                </p>
              )}

              {/* Time + confirm */}
              <div className="flex items-center gap-1.5 mt-1">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground tabular-nums">
                  {formatTime(apt.scheduledAt)}
                </span>
                {apt.confirmStatus === "confirmed" && (
                  <span className="text-[10px] text-green-600 font-medium dark:text-green-400">
                    {t("confirmedBadge")}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right side: status + actions */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            {/* Status badge (non-scheduled) */}
            {apt.status !== "scheduled" && (
              <Badge
                variant="outline"
                className={cn("text-xs", {
                  "border-green-400 text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-950/20":
                    apt.status === "arrived",
                  "border-red-400 text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-950/20":
                    apt.status === "noshow",
                  "border-gray-300 text-gray-500": apt.status === "cancelled",
                })}
              >
                {apt.status === "arrived"
                  ? t("statusArrived")
                  : apt.status === "noshow"
                    ? t("statusNoshow")
                    : apt.status === "cancelled"
                      ? t("statusCancelled")
                      : apt.status}
              </Badge>
            )}

            {/* Payment badge */}
            {apt.status === "arrived" && apt.paymentStatus === "paid" && (
              <Badge
                variant="outline"
                className="text-xs border-green-400 text-green-700 dark:text-green-400"
              >
                {apt.amountPaid != null
                  ? t("paidBadge", { amount: apt.amountPaid.toLocaleString("en-US") })
                  : t("paidSimple")}
              </Badge>
            )}

            {/* Action buttons */}
            <div className="flex gap-1.5 flex-wrap justify-end">
              {/* Scheduled: mark arrived / noshow */}
              {apt.status === "scheduled" && (
                <>
                  <Button
                    size="sm"
                    className="h-7 text-xs px-2.5 gap-1"
                    disabled={isPending}
                    onClick={handleMarkArrived}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {pendingAction === "arrived" ? "..." : t("markArrived")}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs px-2.5 gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                    disabled={isPending}
                    onClick={handleMarkNoShow}
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    {pendingAction === "noshow" ? "..." : t("markNoShow")}
                  </Button>
                </>
              )}

              {/* Arrived + pending payment: record payment */}
              {apt.status === "arrived" && apt.paymentStatus === "pending" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs px-2.5 gap-1 text-amber-700 hover:text-amber-800 hover:bg-amber-50 border-amber-300"
                  onClick={() => setPaymentOpen(true)}
                >
                  <Banknote className="h-3.5 w-3.5" />
                  {t("recordPaymentAction")}
                </Button>
              )}

              {/* Open record — always visible for non-cancelled */}
              {apt.status !== "cancelled" && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs px-2.5 gap-1"
                  onClick={() => router.push(`/patients/${apt.patient.id}`)}
                >
                  <FileText className="h-3.5 w-3.5" />
                  {t("openRecord")}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <RecordPaymentDialog
        appointmentId={apt.id}
        patientName={apt.patient.name}
        defaultAmount={defaultFee}
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
      />
    </>
  )
}

export function TodayTimeline({ appointments, defaultFee }: TodayTimelineProps) {
  const t = useTranslations("dashboard")

  if (appointments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            {t("todayTimeline")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-14 gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <CalendarX className="h-6 w-6 text-muted-foreground/50" />
            </div>
            <p className="text-sm text-muted-foreground">
              {t("noAppointments")}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const scheduled = appointments.filter((a) => a.status === "scheduled").length
  const arrived = appointments.filter((a) => a.status === "arrived").length
  const noshow = appointments.filter((a) => a.status === "noshow").length

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            {t("todayTimelineCount", { count: appointments.length })}
          </CardTitle>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {arrived > 0 && (
              <span className="text-green-600">
                {t("arrivedCount", { count: arrived })}
              </span>
            )}
            {scheduled > 0 && (
              <span>{t("upcomingCount", { count: scheduled })}</span>
            )}
            {noshow > 0 && (
              <span className="text-red-500">
                {t("noshowCount", { count: noshow })}
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {appointments.map((apt) => (
            <AppointmentCard key={apt.id} apt={apt} defaultFee={defaultFee} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
