"use client"

import { CalendarDays, Banknote, TrendingUp, Users, CheckCircle, XCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { AdminOverviewData, AdminAppointmentRow, AdminDoctorStat } from "@/app/api/admin/overview/route"

// ── Helpers ────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString("en-US")
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("ar-EG", {
    timeZone: "Africa/Cairo",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const VISIT_TYPE_LABEL: Record<string, string> = {
  new: "جديد",
  followup: "متابعة",
  chronic: "مزمن",
  urgent: "طارئ",
  walkin: "حضور مباشر",
}

const STATUS_BADGE: Record<string, { label: string; class: string }> = {
  scheduled: { label: "مجدول", class: "bg-blue-50 text-blue-700 border-blue-200" },
  arrived:   { label: "حضر",   class: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  noshow:    { label: "غياب",  class: "bg-red-50 text-red-700 border-red-200" },
  cancelled: { label: "ملغي",  class: "bg-gray-50 text-gray-600 border-gray-200" },
}

// ── Stat card ──────────────────────────────────────────────────────────────

function StatCard({
  title,
  value,
  icon: Icon,
  sub,
  color,
}: {
  title: string
  value: string | number
  icon: React.ElementType
  sub?: string
  color: "blue" | "green" | "amber" | "red"
}) {
  const colorMap = {
    blue:  "text-blue-600 bg-blue-100",
    green: "text-emerald-600 bg-emerald-100",
    amber: "text-amber-600 bg-amber-100",
    red:   "text-red-600 bg-red-100",
  }
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
          </div>
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${colorMap[color]}`}>
            <Icon className="h-4.5 w-4.5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Doctor row ─────────────────────────────────────────────────────────────

function DoctorStatRow({ stat }: { stat: AdminDoctorStat }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <div className="flex items-center gap-3 min-w-0">
        <div className={`h-2 w-2 rounded-full shrink-0 ${stat.isActive ? "bg-emerald-500" : "bg-gray-300"}`} />
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{stat.doctorName}</p>
          {stat.specialty && (
            <p className="text-xs text-muted-foreground">{stat.specialty}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-4 shrink-0 text-start">
        <div className="text-center hidden sm:block">
          <p className="text-sm font-semibold">{stat.appointmentsToday}</p>
          <p className="text-[10px] text-muted-foreground">مواعيد اليوم</p>
        </div>
        <div className="text-center hidden sm:block">
          <p className="text-sm font-semibold text-emerald-600">{stat.arrived}</p>
          <p className="text-[10px] text-muted-foreground">حضر</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold">{fmt(stat.revenueThisMonth)} ج.م</p>
          <p className="text-[10px] text-muted-foreground">الشهر</p>
        </div>
      </div>
    </div>
  )
}

// ── Appointment row ────────────────────────────────────────────────────────

function ApptRow({ appt }: { appt: AdminAppointmentRow }) {
  const badge = STATUS_BADGE[appt.status] ?? STATUS_BADGE.scheduled
  return (
    <tr className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
      <td className="py-2.5 px-3 text-sm text-muted-foreground tabular-nums">
        {fmtTime(appt.scheduledAt)}
      </td>
      <td className="py-2.5 px-3 text-sm font-medium">{appt.patientName}</td>
      <td className="py-2.5 px-3 text-sm text-muted-foreground">{appt.doctorName}</td>
      <td className="py-2.5 px-3 text-xs text-muted-foreground hidden sm:table-cell">
        {VISIT_TYPE_LABEL[appt.visitType] ?? appt.visitType}
      </td>
      <td className="py-2.5 px-3">
        <Badge variant="outline" className={`text-xs ${badge.class}`}>
          {badge.label}
        </Badge>
      </td>
      <td className="py-2.5 px-3 text-sm text-end tabular-nums">
        {appt.paymentStatus === "paid" && appt.amountPaid != null
          ? `${fmt(appt.amountPaid)} ج.م`
          : <span className="text-muted-foreground">—</span>}
      </td>
    </tr>
  )
}

// ── Main component ─────────────────────────────────────────────────────────

export function AdminOverview({ data }: { data: AdminOverviewData }) {
  const todayLabel = new Date().toLocaleDateString("ar-EG", {
    timeZone: "Africa/Cairo",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const { today, month, doctors, todayAppointments } = data

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">نظرة عامة على العيادة</h1>
          <Badge variant="outline" className="text-xs border-amber-500/40 text-amber-600 bg-amber-50 dark:bg-amber-950/20">
            مدير
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{todayLabel}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="مواعيد اليوم"
          value={today.totalAppointments}
          icon={CalendarDays}
          color="blue"
          sub={`${today.arrived} حضر · ${today.noshow} غاب`}
        />
        <StatCard
          title="تحصيلات اليوم"
          value={`${fmt(today.revenueToday)} ج.م`}
          icon={Banknote}
          color="green"
        />
        <StatCard
          title="إيرادات الشهر"
          value={`${fmt(month.totalRevenue)} ج.م`}
          icon={TrendingUp}
          color="blue"
          sub={`مصروفات: ${fmt(month.totalExpenses)} ج.م`}
        />
        <StatCard
          title="صافي الربح"
          value={`${fmt(month.netProfit)} ج.م`}
          icon={TrendingUp}
          color={month.netProfit >= 0 ? "green" : "red"}
          sub="هذا الشهر"
        />
      </div>

      {/* Doctors + Today's schedule side by side on large screens */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Doctor stats */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              الأطباء النشطون
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {doctors.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">لا يوجد أطباء</p>
            ) : (
              doctors.map((stat) => <DoctorStatRow key={stat.doctorId} stat={stat} />)
            )}
          </CardContent>
        </Card>

        {/* Today's appointments table */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              مواعيد اليوم — جميع الأطباء
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0 overflow-x-auto">
            {todayAppointments.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">لا توجد مواعيد اليوم</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="py-2 px-3 text-start text-xs font-medium text-muted-foreground">الوقت</th>
                    <th className="py-2 px-3 text-start text-xs font-medium text-muted-foreground">المريض</th>
                    <th className="py-2 px-3 text-start text-xs font-medium text-muted-foreground">الطبيب</th>
                    <th className="py-2 px-3 text-right text-xs font-medium text-muted-foreground hidden sm:table-cell">النوع</th>
                    <th className="py-2 px-3 text-start text-xs font-medium text-muted-foreground">الحالة</th>
                    <th className="py-2 px-3 text-start text-xs font-medium text-muted-foreground">المبلغ</th>
                  </tr>
                </thead>
                <tbody>
                  {todayAppointments.map((a) => (
                    <ApptRow key={a.id} appt={a} />
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Admin note */}
      <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-50 dark:bg-amber-950/20 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
        <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" />
        <span>
          الملاحظات السريرية والتشخيصات والوصفات الطبية متاحة للأطباء فقط.
          هذه اللوحة تعرض البيانات الإدارية والمالية فقط.
        </span>
      </div>
    </div>
  )
}
