import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { prisma } from "@/lib/prisma"

export type AdminDoctorStat = {
  doctorId: string
  doctorName: string
  specialty: string | null
  isActive: boolean
  appointmentsToday: number
  arrived: number
  revenueThisMonth: number
}

export type AdminAppointmentRow = {
  id: string
  scheduledAt: string
  status: string
  paymentStatus: string
  amountPaid: number | null
  visitType: string
  patientName: string
  doctorName: string
}

export type AdminOverviewData = {
  today: {
    totalAppointments: number
    arrived: number
    noshow: number
    revenueToday: number
  }
  month: {
    totalRevenue: number
    totalExpenses: number
    netProfit: number
  }
  doctors: AdminDoctorStat[]
  todayAppointments: AdminAppointmentRow[]
}

export async function GET() {
  // ── Auth — admin only ──────────────────────────────────────────────────────
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const admin = await prisma.doctor.findUnique({
    where: { email: user.email },
    select: { id: true, clinicId: true, role: true },
  })

  if (!admin) return NextResponse.json({ error: "Doctor not found" }, { status: 403 })
  if (admin.role !== "admin" && admin.role !== "owner")
    return NextResponse.json({ error: "Admin role required" }, { status: 403 })

  // ── Date boundaries (Cairo = UTC+2) ───────────────────────────────────────
  const cairoDateStr = new Date().toLocaleDateString("sv", {
    timeZone: "Africa/Cairo",
  })
  const cairoMonthStr = cairoDateStr.slice(0, 7)
  const [cairoYear, cairoMonth] = cairoMonthStr.split("-").map(Number)
  const lastDay = new Date(cairoYear, cairoMonth, 0).getDate()

  const todayStart = new Date(`${cairoDateStr}T00:00:00+02:00`)
  const todayEnd = new Date(`${cairoDateStr}T23:59:59+02:00`)
  const monthStart = new Date(`${cairoMonthStr}-01T00:00:00+02:00`)
  const monthEnd = new Date(
    `${cairoMonthStr}-${String(lastDay).padStart(2, "0")}T23:59:59+02:00`
  )

  // ── All doctors in the clinic ──────────────────────────────────────────────
  const allDoctors = await prisma.doctor.findMany({
    where: { clinicId: admin.clinicId },
    select: { id: true, name: true, specialty: true, isActive: true },
    orderBy: { createdAt: "asc" },
  })

  const doctorIds = allDoctors.map((d) => d.id)

  // ── Parallel data fetch ────────────────────────────────────────────────────
  const [todayAppts, monthRevAgg, monthExpAgg] = await Promise.all([
    // All today's appointments across the clinic (no VisitRecord data)
    prisma.appointment.findMany({
      where: {
        doctorId: { in: doctorIds },
        scheduledAt: { gte: todayStart, lte: todayEnd },
      },
      select: {
        id: true,
        doctorId: true,
        scheduledAt: true,
        status: true,
        paymentStatus: true,
        amountPaid: true,
        visitType: true,
        patient: { select: { name: true } },
        // NOTE: deliberately NOT including `record` — admin must not see VisitRecord
      },
      orderBy: { scheduledAt: "asc" },
    }),

    // Combined revenue this month
    prisma.appointment.aggregate({
      where: {
        doctorId: { in: doctorIds },
        scheduledAt: { gte: monthStart, lte: monthEnd },
        paymentStatus: "paid",
      },
      _sum: { amountPaid: true },
    }),

    // Combined expenses this month
    prisma.expense.aggregate({
      where: {
        clinicId: admin.clinicId,
        date: { gte: monthStart, lte: monthEnd },
      },
      _sum: { amountEGP: true },
    }),
  ])

  // ── Per-doctor stats ───────────────────────────────────────────────────────
  const doctorNameMap = new Map(allDoctors.map((d) => [d.id, d.name]))

  const doctorStats: AdminDoctorStat[] = allDoctors.map((d) => {
    const doctorAppts = todayAppts.filter((a) => a.doctorId === d.id)
    return {
      doctorId: d.id,
      doctorName: d.name,
      specialty: d.specialty,
      isActive: d.isActive,
      appointmentsToday: doctorAppts.length,
      arrived: doctorAppts.filter((a) => a.status === "arrived").length,
      revenueThisMonth: 0, // filled below
    }
  })

  // Per-doctor month revenue
  const monthRevenueByDoctor = await prisma.appointment.groupBy({
    by: ["doctorId"],
    where: {
      doctorId: { in: doctorIds },
      scheduledAt: { gte: monthStart, lte: monthEnd },
      paymentStatus: "paid",
    },
    _sum: { amountPaid: true },
  })

  for (const row of monthRevenueByDoctor) {
    const stat = doctorStats.find((s) => s.doctorId === row.doctorId)
    if (stat) stat.revenueThisMonth = row._sum.amountPaid ?? 0
  }

  // ── Aggregate today totals ─────────────────────────────────────────────────
  const totalRevToday = todayAppts
    .filter((a) => a.paymentStatus === "paid")
    .reduce((s, a) => s + (a.amountPaid ?? 0), 0)

  const totalMonthRev = monthRevAgg._sum.amountPaid ?? 0
  const totalMonthExp = monthExpAgg._sum.amountEGP ?? 0

  // ── Serialize appointments (no VisitRecord fields) ────────────────────────
  const serialized: AdminAppointmentRow[] = todayAppts.map((a) => ({
    id: a.id,
    scheduledAt: a.scheduledAt.toISOString(),
    status: a.status,
    paymentStatus: a.paymentStatus,
    amountPaid: a.amountPaid,
    visitType: a.visitType,
    patientName: a.patient.name,
    doctorName: doctorNameMap.get(a.doctorId) ?? "—",
  }))

  const response: AdminOverviewData = {
    today: {
      totalAppointments: todayAppts.length,
      arrived: todayAppts.filter((a) => a.status === "arrived").length,
      noshow: todayAppts.filter((a) => a.status === "noshow").length,
      revenueToday: totalRevToday,
    },
    month: {
      totalRevenue: totalMonthRev,
      totalExpenses: totalMonthExp,
      netProfit: totalMonthRev - totalMonthExp,
    },
    doctors: doctorStats,
    todayAppointments: serialized,
  }

  return NextResponse.json(response)
}
