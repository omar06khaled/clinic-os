import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { prisma } from "@/lib/prisma"

// ─── Shared types ─────────────────────────────────────────────────────────────

export type RevenueRow = {
  id: string
  patientName: string
  patientId: string
  scheduledAt: string
  amountPaid: number | null
  paymentMethod: string | null
  convenienceFee: number
  paymentStatus: string
  status: string
}

export type RevenueStats = {
  totalRevenue: number
  totalAppointments: number
  collectionRate: number
  outstandingReceivables: number
}

export type ChartPoint = {
  label: string
  revenue: number
  convenienceFee: number
  compareRevenue?: number
  compareConvenienceFee?: number
}

export type RevenueApiResponse = {
  defaultFee: number
  primary: {
    stats: RevenueStats
    prevStats: RevenueStats
    rows: RevenueRow[]
    chartData: ChartPoint[]
  }
  compare?: {
    stats: RevenueStats
  }
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

type ApptLite = {
  scheduledAt: Date
  status: string
  paymentStatus: string
  amountPaid: number | null
  convenienceFee: number
}

function computeStats(appts: ApptLite[], defaultFee: number): RevenueStats {
  const arrived = appts.filter((a) => a.status === "arrived")
  const paid = arrived.filter((a) => a.paymentStatus === "paid")
  const totalRevenue = paid.reduce(
    (s, a) => s + (a.amountPaid ?? 0) + a.convenienceFee,
    0
  )
  const collectionRate =
    arrived.length > 0
      ? Math.round((paid.length / arrived.length) * 1000) / 10
      : 0
  const outstandingReceivables = arrived
    .filter((a) => a.paymentStatus === "pending")
    .reduce(
      (s, a) =>
        s + Math.max(0, defaultFee + a.convenienceFee - (a.amountPaid ?? 0)),
      0
    )
  return {
    totalRevenue,
    totalAppointments: arrived.length,
    collectionRate,
    outstandingReceivables,
  }
}

// Return Cairo local [YYYY-MM-DD, hour(0-23)] for a UTC Date
function toCairoDateHour(d: Date): [string, number] {
  const cairoMs = d.getTime() + 2 * 3_600_000
  const c = new Date(cairoMs)
  const y = c.getUTCFullYear()
  const mo = String(c.getUTCMonth() + 1).padStart(2, "0")
  const day = String(c.getUTCDate()).padStart(2, "0")
  return [`${y}-${mo}-${day}`, c.getUTCHours()]
}

const ARABIC_DAYS = [
  "الأحد",
  "الاثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
]
const ARABIC_NUMS = ["١", "٢", "٣", "٤"]

function generateChartData(
  period: string,
  from: string,
  to: string,
  appts: ApptLite[]
): Array<{ label: string; revenue: number; convenienceFee: number }> {
  const paid = appts.filter(
    (a) => a.status === "arrived" && a.paymentStatus === "paid"
  )

  if (period === "day") {
    // 13 hourly buckets: 9am (hour 9) … 9pm (hour 21)
    return Array.from({ length: 13 }, (_, i) => {
      const h = i + 9
      const slotAppts = paid.filter((a) => {
        const [, hour] = toCairoDateHour(a.scheduledAt)
        return hour === h
      })
      const suffix = h < 12 ? "ص" : "م"
      const display = h <= 12 ? h : h - 12
      return {
        label: `${display}${suffix}`,
        revenue: slotAppts.reduce((s, a) => s + (a.amountPaid ?? 0), 0),
        convenienceFee: slotAppts.reduce((s, a) => s + a.convenienceFee, 0),
      }
    })
  }

  if (period === "week") {
    const [fy, fm, fd] = from.split("-").map(Number)
    const baseMs = Date.UTC(fy, fm - 1, fd)
    return Array.from({ length: 7 }, (_, i) => {
      const dayMs = baseMs + i * 86_400_000
      const dayStr = new Date(dayMs).toISOString().slice(0, 10)
      const dow = new Date(dayMs).getUTCDay()
      const slotAppts = paid.filter((a) => {
        const [dateStr] = toCairoDateHour(a.scheduledAt)
        return dateStr === dayStr
      })
      return {
        label: ARABIC_DAYS[dow],
        revenue: slotAppts.reduce((s, a) => s + (a.amountPaid ?? 0), 0),
        convenienceFee: slotAppts.reduce((s, a) => s + a.convenienceFee, 0),
      }
    })
  }

  // month: up to 4 weekly buckets
  const [fy, fm, fd] = from.split("-").map(Number)
  const [ty, tm, td] = to.split("-").map(Number)
  const fromMs = Date.UTC(fy, fm - 1, fd)
  const toMs = Date.UTC(ty, tm - 1, td) + 86_399_999
  const totalDays = Math.ceil((toMs - fromMs + 1) / 86_400_000)
  const weeksCount = Math.min(4, Math.ceil(totalDays / 7))

  return Array.from({ length: weeksCount }, (_, wi) => {
    const weekFromMs = fromMs + wi * 7 * 86_400_000
    const weekToMs = Math.min(weekFromMs + 7 * 86_400_000 - 1, toMs)
    const slotAppts = paid.filter((a) => {
      const cairoMs = a.scheduledAt.getTime() + 2 * 3_600_000
      return cairoMs >= weekFromMs && cairoMs <= weekToMs
    })
    return {
      label: `الأسبوع ${ARABIC_NUMS[wi]}`,
      revenue: slotAppts.reduce((s, a) => s + (a.amountPaid ?? 0), 0),
      convenienceFee: slotAppts.reduce((s, a) => s + a.convenienceFee, 0),
    }
  })
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.email)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const doctor = await prisma.doctor.findUnique({
    where: { email: user.email },
    select: { id: true, clinicId: true },
  })
  if (!doctor)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const sp = req.nextUrl.searchParams
  const from = sp.get("from")
  const to = sp.get("to")
  const period = sp.get("period") ?? "day"
  const compareFrom = sp.get("compareFrom")
  const compareTo = sp.get("compareTo")

  if (!from || !to)
    return NextResponse.json({ error: "from and to required" }, { status: 400 })

  const clinic = await prisma.clinic.findUnique({
    where: { id: doctor.clinicId },
    select: { defaultFee: true },
  })
  const defaultFee = clinic?.defaultFee ?? 250

  const rangeStart = new Date(`${from}T00:00:00+02:00`)
  const rangeEnd = new Date(`${to}T23:59:59+02:00`)

  // Previous period: same span length shifted back by 1 full span
  const spanMs = rangeEnd.getTime() - rangeStart.getTime() + 1000
  const prevRangeEnd = new Date(rangeStart.getTime() - 1000)
  const prevRangeStart = new Date(prevRangeEnd.getTime() - spanMs + 1000)

  const [primaryRaw, prevRaw, compareRaw] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        doctorId: doctor.id,
        scheduledAt: { gte: rangeStart, lte: rangeEnd },
        status: { notIn: ["cancelled", "noshow"] },
      },
      include: { patient: { select: { id: true, name: true } } },
      orderBy: { scheduledAt: "asc" },
    }),
    prisma.appointment.findMany({
      where: {
        doctorId: doctor.id,
        scheduledAt: { gte: prevRangeStart, lte: prevRangeEnd },
        status: { notIn: ["cancelled", "noshow"] },
      },
      select: {
        status: true,
        paymentStatus: true,
        amountPaid: true,
        convenienceFee: true,
        scheduledAt: true,
      },
    }),
    compareFrom && compareTo
      ? prisma.appointment.findMany({
          where: {
            doctorId: doctor.id,
            scheduledAt: {
              gte: new Date(`${compareFrom}T00:00:00+02:00`),
              lte: new Date(`${compareTo}T23:59:59+02:00`),
            },
            status: { notIn: ["cancelled", "noshow"] },
          },
          include: { patient: { select: { id: true, name: true } } },
          orderBy: { scheduledAt: "asc" },
        })
      : Promise.resolve(null),
  ])

  const primaryStats = computeStats(primaryRaw, defaultFee)
  const prevStats = computeStats(prevRaw, defaultFee)
  const compareStats = compareRaw
    ? computeStats(compareRaw, defaultFee)
    : undefined

  const rows: RevenueRow[] = primaryRaw.map((a) => ({
    id: a.id,
    patientName: a.patient.name,
    patientId: a.patient.id,
    scheduledAt: a.scheduledAt.toISOString(),
    amountPaid: a.amountPaid,
    paymentMethod: a.paymentMethod,
    convenienceFee: a.convenienceFee,
    paymentStatus: a.paymentStatus,
    status: a.status,
  }))

  const primaryChart = generateChartData(period, from, to, primaryRaw)
  const compareChart =
    compareRaw && compareFrom && compareTo
      ? generateChartData(period, compareFrom, compareTo, compareRaw)
      : null

  const chartData: ChartPoint[] = primaryChart.map((pt, i) => ({
    ...pt,
    ...(compareChart
      ? {
          compareRevenue: compareChart[i]?.revenue ?? 0,
          compareConvenienceFee: compareChart[i]?.convenienceFee ?? 0,
        }
      : {}),
  }))

  const response: RevenueApiResponse = {
    defaultFee,
    primary: {
      stats: primaryStats,
      prevStats,
      rows,
      chartData,
    },
    ...(compareStats && { compare: { stats: compareStats } }),
  }

  return NextResponse.json(response)
}
