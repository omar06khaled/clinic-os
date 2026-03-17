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
    select: { id: true, role: true, clinicId: true, clinic: { select: { defaultFee: true } } },
  })

  if (!doctor) {
    return NextResponse.json({ error: "Doctor not found" }, { status: 403 })
  }

  // ── 3. Determine patient scope based on role ─────────────────────────────
  let patientWhere: { doctorId: string | { in: string[] } }

  if (doctor.role === "admin" || doctor.role === "receptionist" || doctor.role === "owner") {
    const clinicDoctors = await prisma.doctor.findMany({
      where: { clinicId: doctor.clinicId },
      select: { id: true },
    })
    patientWhere = { doctorId: { in: clinicDoctors.map((d) => d.id) } }
  } else {
    patientWhere = { doctorId: doctor.id }
  }

  // ── 4. Fetch patients with all computed-field data ───────────────────────
  const patients = await prisma.patient.findMany({
    where: patientWhere,
    include: {
      conditions: {
        select: { id: true, type: true, notes: true },
        orderBy: { addedAt: "asc" },
      },
      _count: { select: { records: true } },
      records: {
        select: { appointment: { select: { scheduledAt: true } } },
        orderBy: { appointment: { scheduledAt: "desc" } },
        take: 1,
      },
      appointments: {
        where: {
          OR: [
            { paymentStatus: "pending" },
            { status: "scheduled", scheduledAt: { gt: new Date() } },
          ],
        },
        select: { amountPaid: true, paymentStatus: true, status: true, scheduledAt: true },
        orderBy: { scheduledAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  // ── 4. Serialize ─────────────────────────────────────────────────────────
  const now = new Date()

  const data: PatientListItem[] = patients.map((p) => {
    const nextAppt = p.appointments.find(
      (a) => a.status === "scheduled" && a.scheduledAt > now
    )
    return {
      id: p.id,
      name: p.name,
      phone: p.phone,
      age: p.age,
      gender: p.gender,
      isNew: p.isNew,
      createdAt: p.createdAt.toISOString(),
      conditions: p.conditions,
      lastVisitDate: p.records[0]?.appointment?.scheduledAt.toISOString() ?? null,
      nextVisitDate: nextAppt?.scheduledAt.toISOString() ?? null,
      totalVisits: p._count.records,
      outstandingBalance: p.appointments
        .filter((a) => a.paymentStatus === "pending")
        .reduce(
          (sum, a) => sum + Math.max(0, doctor.clinic.defaultFee - (a.amountPaid ?? 0)),
          0
        ),
    }
  })

  return NextResponse.json(data)
}
