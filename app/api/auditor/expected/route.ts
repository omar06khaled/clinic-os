import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { prisma } from "@/lib/prisma"
import type { AuditorExpectedData } from "@/types"

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

// ─── GET — expected collections by payment method for today ──────────────────
// Sums amountPaid on today's appointments where status=arrived and paymentStatus=paid,
// grouped by paymentMethod (cash | instapay | fawry | insurance).

export async function GET() {
  const doctor = await getDoctor()
  if (!doctor)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Build start/end of today in Cairo timezone (UTC+2)
  const cairoDate = new Date().toLocaleDateString("sv", {
    timeZone: "Africa/Cairo",
  }) // "YYYY-MM-DD"
  const startOfDay = new Date(`${cairoDate}T00:00:00+02:00`)
  const endOfDay = new Date(`${cairoDate}T23:59:59+02:00`)

  const appts = await prisma.appointment.findMany({
    where: {
      doctorId: doctor.id,
      scheduledAt: { gte: startOfDay, lte: endOfDay },
      status: "arrived",
      paymentStatus: "paid",
    },
    select: { paymentMethod: true, amountPaid: true },
  })

  const result: AuditorExpectedData = {
    cash:      { count: 0, totalEGP: 0 },
    instapay:  { count: 0, totalEGP: 0 },
    fawry:     { count: 0, totalEGP: 0 },
    insurance: { count: 0, totalEGP: 0 },
    patientsExpected: appts.length,
  }

  for (const appt of appts) {
    const method = appt.paymentMethod ?? "cash"
    const amount = appt.amountPaid ?? 0

    if (method === "cash") {
      result.cash.count++
      result.cash.totalEGP += amount
    } else if (method === "instapay") {
      result.instapay.count++
      result.instapay.totalEGP += amount
    } else if (method === "fawry") {
      result.fawry.count++
      result.fawry.totalEGP += amount
    } else if (method === "insurance") {
      result.insurance.count++
      result.insurance.totalEGP += amount
    }
  }

  return NextResponse.json(result)
}
