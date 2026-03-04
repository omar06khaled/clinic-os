import { redirect } from "next/navigation"
import { CalendarDays, UserX, Banknote, TrendingUp } from "lucide-react"
import { createClient } from "@/lib/supabase-server"
import { prisma } from "@/lib/prisma"
import { StatCard } from "@/components/dashboard/stat-card"
import { TodayTimeline, type SerializedAppointment } from "@/components/dashboard/today-timeline"
import { QuickActionsBar } from "@/components/dashboard/quick-actions-bar"
import { HealthScoreCard } from "@/components/dashboard/health-score-card"

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.email) redirect("/login")

  const doctor = await prisma.doctor.findUnique({
    where: { email: user.email },
    select: { id: true, name: true, clinicId: true },
  })
  if (!doctor) redirect("/login?error=not_provisioned")

  // ── Date boundaries in Cairo time (Egypt = UTC+2, no DST since 2011) ──────
  const cairoDateStr = new Date().toLocaleDateString("sv", {
    timeZone: "Africa/Cairo",
  }) // "YYYY-MM-DD"
  const cairoMonthStr = cairoDateStr.slice(0, 7) // "YYYY-MM"
  const [cairoYear, cairoMonth] = cairoMonthStr.split("-").map(Number)

  const todayStart = new Date(`${cairoDateStr}T00:00:00+02:00`)
  const todayEnd = new Date(`${cairoDateStr}T23:59:59+02:00`)

  const lastDayOfMonth = new Date(cairoYear, cairoMonth, 0).getDate()
  const monthStart = new Date(`${cairoMonthStr}-01T00:00:00+02:00`)
  const monthEnd = new Date(
    `${cairoMonthStr}-${String(lastDayOfMonth).padStart(2, "0")}T23:59:59+02:00`
  )

  // ── Parallel data fetching ─────────────────────────────────────────────────
  const [
    todayAppointments,
    clinic,
    noshowsPreventedCount,
    outstandingCount,
    monthRevenue,
    monthExpenses,
  ] = await Promise.all([
    // Today's appointments (9am–9pm window is visual; query full day)
    prisma.appointment.findMany({
      where: {
        doctorId: doctor.id,
        scheduledAt: { gte: todayStart, lte: todayEnd },
      },
      include: {
        patient: {
          select: { id: true, name: true, phone: true, isNew: true },
        },
      },
      orderBy: { scheduledAt: "asc" },
    }),

    // Clinic defaultFee for outstanding calculation
    prisma.clinic.findUnique({
      where: { id: doctor.clinicId },
      select: { defaultFee: true },
    }),

    // No-shows prevented: confirmed appointments this month that arrived
    prisma.appointment.count({
      where: {
        doctorId: doctor.id,
        scheduledAt: { gte: monthStart, lte: monthEnd },
        confirmStatus: "confirmed",
        status: "arrived",
      },
    }),

    // All outstanding: arrived but payment still pending
    prisma.appointment.count({
      where: {
        doctorId: doctor.id,
        status: "arrived",
        paymentStatus: "pending",
      },
    }),

    // Revenue this month (sum of amountPaid where paid)
    prisma.appointment.aggregate({
      where: {
        doctorId: doctor.id,
        scheduledAt: { gte: monthStart, lte: monthEnd },
        paymentStatus: "paid",
      },
      _sum: { amountPaid: true },
    }),

    // Expenses this month
    prisma.expense.aggregate({
      where: {
        clinicId: doctor.clinicId,
        date: { gte: monthStart, lte: monthEnd },
      },
      _sum: { amountEGP: true },
    }),
  ])

  // ── Derived values ─────────────────────────────────────────────────────────
  const defaultFee = clinic?.defaultFee ?? 250
  const outstandingEGP = outstandingCount * defaultFee

  const arrivedToday = todayAppointments.filter((a) => a.status === "arrived").length
  const noshowToday = todayAppointments.filter((a) => a.status === "noshow").length
  const paidToday = todayAppointments.filter((a) => a.paymentStatus === "paid").length
  const pendingArrivedToday = todayAppointments.filter(
    (a) => a.status === "arrived" && a.paymentStatus === "pending"
  ).length

  const revenueThisMonth = monthRevenue._sum.amountPaid ?? 0
  const expensesThisMonth = monthExpenses._sum.amountEGP ?? 0
  const netProfitThisMonth = revenueThisMonth - expensesThisMonth

  // ── Health score (0–100) ───────────────────────────────────────────────────
  const total = todayAppointments.length
  const fillRate = total > 0 ? (arrivedToday / total) * 100 : 0
  const paymentRate =
    paidToday + pendingArrivedToday > 0
      ? (paidToday / (paidToday + pendingArrivedToday)) * 100
      : 100
  const noshowRate = total > 0 ? (noshowToday / total) * 100 : 0
  const healthScore = Math.round(
    fillRate * 0.4 + paymentRate * 0.4 + (100 - noshowRate) * 0.2
  )

  // ── Greeting ───────────────────────────────────────────────────────────────
  const firstName = doctor.name.split(" ")[0]
  const todayLabel = new Date().toLocaleDateString("ar-EG", {
    timeZone: "Africa/Cairo",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  // ── Serialize dates for Client Components ─────────────────────────────────
  const serializedAppointments: SerializedAppointment[] = todayAppointments.map((a) => ({
    id: a.id,
    scheduledAt: a.scheduledAt.toISOString(),
    visitType: a.visitType,
    status: a.status,
    paymentStatus: a.paymentStatus,
    paymentMethod: a.paymentMethod,
    amountPaid: a.amountPaid,
    confirmStatus: a.confirmStatus,
    complaint: a.complaint,
    patient: {
      id: a.patient.id,
      name: a.patient.name,
      phone: a.patient.phone,
      isNew: a.patient.isNew,
    },
  }))

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-0.5" dir="rtl">
        <h1 className="text-2xl font-semibold tracking-tight">
          مرحباً، د. {firstName}
        </h1>
        <p className="text-sm text-muted-foreground">{todayLabel}</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="مواعيد اليوم"
          value={todayAppointments.length}
          icon={CalendarDays}
          color="blue"
          sub={`${arrivedToday} حضر · ${noshowToday} غاب`}
        />
        <StatCard
          title="غياب تم تفاديه"
          value={noshowsPreventedCount}
          icon={UserX}
          color="green"
          sub="هذا الشهر عبر الواتساب"
        />
        <StatCard
          title="مدفوعات معلقة"
          value={`${outstandingEGP.toLocaleString("en-US")} ج.م`}
          icon={Banknote}
          color="amber"
          sub={`${outstandingCount} مريض`}
        />
        <StatCard
          title="صافي الربح"
          value={`${netProfitThisMonth.toLocaleString("en-US")} ج.م`}
          icon={TrendingUp}
          color={netProfitThisMonth >= 0 ? "green" : "red"}
          sub="هذا الشهر"
        />
      </div>

      {/* Quick Actions */}
      <QuickActionsBar />

      {/* Timeline + Health Score */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2">
          <TodayTimeline
            appointments={serializedAppointments}
            defaultFee={defaultFee}
          />
        </div>
        <div>
          <HealthScoreCard
            score={healthScore}
            fillRate={fillRate}
            paymentRate={paymentRate}
            noshowRate={noshowRate}
          />
        </div>
      </div>
    </div>
  )
}
