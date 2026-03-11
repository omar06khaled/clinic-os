import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { prisma } from "@/lib/prisma"
import type { AuditorLogRow } from "@/types"

// ─── Auth helper ──────────────────────────────────────────────────────────────

async function getDoctor() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.email) return null
  return prisma.doctor.findUnique({
    where: { email: user.email },
    select: { id: true },
  })
}

// ─── GET — last 30 days of reconciliation history ────────────────────────────

export async function GET() {
  const doctor = await getDoctor()
  if (!doctor)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const logs = await prisma.auditorLog.findMany({
    where: {
      doctorId: doctor.id,
      date: { gte: thirtyDaysAgo },
    },
    orderBy: { date: "desc" },
  })

  const rows: AuditorLogRow[] = logs.map((l) => ({
    id: l.id,
    date: l.date.toISOString(),
    patientsExpected:     l.patientsExpected     ?? 0,
    expectedCashEGP:      l.expectedCashEGP      ?? 0,
    reportedCashEGP:      l.reportedCashEGP      ?? 0,
    expectedInstapayEGP:  l.expectedInstapayEGP  ?? 0,
    reportedInstapayEGP:  l.reportedInstapayEGP  ?? 0,
    expectedFawryEGP:     l.expectedFawryEGP     ?? 0,
    reportedFawryEGP:     l.reportedFawryEGP     ?? 0,
    expectedInsuranceEGP: l.expectedInsuranceEGP ?? 0,
    reportedInsuranceEGP: l.reportedInsuranceEGP ?? 0,
    discrepancyEGP:       l.discrepancyEGP       ?? 0,
    discrepancyPct:       l.discrepancyPct       ?? 0,
    status: l.status,
    notes: l.notes,
  }))

  return NextResponse.json(rows)
}

// ─── POST — save one reconciliation result ───────────────────────────────────

export async function POST(req: NextRequest) {
  const doctor = await getDoctor()
  if (!doctor)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const {
    date,
    patientsExpected,
    expectedCashEGP,
    reportedCashEGP,
    expectedInstapayEGP,
    reportedInstapayEGP,
    expectedFawryEGP,
    reportedFawryEGP,
    expectedInsuranceEGP,
    reportedInsuranceEGP,
    discrepancyEGP,
    discrepancyPct,
    status,
    notes,
  } = body

  if (!date || status === undefined) {
    return NextResponse.json(
      { error: "date and status are required" },
      { status: 400 }
    )
  }

  const log = await prisma.auditorLog.create({
    data: {
      doctorId: doctor.id,
      date: new Date(date),
      patientsExpected: Number(patientsExpected ?? 0),
      expectedCashEGP: Number(expectedCashEGP ?? 0),
      reportedCashEGP: Number(reportedCashEGP ?? 0),
      expectedInstapayEGP: Number(expectedInstapayEGP ?? 0),
      reportedInstapayEGP: Number(reportedInstapayEGP ?? 0),
      expectedFawryEGP: Number(expectedFawryEGP ?? 0),
      reportedFawryEGP: Number(reportedFawryEGP ?? 0),
      expectedInsuranceEGP: Number(expectedInsuranceEGP ?? 0),
      reportedInsuranceEGP: Number(reportedInsuranceEGP ?? 0),
      discrepancyEGP: Number(discrepancyEGP ?? 0),
      discrepancyPct: Number(discrepancyPct ?? 0),
      status,
      notes: notes || null,
    },
  })

  return NextResponse.json({ id: log.id }, { status: 201 })
}
