import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { prisma } from "@/lib/prisma"

// ─── Shared types ─────────────────────────────────────────────────────────────

export type ExpenseRow = {
  id: string
  clinicId: string
  category: string
  description: string
  vendorName: string | null
  amountEGP: number
  date: string
  isRecurring: boolean
  staffName: string | null
  staffRole: string | null
  isPaid: boolean
  usefulLifeMonths: number | null
  receiptUrl: string | null
  receiptName: string | null
  createdAt: string
}

export type ExpensesApiResponse = {
  expenses: ExpenseRow[]
  stats: {
    thisMonthTotal: number
    lastMonthTotal: number
  }
}

// ─── Auth helper ──────────────────────────────────────────────────────────────

async function getDoctor() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.email) return null

  const doctor = await prisma.doctor.findUnique({
    where: { email: user.email },
    select: { id: true, clinicId: true },
  })
  return doctor
}

// ─── GET ─────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const doctor = await getDoctor()
  if (!doctor)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const sp = req.nextUrl.searchParams
  const category = sp.get("category") // rent|utilities|supplies|salary|equipment|other|outstanding|all
  const month = sp.get("month") // YYYY-MM

  // ── Build date range for the requested month ─────────────────────────────
  let monthDateFilter: { gte: Date; lte: Date } | null = null
  if (month) {
    const [y, m] = month.split("-").map(Number)
    monthDateFilter = {
      gte: new Date(`${y}-${String(m).padStart(2, "0")}-01T00:00:00+02:00`),
      lte: new Date(Date.UTC(y, m, 0, 21, 59, 59)), // last ms of month in UTC (= 23:59:59 Cairo)
    }
  }

  // ── Build where clause ───────────────────────────────────────────────────
  const isOutstanding = category === "outstanding"
  const categoryFilter =
    category && category !== "all" && category !== "outstanding"
      ? category
      : undefined

  interface WhereClause {
    clinicId: string
    isPaid?: boolean
    category?: string
    date?: { gte: Date; lte: Date }
  }

  const where: WhereClause = { clinicId: doctor.clinicId }

  if (isOutstanding) {
    where.isPaid = false
    if (categoryFilter) where.category = categoryFilter
    // no date filter — show all unpaid across all time
  } else {
    if (categoryFilter) where.category = categoryFilter
    // Bug 1 fix: only filter by date range — removed { isRecurring: true } OR clause
    // which was pulling all historical recurring entries into every month view
    if (monthDateFilter) {
      where.date = monthDateFilter
    }
  }

  // ── Fetch expenses ───────────────────────────────────────────────────────
  const expenses = await prisma.expense.findMany({
    where,
    orderBy: { date: "desc" },
  })

  // ── Compute stats for the selected month (Bug 2 fix) ──────────────────────
  // Use the ?month= param if provided; otherwise fall back to the current Cairo month.
  let statsYear: number
  let statsMonth: number

  if (month) {
    const [y, m] = month.split("-").map(Number)
    statsYear = y
    statsMonth = m
  } else {
    const now = new Date()
    const cairoNow = new Date(
      now.toLocaleDateString("sv", { timeZone: "Africa/Cairo" })
    )
    statsYear = cairoNow.getFullYear()
    statsMonth = cairoNow.getMonth() + 1
  }

  const prevYear = statsMonth === 1 ? statsYear - 1 : statsYear
  const prevMonth = statsMonth === 1 ? 12 : statsMonth - 1

  const [thisMonthRows, lastMonthRows] = await Promise.all([
    prisma.expense.findMany({
      where: {
        clinicId: doctor.clinicId,
        date: {
          gte: new Date(
            `${statsYear}-${String(statsMonth).padStart(2, "0")}-01T00:00:00+02:00`
          ),
          lte: new Date(Date.UTC(statsYear, statsMonth, 0, 21, 59, 59)),
        },
      },
      select: { amountEGP: true },
    }),
    prisma.expense.findMany({
      where: {
        clinicId: doctor.clinicId,
        date: {
          gte: new Date(
            `${prevYear}-${String(prevMonth).padStart(2, "0")}-01T00:00:00+02:00`
          ),
          lte: new Date(Date.UTC(prevYear, prevMonth, 0, 21, 59, 59)),
        },
      },
      select: { amountEGP: true },
    }),
  ])

  const thisMonthTotal = thisMonthRows.reduce((s, e) => s + e.amountEGP, 0)
  const lastMonthTotal = lastMonthRows.reduce((s, e) => s + e.amountEGP, 0)

  const response: ExpensesApiResponse = {
    expenses: expenses.map((e) => ({
      id: e.id,
      clinicId: e.clinicId,
      category: e.category,
      description: e.description,
      vendorName: e.vendorName,
      amountEGP: e.amountEGP,
      date: e.date.toISOString(),
      isRecurring: e.isRecurring,
      staffName: e.staffName,
      staffRole: e.staffRole,
      isPaid: e.isPaid,
      usefulLifeMonths: e.usefulLifeMonths,
      receiptUrl: e.receiptUrl,
      receiptName: e.receiptName,
      createdAt: e.createdAt.toISOString(),
    })),
    stats: { thisMonthTotal, lastMonthTotal },
  }

  return NextResponse.json(response)
}

// ─── POST ─────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const doctor = await getDoctor()
  if (!doctor)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const {
    category,
    description,
    vendorName,
    amountEGP,
    date,
    isRecurring,
    isPaid,
    usefulLifeMonths,
    staffName,
    staffRole,
    receiptUrl,
    receiptName,
  } = body

  if (!category || !description || !amountEGP || !date) {
    return NextResponse.json(
      { error: "category, description, amountEGP, date are required" },
      { status: 400 }
    )
  }

  const expense = await prisma.expense.create({
    data: {
      clinicId: doctor.clinicId,
      category,
      description,
      vendorName: vendorName || null,
      amountEGP: Number(amountEGP),
      date: new Date(date),
      isRecurring: Boolean(isRecurring),
      isPaid: Boolean(isPaid),
      usefulLifeMonths: usefulLifeMonths ? Number(usefulLifeMonths) : null,
      staffName: staffName || null,
      staffRole: staffRole || null,
      receiptUrl: receiptUrl || null,
      receiptName: receiptName || null,
    },
  })

  return NextResponse.json(
    {
      id: expense.id,
      clinicId: expense.clinicId,
      category: expense.category,
      description: expense.description,
      vendorName: expense.vendorName,
      amountEGP: expense.amountEGP,
      date: expense.date.toISOString(),
      isRecurring: expense.isRecurring,
      staffName: expense.staffName,
      staffRole: expense.staffRole,
      isPaid: expense.isPaid,
      usefulLifeMonths: expense.usefulLifeMonths,
      receiptUrl: expense.receiptUrl,
      receiptName: expense.receiptName,
      createdAt: expense.createdAt.toISOString(),
    } satisfies ExpenseRow,
    { status: 201 }
  )
}
