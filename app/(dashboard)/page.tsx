import { redirect } from "next/navigation"
import { CalendarDays, UserX, Banknote, TrendingUp } from "lucide-react"
import { getTranslations, getLocale } from "next-intl/server"
import { createClient } from "@/lib/supabase-server"
import { prisma } from "@/lib/prisma"
import { StatCard } from "@/components/dashboard/stat-card"
import { TodayTimeline, type SerializedAppointment } from "@/components/dashboard/today-timeline"
import { QuickActionsBar } from "@/components/dashboard/quick-actions-bar"
import { HealthScoreCard } from "@/components/dashboard/health-score-card"
import { AdminOverview } from "@/components/admin/AdminOverview"
import { ReceptionistDashboard, type ReceptionistAppointment } from "@/components/receptionist/ReceptionistDashboard"
import type { AdminOverviewData } from "@/app/api/admin/overview/route"

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.email) redirect("/login")

  const doctor = await prisma.doctor.findUnique({
    where: { email: user.email },
    select: { id: true, name: true, clinicId: true, role: true },
  })
  if (!doctor) redirect("/login?error=not_provisioned")

  const locale = await getLocale()
  const dateLocale = locale === "ar" ? "ar-EG" : "en-US"

  // ── Admin path — clinic-wide overview, no clinical records ────────────────
  if (doctor.role === "admin") {
    const cairoDateStr = new Date().toLocaleDateString("sv", { timeZone: "Africa/Cairo" })
    const cairoMonthStr = cairoDateStr.slice(0, 7)
    const [cairoYear, cairoMonth] = cairoMonthStr.split("-").map(Number)
    const lastDay = new Date(cairoYear, cairoMonth, 0).getDate()

    const todayStart = new Date(`${cairoDateStr}T00:00:00+02:00`)
    const todayEnd   = new Date(`${cairoDateStr}T23:59:59+02:00`)
    const monthStart = new Date(`${cairoMonthStr}-01T00:00:00+02:00`)
    const monthEnd   = new Date(
      `${cairoMonthStr}-${String(lastDay).padStart(2, "0")}T23:59:59+02:00`
    )

    const allDoctors = await prisma.doctor.findMany({
      where: { clinicId: doctor.clinicId },
      select: { id: true, name: true, specialty: true, isActive: true },
      orderBy: { createdAt: "asc" },
    })
    const doctorIds = allDoctors.map((d) => d.id)

    const [todayAppts, monthRevAgg, monthExpAgg, monthRevByDoctor] = await Promise.all([
      prisma.appointment.findMany({
        where: {
          doctorId: { in: doctorIds },
          scheduledAt: { gte: todayStart, lte: todayEnd },
        },
        select: {
          id: true, doctorId: true, scheduledAt: true, status: true,
          paymentStatus: true, amountPaid: true, visitType: true,
          patient: { select: { name: true } },
        },
        orderBy: { scheduledAt: "asc" },
      }),
      prisma.appointment.aggregate({
        where: {
          doctorId: { in: doctorIds },
          scheduledAt: { gte: monthStart, lte: monthEnd },
          paymentStatus: "paid",
        },
        _sum: { amountPaid: true },
      }),
      prisma.expense.aggregate({
        where: { clinicId: doctor.clinicId, date: { gte: monthStart, lte: monthEnd } },
        _sum: { amountEGP: true },
      }),
      prisma.appointment.groupBy({
        by: ["doctorId"],
        where: {
          doctorId: { in: doctorIds },
          scheduledAt: { gte: monthStart, lte: monthEnd },
          paymentStatus: "paid",
        },
        _sum: { amountPaid: true },
      }),
    ])

    const doctorNameMap = new Map(allDoctors.map((d) => [d.id, d.name]))
    const revenueMap   = new Map(monthRevByDoctor.map((r) => [r.doctorId, r._sum.amountPaid ?? 0]))
    const totalRevToday = todayAppts
      .filter((a) => a.paymentStatus === "paid")
      .reduce((s, a) => s + (a.amountPaid ?? 0), 0)

    const adminData: AdminOverviewData = {
      today: {
        totalAppointments: todayAppts.length,
        arrived: todayAppts.filter((a) => a.status === "arrived").length,
        noshow:  todayAppts.filter((a) => a.status === "noshow").length,
        revenueToday: totalRevToday,
      },
      month: {
        totalRevenue:   monthRevAgg._sum.amountPaid ?? 0,
        totalExpenses:  monthExpAgg._sum.amountEGP  ?? 0,
        netProfit:     (monthRevAgg._sum.amountPaid ?? 0) - (monthExpAgg._sum.amountEGP ?? 0),
      },
      doctors: allDoctors.map((d) => {
        const appts = todayAppts.filter((a) => a.doctorId === d.id)
        return {
          doctorId: d.id,
          doctorName: d.name,
          specialty: d.specialty,
          isActive: d.isActive,
          appointmentsToday: appts.length,
          arrived: appts.filter((a) => a.status === "arrived").length,
          revenueThisMonth: revenueMap.get(d.id) ?? 0,
        }
      }),
      todayAppointments: todayAppts.map((a) => ({
        id: a.id,
        scheduledAt: a.scheduledAt.toISOString(),
        status: a.status,
        paymentStatus: a.paymentStatus,
        amountPaid: a.amountPaid,
        visitType: a.visitType,
        patientName: a.patient.name,
        doctorName: doctorNameMap.get(a.doctorId) ?? "—",
      })),
    }

    return <AdminOverview data={adminData} />
  }

  // ── Receptionist path — all doctors' today appointments, no financial data ─
  if (doctor.role === "receptionist") {
    const cairoDateStr = new Date().toLocaleDateString("sv", { timeZone: "Africa/Cairo" })
    const todayStart = new Date(`${cairoDateStr}T00:00:00+02:00`)
    const todayEnd   = new Date(`${cairoDateStr}T23:59:59+02:00`)

    const allDoctors = await prisma.doctor.findMany({
      where: { clinicId: doctor.clinicId },
      select: { id: true, name: true },
      orderBy: { createdAt: "asc" },
    })
    const doctorIds = allDoctors.map((d) => d.id)
    const doctorNameMap = new Map(allDoctors.map((d) => [d.id, d.name]))

    const todayAppts = await prisma.appointment.findMany({
      where: {
        doctorId: { in: doctorIds },
        scheduledAt: { gte: todayStart, lte: todayEnd },
      },
      select: {
        id: true,
        scheduledAt: true,
        status: true,
        visitType: true,
        doctorId: true,
        patient: { select: { name: true } },
      },
      orderBy: { scheduledAt: "asc" },
    })

    const receptionistAppts: ReceptionistAppointment[] = todayAppts.map((a) => ({
      id: a.id,
      scheduledAt: a.scheduledAt.toISOString(),
      status: a.status,
      visitType: a.visitType,
      patientName: a.patient.name,
      doctorName: doctorNameMap.get(a.doctorId) ?? "—",
    }))

    const todayLabel = new Date().toLocaleDateString(dateLocale, {
      timeZone: "Africa/Cairo",
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })

    return <ReceptionistDashboard appointments={receptionistAppts} todayLabel={todayLabel} />
  }

  // ── Doctor path — single-doctor dashboard ─────────────────────────────────

  const t = await getTranslations("dashboard")

  const cairoDateStr = new Date().toLocaleDateString("sv", {
    timeZone: "Africa/Cairo",
  })
  const cairoMonthStr = cairoDateStr.slice(0, 7)
  const [cairoYear, cairoMonth] = cairoMonthStr.split("-").map(Number)

  const todayStart = new Date(`${cairoDateStr}T00:00:00+02:00`)
  const todayEnd = new Date(`${cairoDateStr}T23:59:59+02:00`)

  const lastDayOfMonth = new Date(cairoYear, cairoMonth, 0).getDate()
  const monthStart = new Date(`${cairoMonthStr}-01T00:00:00+02:00`)
  const monthEnd = new Date(
    `${cairoMonthStr}-${String(lastDayOfMonth).padStart(2, "0")}T23:59:59+02:00`
  )

  const [
    todayAppointments,
    clinic,
    noshowsPreventedCount,
    outstandingCount,
    monthRevenue,
    monthExpenses,
  ] = await Promise.all([
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

    prisma.clinic.findUnique({
      where: { id: doctor.clinicId },
      select: { defaultFee: true },
    }),

    prisma.appointment.count({
      where: {
        doctorId: doctor.id,
        scheduledAt: { gte: monthStart, lte: monthEnd },
        confirmStatus: "confirmed",
        status: "arrived",
      },
    }),

    prisma.appointment.count({
      where: {
        doctorId: doctor.id,
        status: "arrived",
        paymentStatus: "pending",
      },
    }),

    prisma.appointment.aggregate({
      where: {
        doctorId: doctor.id,
        scheduledAt: { gte: monthStart, lte: monthEnd },
        paymentStatus: "paid",
      },
      _sum: { amountPaid: true },
    }),

    prisma.expense.aggregate({
      where: {
        clinicId: doctor.clinicId,
        date: { gte: monthStart, lte: monthEnd },
      },
      _sum: { amountEGP: true },
    }),
  ])

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

  const firstName = doctor.name.split(" ")[0]
  const todayLabel = new Date().toLocaleDateString(dateLocale, {
    timeZone: "Africa/Cairo",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

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
      <div className="flex flex-col gap-0.5">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("greeting", { name: firstName })}
        </h1>
        <p className="text-sm text-muted-foreground">{todayLabel}</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t("appointmentsToday")}
          value={todayAppointments.length}
          icon={CalendarDays}
          color="blue"
          sub={t("arrivedSub", { arrived: arrivedToday, noshow: noshowToday })}
        />
        <StatCard
          title={t("noshowsPrevented")}
          value={noshowsPreventedCount}
          icon={UserX}
          color="green"
          sub={t("noshowsPreventedSub")}
        />
        <StatCard
          title={t("outstandingPayments")}
          value={`${outstandingEGP.toLocaleString("en-US")} ج.م`}
          icon={Banknote}
          color="amber"
          sub={t("outstandingPatientsSub", { count: outstandingCount })}
        />
        <StatCard
          title={t("netProfit")}
          value={`${netProfitThisMonth.toLocaleString("en-US")} ج.م`}
          icon={TrendingUp}
          color={netProfitThisMonth >= 0 ? "green" : "red"}
          sub={t("thisMonth")}
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
