import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { prisma } from "@/lib/prisma"

interface Context {
  params: Promise<{ id: string }>
}

const VISIT_TYPE_LABELS: Record<string, string> = {
  new: "زيارة جديدة",
  followup: "متابعة",
  chronic: "أمراض مزمنة",
  urgent: "طارئ",
  walkin: "زيارة مباشرة",
}

export async function PATCH(req: Request, { params }: Context) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const doctor = await prisma.doctor.findUnique({
    where: { email: user.email },
    select: { id: true, role: true, clinicId: true, name: true },
  })
  if (!doctor) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params

  // ── Scope: admin and receptionist can update any clinic appointment ────────
  type AppointmentSelect = {
    id: string
    notes: string | null
    paymentStatus: string
    amountPaid: number | null
    visitType: string
    complaint: string | null
    doctorId: string
    patient: { name: string; phone: string }
  }
  let existing: AppointmentSelect | null = null

  const appointmentSelect = {
    id: true,
    notes: true,
    paymentStatus: true,
    amountPaid: true,
    visitType: true,
    complaint: true,
    doctorId: true,
    patient: { select: { name: true, phone: true } },
  } as const

  if (doctor.role === "admin" || doctor.role === "receptionist") {
    const clinicDoctors = await prisma.doctor.findMany({
      where: { clinicId: doctor.clinicId },
      select: { id: true },
    })
    const clinicDoctorIds = clinicDoctors.map((d) => d.id)

    existing = await prisma.appointment.findFirst({
      where: { id, doctorId: { in: clinicDoctorIds } },
      select: appointmentSelect,
    })
  } else {
    // Doctor: own appointments only
    existing = await prisma.appointment.findFirst({
      where: { id, doctorId: doctor.id },
      select: appointmentSelect,
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

  // ── Auto-generate Invoice when transitioning to paid ──────────────────────
  if (body.paymentStatus === "paid" && existing.paymentStatus !== "paid") {
    const alreadyExists = await prisma.invoice.findUnique({
      where: { appointmentId: id },
      select: { id: true },
    })

    if (!alreadyExists) {
      const amountEGP = body.amountPaid ?? existing.amountPaid ?? 0
      const taxAmountEGP = Math.round(amountEGP * 0.14)
      const totalAmountEGP = amountEGP + taxAmountEGP

      const visitLabel = VISIT_TYPE_LABELS[existing.visitType] ?? existing.visitType
      const serviceDescription = existing.complaint
        ? `${visitLabel} — ${existing.complaint}`
        : visitLabel

      await prisma.invoice.create({
        data: {
          appointmentId: id,
          doctorId: existing.doctorId,
          patientName: existing.patient.name,
          patientPhone: existing.patient.phone,
          serviceDescription,
          amountEGP,
          taxAmountEGP,
          totalAmountEGP,
          etaStatus: "pending",
        },
      })
    }
  }

  return NextResponse.json(updated)
}
