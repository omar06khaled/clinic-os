import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { prisma } from "@/lib/prisma"

interface Context {
  params: Promise<{ id: string }>
}

export async function PATCH(req: Request, { params }: Context) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const doctor = await prisma.doctor.findUnique({
    where: { email: user.email },
    select: { id: true, role: true, clinicId: true },
  })
  if (!doctor) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params

  // ── Scope: admin and receptionist can update any clinic appointment ────────
  let existing: { id: string; notes: string | null } | null = null

  if (doctor.role === "admin" || doctor.role === "receptionist") {
    const clinicDoctors = await prisma.doctor.findMany({
      where: { clinicId: doctor.clinicId },
      select: { id: true },
    })
    const clinicDoctorIds = clinicDoctors.map((d) => d.id)

    existing = await prisma.appointment.findFirst({
      where: { id, doctorId: { in: clinicDoctorIds } },
      select: { id: true, notes: true },
    })
  } else {
    // Doctor: own appointments only
    existing = await prisma.appointment.findFirst({
      where: { id, doctorId: doctor.id },
      select: { id: true, notes: true },
    })
  }

  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const body: {
    status?: string
    paymentStatus?: string
    paymentMethod?: string
    amountPaid?: number
    note?: string
  } = await req.json()

  const updatedNotes =
    body.note
      ? existing.notes
        ? `${existing.notes}\n${body.note}`
        : body.note
      : existing.notes

  const updated = await prisma.appointment.update({
    where: { id },
    data: {
      ...(body.status        !== undefined && { status:        body.status        }),
      ...(body.paymentStatus !== undefined && { paymentStatus: body.paymentStatus }),
      ...(body.paymentMethod !== undefined && { paymentMethod: body.paymentMethod }),
      ...(body.amountPaid    !== undefined && { amountPaid:    body.amountPaid    }),
      notes: updatedNotes,
    },
    select: {
      id: true,
      status: true,
      paymentStatus: true,
      paymentMethod: true,
      amountPaid: true,
    },
  })

  return NextResponse.json(updated)
}
