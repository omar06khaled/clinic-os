import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { prisma } from "@/lib/prisma"
import type { PatientDetail } from "@/types"

// ── Helpers ───────────────────────────────────────────────────────────────────

async function getAuthenticatedDoctor() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.email) return null

  const doctor = await prisma.doctor.findUnique({
    where: { email: user.email },
    select: { id: true },
  })
  return doctor
}

// ── GET /api/patients/[id] ────────────────────────────────────────────────────

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const doctor = await getAuthenticatedDoctor()
  if (!doctor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const patient = await prisma.patient.findFirst({
    where: { id, doctorId: doctor.id },
    include: {
      conditions: {
        orderBy: { addedAt: "asc" },
      },
      records: {
        include: {
          attachments: true,
          appointment: {
            select: {
              scheduledAt: true,
              paymentStatus: true,
              amountPaid: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      appointments: {
        where: { paymentStatus: "paid" },
        select: { amountPaid: true },
      },
    },
  })

  if (!patient) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const totalSpent = patient.appointments.reduce(
    (sum, a) => sum + (a.amountPaid ?? 0),
    0
  )

  const lastVisitDate =
    patient.records.length > 0
      ? patient.records.reduce<string | null>((latest, r) => {
          const d = r.appointment.scheduledAt.toISOString()
          return !latest || d > latest ? d : latest
        }, null)
      : null

  const data: PatientDetail = {
    id: patient.id,
    name: patient.name,
    phone: patient.phone,
    age: patient.age,
    gender: patient.gender,
    bloodType: patient.bloodType,
    allergies: patient.allergies,
    permanentNotes: patient.permanentNotes,
    isNew: patient.isNew,
    createdAt: patient.createdAt.toISOString(),
    conditions: patient.conditions.map((c) => ({
      id: c.id,
      type: c.type,
      notes: c.notes,
      addedAt: c.addedAt.toISOString(),
    })),
    records: patient.records.map((r) => ({
      id: r.id,
      appointmentId: r.appointmentId,
      complaint: r.complaint,
      vitalsBP: r.vitalsBP,
      vitalsPulse: r.vitalsPulse,
      vitalsTemp: r.vitalsTemp,
      vitalsWeight: r.vitalsWeight,
      vitalsO2: r.vitalsO2,
      symptoms: r.symptoms,
      diagnosis: r.diagnosis,
      prescription: r.prescription,
      labReferrals: r.labReferrals,
      followUpDays: r.followUpDays,
      followUpReason: r.followUpReason,
      doctorNotes: r.doctorNotes,
      voiceNoteUrl: r.voiceNoteUrl,
      createdAt: r.createdAt.toISOString(),
      attachments: r.attachments.map((a) => ({
        id: a.id,
        url: a.url,
        type: a.type,
        name: a.name,
      })),
      appointment: {
        scheduledAt: r.appointment.scheduledAt.toISOString(),
        paymentStatus: r.appointment.paymentStatus,
        amountPaid: r.appointment.amountPaid,
      },
    })),
    totalVisits: patient.records.length,
    totalSpent,
    lastVisitDate,
  }

  return NextResponse.json(data)
}

// ── PATCH /api/patients/[id] ──────────────────────────────────────────────────

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const doctor = await getAuthenticatedDoctor()
  if (!doctor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const existing = await prisma.patient.findFirst({
    where: { id, doctorId: doctor.id },
    select: { id: true },
  })
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const body = await req.json()
  const update: { allergies?: string | null; permanentNotes?: string | null } = {}

  if ("allergies" in body) {
    update.allergies = typeof body.allergies === "string" && body.allergies.trim()
      ? body.allergies.trim()
      : null
  }
  if ("permanentNotes" in body) {
    update.permanentNotes =
      typeof body.permanentNotes === "string" && body.permanentNotes.trim()
        ? body.permanentNotes.trim()
        : null
  }

  const updated = await prisma.patient.update({
    where: { id },
    data: update,
    select: { allergies: true, permanentNotes: true },
  })

  return NextResponse.json(updated)
}
