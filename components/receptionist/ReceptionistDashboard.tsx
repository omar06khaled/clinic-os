"use client"

import { useState } from "react"
import { CalendarDays, Plus, Clock, UserCheck, UserX } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// ── Types ────────────────────────────────────────────────────────────────────

export type ReceptionistAppointment = {
  id: string
  scheduledAt: string // ISO string
  status: string
  visitType: string
  patientName: string
  doctorName: string
}

type Props = {
  appointments: ReceptionistAppointment[]
  todayLabel: string
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("ar-EG", {
    timeZone: "Africa/Cairo",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const VISIT_TYPE_LABEL: Record<string, string> = {
  new:      "جديد",
  followup: "متابعة",
  chronic:  "مزمن",
  urgent:   "طارئ",
  walkin:   "حضور مباشر",
}

const VISIT_TYPE_CLASS: Record<string, string> = {
  new:      "border-blue-300 text-blue-700 bg-blue-50",
  followup: "border-violet-300 text-violet-700 bg-violet-50",
  chronic:  "border-amber-300 text-amber-700 bg-amber-50",
  urgent:   "border-red-300 text-red-700 bg-red-50",
  walkin:   "border-teal-300 text-teal-700 bg-teal-50",
}

const STATUS_BADGE: Record<string, { label: string; class: string }> = {
  scheduled:  { label: "مجدول",  class: "border-blue-200 text-blue-700 bg-blue-50"       },
  arrived:    { label: "حضر",    class: "border-emerald-200 text-emerald-700 bg-emerald-50" },
  noshow:     { label: "غياب",   class: "border-red-200 text-red-700 bg-red-50"           },
  cancelled:  { label: "ملغي",   class: "border-gray-200 text-gray-600 bg-gray-50"        },
}

// ── Main component ────────────────────────────────────────────────────────────

export function ReceptionistDashboard({ appointments: initialAppts, todayLabel }: Props) {
  const [appointments, setAppointments] = useState(initialAppts)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  async function updateStatus(id: string, status: "arrived" | "noshow") {
    setLoadingId(id)
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        setAppointments((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status } : a))
        )
      }
    } catch {
      // silently fail — status display remains unchanged
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-semibold tracking-tight">مواعيد اليوم</h1>
          <p className="text-sm text-muted-foreground">{todayLabel}</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground shrink-0">
          <CalendarDays className="h-4 w-4" />
          <span>{appointments.length} موعد</span>
        </div>
      </div>

      {/* Appointment table */}
      {appointments.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <CalendarDays className="h-7 w-7 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="text-base font-medium">لا توجد مواعيد اليوم</p>
            <p className="text-sm text-muted-foreground">
              يمكنك إضافة موعد جديد باستخدام الزر أدناه
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-start font-medium text-muted-foreground">الوقت</th>
                  <th className="px-4 py-3 text-start font-medium text-muted-foreground">المريض</th>
                  <th className="px-4 py-3 text-start font-medium text-muted-foreground">الطبيب</th>
                  <th className="px-4 py-3 text-start font-medium text-muted-foreground">نوع الزيارة</th>
                  <th className="px-4 py-3 text-start font-medium text-muted-foreground">الحالة</th>
                  <th className="px-4 py-3 text-start font-medium text-muted-foreground">إجراء</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((appt) => {
                  const statusInfo = STATUS_BADGE[appt.status] ?? STATUS_BADGE.scheduled
                  const typeLabel  = VISIT_TYPE_LABEL[appt.visitType] ?? appt.visitType
                  const typeClass  = VISIT_TYPE_CLASS[appt.visitType] ?? ""
                  const isLoading  = loadingId === appt.id
                  const isDone     = appt.status === "arrived" || appt.status === "noshow" || appt.status === "cancelled"

                  return (
                    <tr
                      key={appt.id}
                      className={cn(
                        "border-b border-border last:border-0 transition-colors",
                        isDone ? "bg-muted/20" : "hover:bg-muted/30"
                      )}
                    >
                      {/* Time */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Clock className="h-3.5 w-3.5 shrink-0" />
                          <span className="font-mono text-xs">{fmtTime(appt.scheduledAt)}</span>
                        </div>
                      </td>

                      {/* Patient */}
                      <td className="px-4 py-3">
                        <span className="font-medium">{appt.patientName}</span>
                      </td>

                      {/* Doctor */}
                      <td className="px-4 py-3">
                        <span className="text-muted-foreground">{appt.doctorName}</span>
                      </td>

                      {/* Visit type */}
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={cn("text-xs", typeClass)}
                        >
                          {typeLabel}
                        </Badge>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={cn("text-xs", statusInfo.class)}
                        >
                          {statusInfo.label}
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        {!isDone ? (
                          <div className="flex items-center gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-xs gap-1 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                              disabled={isLoading}
                              onClick={() => updateStatus(appt.id, "arrived")}
                            >
                              <UserCheck className="h-3.5 w-3.5" />
                              حضر
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-xs gap-1 border-red-300 text-red-700 hover:bg-red-50"
                              disabled={isLoading}
                              onClick={() => updateStatus(appt.id, "noshow")}
                            >
                              <UserX className="h-3.5 w-3.5" />
                              غياب
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Floating Add Appointment button */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 md:bottom-8 md:left-auto md:translate-x-0 md:right-8 z-40">
        <Button
          size="lg"
          className="rounded-full shadow-lg gap-2 pr-5 pl-4"
          onClick={() => window.location.href = "/appointments"}
        >
          <Plus className="h-5 w-5" />
          <span>إضافة موعد</span>
        </Button>
      </div>
    </div>
  )
}
