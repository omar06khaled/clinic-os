import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { prisma } from "@/lib/prisma"

// ─── Shared types ─────────────────────────────────────────────────────────────

export type PLSummary = {
  totalRevenue: number
  totalExpenses: number
  netProfit: number
  profitMargin: number // 0-100 with one decimal
  cashPosition: number
}

export type PLBarPoint = {
  month: string  // YYYY-MM
  label: string  // Arabic short label
  revenue: number
  expenses: number
}

export type PLApiResponse = {
  month: string
  clinicName: string
  doctorName: string
  doctorSpecialty: string | null
  summary: PLSummary
  expensesByCategory: Record<string, number>
  barChart: PLBarPoint[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function monthRange(y: number, m: number): { gte: Date; lte: Date } {
  return {
    gte: new Date(`${y}-${String(m).padStart(2, "0")}-01T00:00:00+02:00`),
    lte: new Date(Date.UTC(y, m, 0, 21, 59, 59)),
  }
}

// Handles delta up to ±11
function shiftMonth(y: number, m: number, delta: number): [number, number] {
  const total = m + delta
  if (total < 1) return [y - 1, total + 12]
  if (total > 12) return [y + 1, total - 12]
  return [y, total]
}

// Handles arbitrary positive delta — advances n months from (y, m)
function addMonths(y: number, m: number, n: number): [number, number] {
  const total = y * 12 + (m - 1) + n
  return [Math.floor(total / 12), (total % 12) + 1]
}

// Return YYYY-MM for a UTC Date in Cairo time (+2)
function toCairoMonthKey(d: Date): string {
  const cairoMs = d.getTime() + 2 * 3_600_000
  const c = new Date(cairoMs)
  const cy = c.getUTCFullYear()
  const cm = String(c.getUTCMonth() + 1).padStart(2, "0")
  return `${cy}-${cm}`
}

const EXPENSE_CATEGORIES = [
  "rent",
  "utilities",
  "supplies",
  "salary",
  "equipment",
  "other",
]

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.email)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const doctor = await prisma.doctor.findUnique({
    where: { email: user.email },
    select: {
      id: true,
      clinicId: true,
      name: true,
      specialty: true,
      clinic: { select: { name: true } },
    },
  })
  if (!doctor)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  // ── Parse month param (default: current Cairo month) ──────────────────────
  let y: number, m: number
  const monthParam = req.nextUrl.searchParams.get("month")
  if (monthParam) {
    ;[y, m] = monthParam.split("-").map(Number)
  } else {
    const cairoNow = new Date(
      new Date().toLocaleDateString("sv", { timeZone: "Africa/Cairo" })
    )
    y = cairoNow.getFullYear()
    m = cairoNow.getMonth() + 1
  }

  const selectedMonthKey = `${y}-${String(m).padStart(2, "0")}`

  // ── Bar chart window — driven by barFrom/barTo or barMonths param ──────────
  const barFromParam = req.nextUrl.searchParams.get("barFrom") // YYYY-MM-DD
  const barToParam = req.nextUrl.searchParams.get("barTo")     // YYYY-MM-DD
  const barMonthsParam = req.nextUrl.searchParams.get("barMonths") ?? "6"

  let barStartY: number, barStartM: number
  let barEndY: number, barEndM: number
  let barCount: number

  if (barFromParam && barToParam) {
    ;[barStartY, barStartM] = barFromParam.slice(0, 7).split("-").map(Number)
    ;[barEndY, barEndM] = barToParam.slice(0, 7).split("-").map(Number)
    barCount = Math.max(1, (barEndY - barStartY) * 12 + (barEndM - barStartM) + 1)
  } else if (barMonthsParam === "ytd") {
    barStartY = y; barStartM = 1
    barEndY = y;   barEndM = m
    barCount = m
  } else if (barMonthsParam === "12") {
    ;[barStartY, barStartM] = shiftMonth(y, m, -11)
    barEndY = y; barEndM = m
    barCount = 12
  } else {
    ;[barStartY, barStartM] = shiftMonth(y, m, -5)
    barEndY = y; barEndM = m
    barCount = 6
  }

  const windowStart = new Date(
    `${barStartY}-${String(barStartM).padStart(2, "0")}-01T00:00:00+02:00`
  )
  const windowEnd = new Date(Date.UTC(barEndY, barEndM, 0, 21, 59, 59))

  // ── Parallel data fetches ─────────────────────────────────────────────────
  const [monthAppts, monthExpenses, barAppts, barExpenses] = await Promise.all([
    // Selected month: paid + arrived appointments (revenue)
    prisma.appointment.findMany({
      where: {
        doctorId: doctor.id,
        scheduledAt: monthRange(y, m),
        status: "arrived",
        paymentStatus: "paid",
      },
      select: { amountPaid: true, convenienceFee: true },
    }),
    // Selected month: all expenses
    prisma.expense.findMany({
      where: {
        clinicId: doctor.clinicId,
        date: monthRange(y, m),
      },
      select: { category: true, amountEGP: true, isPaid: true },
    }),
    // 6-month window: appointments for bar chart
    prisma.appointment.findMany({
      where: {
        doctorId: doctor.id,
        scheduledAt: { gte: windowStart, lte: windowEnd },
        status: "arrived",
        paymentStatus: "paid",
      },
      select: { amountPaid: true, convenienceFee: true, scheduledAt: true },
    }),
    // 6-month window: expenses for bar chart
    prisma.expense.findMany({
      where: {
        clinicId: doctor.clinicId,
        date: { gte: windowStart, lte: windowEnd },
      },
      select: { amountEGP: true, date: true },
    }),
  ])

  // ── Summary calculations ──────────────────────────────────────────────────
  const totalRevenue = monthAppts.reduce(
    (s, a) => s + (a.amountPaid ?? 0) + a.convenienceFee,
    0
  )
  const totalExpenses = monthExpenses.reduce((s, e) => s + e.amountEGP, 0)
  const paidExpenses = monthExpenses
    .filter((e) => e.isPaid)
    .reduce((s, e) => s + e.amountEGP, 0)
  const netProfit = totalRevenue - totalExpenses
  const profitMargin =
    totalRevenue > 0
      ? Math.round((netProfit / totalRevenue) * 1000) / 10
      : 0
  const cashPosition = totalRevenue - paidExpenses

  // ── Expenses by category ──────────────────────────────────────────────────
  const expensesByCategory: Record<string, number> = {}
  for (const cat of EXPENSE_CATEGORIES) expensesByCategory[cat] = 0
  for (const e of monthExpenses) {
    const cat = EXPENSE_CATEGORIES.includes(e.category) ? e.category : "other"
    expensesByCategory[cat] += e.amountEGP
  }

  // ── Bar chart ─────────────────────────────────────────────────────────────
  const barChart: PLBarPoint[] = Array.from({ length: barCount }, (_, i) => {
    const [my, mm] = addMonths(barStartY, barStartM, i)
    const key = `${my}-${String(mm).padStart(2, "0")}`
    const label = new Date(Date.UTC(my, mm - 1, 15)).toLocaleDateString(
      "ar-EG",
      { month: "short", year: "2-digit" }
    )
    const revenue = barAppts
      .filter((a) => toCairoMonthKey(a.scheduledAt) === key)
      .reduce((s, a) => s + (a.amountPaid ?? 0) + a.convenienceFee, 0)
    const expenses = barExpenses
      .filter((e) => toCairoMonthKey(e.date) === key)
      .reduce((s, e) => s + e.amountEGP, 0)
    return { month: key, label, revenue, expenses }
  })

  const response: PLApiResponse = {
    month: selectedMonthKey,
    clinicName: doctor.clinic.name,
    doctorName: doctor.name,
    doctorSpecialty: doctor.specialty,
    summary: {
      totalRevenue,
      totalExpenses,
      netProfit,
      profitMargin,
      cashPosition,
    },
    expensesByCategory,
    barChart,
  }

  return NextResponse.json(response)
}
