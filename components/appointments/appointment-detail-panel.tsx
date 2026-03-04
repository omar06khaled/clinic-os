"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
  X,
  CheckCircle2,
  XCircle,
  CalendarClock,
  Ban,
  FileText,
  MessageCircle,
  Banknote,
  Clock,
  Phone,
  User,
} from "lucide-react"
import {
  apptMarkArrived,
  apptMarkNoShow,
  apptCancel,
  apptReschedule,
  apptRecordPayment,
} from "@/app/(dashboard)/appointments/actions"
import type { SerializedAppointment } from "./appointments-view"
import {
  VISIT_TYPE_LABELS,
  VISIT_TYPE_COLORS,
  formatTime,
} from "./appointment-card"

// ── Helpers ───────────────────────────────────────────────────────────────────

function getCairoDateStr(iso: string) {
  return new Date(iso).toLocaleDateString("sv", { timeZone: "Africa/Cairo" })
}

function getCairoTimeStr(iso: string) {
  // Returns "HH:mm" in 24h Cairo time
  return new Date(iso).toLocaleTimeString("en-US", {
    timeZone: "Africa/Cairo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
}

function buildWhatsAppUrl(phone: string, name: string) {
  const digits = phone.replace(/\D/g, "").replace(/^0/, "20")
  const msg = encodeURIComponent(
    `مرحباً ${name}، نذكركم بموعدكم الطبي المقرر. نتطلع لرؤيتكم. شكراً.`
  )
  return `https://wa.me/${digits}?text=${msg}`
}

// ── Label maps ────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  scheduled: "مجدول",
  arrived: "حضر",
  noshow: "لم يحضر",
  cancelled: "ملغي",
}

const STATUS_COLOR: Record<string, string> = {
  scheduled:
    "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-300 dark:border-blue-800",
  arrived:
    "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-300 dark:border-green-800",
  noshow:
    "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-300 dark:border-red-800",
  cancelled: "bg-gray-50 text-gray-500 border-gray-200",
}

// ── Component ─────────────────────────────────────────────────────────────────

interface AppointmentDetailPanelProps {
  apt: SerializedAppointment
  defaultFee: number
  onClose: () => void
}

export function AppointmentDetailPanel({
  apt,
  defaultFee,
  onClose,
}: AppointmentDetailPanelProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [pendingAction, setPendingAction] = useState<string | null>(null)
  const [showReschedule, setShowReschedule] = useState(false)
  const [showPayment, setShowPayment] = useState(false)

  // Reschedule state – pre-filled with the appointment's Cairo local time
  const [newDate, setNewDate] = useState(getCairoDateStr(apt.scheduledAt))
  const [newTime, setNewTime] = useState(getCairoTimeStr(apt.scheduledAt))

  // Payment state
  const [payAmount, setPayAmount] = useState(String(defaultFee))
  const [payMethod, setPayMethod] = useState("cash")

  function run(action: string, fn: () => Promise<void>) {
    setPendingAction(action)
    startTransition(async () => {
      await fn()
      setPendingAction(null)
      onClose()
    })
  }

  function toggleReschedule() {
    setShowReschedule((v) => !v)
    setShowPayment(false)
  }

  function togglePayment() {
    setShowPayment((v) => !v)
    setShowReschedule(false)
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over panel — right side */}
      <div
        className="fixed top-0 right-0 z-50 flex h-full w-full max-w-md flex-col bg-background shadow-2xl border-l"
        dir="rtl"
        role="dialog"
        aria-modal="true"
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
              <User className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{apt.patient.name}</p>
              <p className="text-xs text-muted-foreground" dir="ltr">
                {apt.patient.phone}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 p-1.5 rounded-md hover:bg-muted transition-colors"
            aria-label="إغلاق"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Scrollable body ──────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">

          {/* Status + type badges */}
          <div className="flex flex-wrap gap-2">
            <span
              className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                STATUS_COLOR[apt.status] ?? "bg-gray-50 text-gray-500 border-gray-200"
              )}
            >
              {STATUS_LABEL[apt.status] ?? apt.status}
            </span>
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                VISIT_TYPE_COLORS[apt.visitType] ?? "bg-gray-100 text-gray-700"
              )}
            >
              {VISIT_TYPE_LABELS[apt.visitType] ?? apt.visitType}
            </span>
            {apt.confirmStatus === "confirmed" && (
              <span className="inline-flex items-center rounded-full border border-teal-200 bg-teal-50 px-2.5 py-0.5 text-xs font-medium text-teal-700 dark:bg-teal-950/20 dark:text-teal-300 dark:border-teal-800">
                مؤكد
              </span>
            )}
            {apt.patient.isNew && (
              <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-950/20 dark:text-blue-300 dark:border-blue-800">
                مريض جديد
              </span>
            )}
          </div>

          {/* Detail rows */}
          <div className="rounded-lg border bg-muted/20 divide-y text-sm">
            <div className="flex items-center gap-2 px-3 py-2.5">
              <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">الوقت</span>
              <span className="mr-auto tabular-nums font-medium">
                {formatTime(apt.scheduledAt)}
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2.5">
              <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">الهاتف</span>
              <span className="mr-auto font-medium tabular-nums" dir="ltr">
                {apt.patient.phone}
              </span>
            </div>
            {apt.complaint && (
              <div className="flex items-start gap-2 px-3 py-2.5">
                <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                <span className="text-muted-foreground shrink-0">الشكوى</span>
                <span className="mr-auto font-medium text-right">{apt.complaint}</span>
              </div>
            )}
            {apt.notes && (
              <div className="flex items-start gap-2 px-3 py-2.5">
                <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                <span className="text-muted-foreground shrink-0">ملاحظات</span>
                <span className="mr-auto font-medium text-right">{apt.notes}</span>
              </div>
            )}
            <div className="flex items-center gap-2 px-3 py-2.5">
              <Banknote className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">الدفع</span>
              <span
                className={cn("mr-auto font-medium", {
                  "text-green-600 dark:text-green-400":
                    apt.paymentStatus === "paid",
                  "text-amber-600 dark:text-amber-400":
                    apt.paymentStatus === "pending",
                  "text-gray-400": apt.paymentStatus === "waived",
                })}
              >
                {apt.paymentStatus === "paid"
                  ? `مدفوع · ${apt.amountPaid?.toLocaleString("en-US") ?? ""} ج.م`
                  : apt.paymentStatus === "waived"
                    ? "معفي"
                    : "معلق"}
              </span>
            </div>
          </div>

          {/* ── Reschedule inline form ──────────────────────────────────── */}
          {showReschedule && (
            <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 space-y-3 dark:border-amber-800 dark:bg-amber-950/10">
              <p className="text-xs font-medium text-amber-800 dark:text-amber-300">
                تحديد موعد جديد
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">التاريخ</Label>
                  <Input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="h-8 text-xs"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">الوقت</Label>
                  <Input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="h-8 text-xs"
                    dir="ltr"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="h-8 text-xs flex-1"
                  disabled={isPending}
                  onClick={() =>
                    run("reschedule", () =>
                      apptReschedule(apt.id, `${newDate}T${newTime}:00+02:00`)
                    )
                  }
                >
                  {pendingAction === "reschedule" ? "جاري..." : "تأكيد التعديل"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs"
                  onClick={() => setShowReschedule(false)}
                >
                  إلغاء
                </Button>
              </div>
            </div>
          )}

          {/* ── Record payment inline form ──────────────────────────────── */}
          {showPayment && (
            <div className="rounded-lg border border-green-200 bg-green-50/50 p-3 space-y-3 dark:border-green-800 dark:bg-green-950/10">
              <p className="text-xs font-medium text-green-800 dark:text-green-300">
                تسجيل دفعة
              </p>
              <div className="space-y-2">
                <div className="space-y-1">
                  <Label className="text-xs">المبلغ (ج.م)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="h-8 text-xs"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">طريقة الدفع</Label>
                  <Select value={payMethod} onValueChange={setPayMethod}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">كاش</SelectItem>
                      <SelectItem value="instapay">إنستاباي</SelectItem>
                      <SelectItem value="fawry">فوري</SelectItem>
                      <SelectItem value="insurance">تأمين</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="h-8 text-xs flex-1"
                  disabled={isPending}
                  onClick={() => {
                    const parsed = parseInt(payAmount, 10)
                    if (isNaN(parsed) || parsed < 0) return
                    run("payment", () => apptRecordPayment(apt.id, parsed, payMethod))
                  }}
                >
                  {pendingAction === "payment" ? "جاري..." : "تأكيد الدفع"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs"
                  onClick={() => setShowPayment(false)}
                >
                  إلغاء
                </Button>
              </div>
            </div>
          )}

          {/* ── Action buttons ──────────────────────────────────────────── */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">الإجراءات</p>

            <div className="grid grid-cols-2 gap-2">
              {/* Mark Arrived */}
              {apt.status === "scheduled" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 text-xs gap-1.5 border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800 dark:text-green-400 dark:border-green-800"
                  disabled={isPending}
                  onClick={() => run("arrived", () => apptMarkArrived(apt.id))}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {pendingAction === "arrived" ? "..." : "سجّل حضور"}
                </Button>
              )}

              {/* Mark No-show */}
              {apt.status === "scheduled" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 text-xs gap-1.5 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                  disabled={isPending}
                  onClick={() => run("noshow", () => apptMarkNoShow(apt.id))}
                >
                  <XCircle className="h-3.5 w-3.5" />
                  {pendingAction === "noshow" ? "..." : "لم يحضر"}
                </Button>
              )}

              {/* Record Payment */}
              {apt.status === "arrived" && apt.paymentStatus === "pending" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 text-xs gap-1.5 border-amber-200 text-amber-700 hover:bg-amber-50"
                  onClick={togglePayment}
                >
                  <Banknote className="h-3.5 w-3.5" />
                  تسجيل دفعة
                </Button>
              )}

              {/* Reschedule */}
              {(apt.status === "scheduled" || apt.status === "noshow") && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 text-xs gap-1.5"
                  onClick={toggleReschedule}
                >
                  <CalendarClock className="h-3.5 w-3.5" />
                  تعديل الموعد
                </Button>
              )}

              {/* Cancel */}
              {apt.status === "scheduled" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 text-xs gap-1.5 border-red-200 text-red-600 hover:bg-red-50"
                  disabled={isPending}
                  onClick={() => run("cancel", () => apptCancel(apt.id))}
                >
                  <Ban className="h-3.5 w-3.5" />
                  {pendingAction === "cancel" ? "..." : "إلغاء الموعد"}
                </Button>
              )}

              {/* Open Clinical Record */}
              <Button
                variant="outline"
                size="sm"
                className="h-9 text-xs gap-1.5"
                onClick={() => {
                  router.push(`/patients/${apt.patient.id}`)
                  onClose()
                }}
              >
                <FileText className="h-3.5 w-3.5" />
                الملف الطبي
              </Button>

              {/* WhatsApp Reminder */}
              <a
                href={buildWhatsAppUrl(apt.patient.phone, apt.patient.name)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 h-9 rounded-md border px-3 text-xs font-medium transition-colors border-green-200 text-green-700 hover:bg-green-50 dark:text-green-400 dark:border-green-800"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                تذكير واتساب
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
