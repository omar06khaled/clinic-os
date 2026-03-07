import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { prisma } from "@/lib/prisma"
import type { PatientListItem } from "@/types"

export async function GET() {
  // ── 1. Auth ──────────────────────────────────────────────────────────────
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // ── 2. Look up doctor — never trust client-supplied doctorId ─────────────
  const doctor = await prisma.doctor.findUnique({
    where: { email: user.email },
    select: { id: true },
  })

  if (!doctor) {
    return NextResponse.json({ error: "Doctor not found" }, { status: 403 })
  }

  // ── 3. Fetch patients with all computed-field data ───────────────────────
  const patients = await prisma.patient.findMany({
    where: { doctorId: doctor.id },
    include: {
      conditions: {
        select: { id: true, type: true, notes: true },
        orderBy: { addedAt: "asc" },
      },
      records: {
        select: { createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      appointments: {
        where: { paymentStatus: "pending" },
        select: { amountPaid: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  // ── 4. Serialize ─────────────────────────────────────────────────────────
  const data: PatientListItem[] = patients.map((p) => ({
    id: p.id,
    name: p.name,
    phone: p.phone,
    age: p.age,
    gender: p.gender,
    isNew: p.isNew,
    createdAt: p.createdAt.toISOString(),
    conditions: p.conditions,
    lastVisitDate: p.records[0]?.createdAt.toISOString() ?? null,
    totalVisits: p.records.length,
    // Sum of amountPaid on pending appointments (null amountPaid counts as 0)
    outstandingBalance: p.appointments.reduce(
      (sum, a) => sum + (a.amountPaid ?? 0),
      0
    ),
  }))

  return NextResponse.json(data)
}
