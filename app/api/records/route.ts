import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { prisma } from "@/lib/prisma"
import type { VisitRecordDetail } from "@/types"

async function getAuthenticatedDoctor() {
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

// ── POST /api/records ─────────────────────────────────────────────────────────
// Creates an Appointment + VisitRecord in a single Prisma transaction.
// Verifies that the patientId belongs to the authenticated doctor first.

export async function POST(req: Request) {
  const doctor = await getAuthenticatedDoctor()
  if (!doctor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const {
    patientId,
    complaint,
    vitalsBP,
    vitalsPulse,
    vitalsTemp,
    vitalsWeight,
    vitalsO2,
    symptoms,
    diagnosis,
    prescription,
    labReferrals,
    followUpDays,
    followUpReason,
    doctorNotes,
    voiceNoteText,
  } = body

  if (!patientId || typeof patientId !== "string") {
    return NextResponse.json({ error: "patientId is required" }, { status: 400 })
  }

  // Verify this patient belongs to the authenticated doctor
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, doctorId: doctor.id },
    select: { id: true },
  })
  if (!patient) {
    return NextResponse.json({ error: "Patient not found" }, { status: 404 })
  }

  const now = new Date()

  const result = await prisma.$transaction(async (tx) => {
    const appointment = await tx.appointment.create({
      data: {
        doctorId: doctor.id,
        patientId,
        scheduledAt: now,
        visitType: "walkin",
        status: "arrived",
        confirmStatus: "walkin",
      },
    })

    const record = await tx.visitRecord.create({
      data: {
        appointmentId: appointment.id,
        patientId,
        complaint:      typeof complaint === "string" && complaint.trim()      ? complaint.trim()      : null,
        vitalsBP:       typeof vitalsBP === "string" && vitalsBP.trim()       ? vitalsBP.trim()       : null,
        vitalsPulse:    typeof vitalsPulse === "number"                        ? vitalsPulse           : null,
        vitalsTemp:     typeof vitalsTemp === "number"                         ? vitalsTemp            : null,
        vitalsWeight:   typeof vitalsWeight === "number"                       ? vitalsWeight          : null,
        vitalsO2:       typeof vitalsO2 === "number"                           ? vitalsO2              : null,
        symptoms:       typeof symptoms === "string" && symptoms               ? symptoms              : null,
        diagnosis:      typeof diagnosis === "string" && diagnosis.trim()      ? diagnosis.trim()      : null,
        prescription:   typeof prescription === "string" && prescription       ? prescription          : null,
        labReferrals:   typeof labReferrals === "string" && labReferrals       ? labReferrals          : null,
        followUpDays:   typeof followUpDays === "number"                       ? followUpDays          : null,
        followUpReason: typeof followUpReason === "string" && followUpReason.trim() ? followUpReason.trim() : null,
        doctorNotes:    typeof doctorNotes === "string" && doctorNotes.trim()  ? doctorNotes.trim()    : null,
        voiceNoteText:  typeof voiceNoteText === "string" && voiceNoteText.trim() ? voiceNoteText.trim() : null,
      },
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
    })

    return record
  })

  const serialized: VisitRecordDetail = {
    id: result.id,
    appointmentId: result.appointmentId,
    complaint: result.complaint,
    vitalsBP: result.vitalsBP,
    vitalsPulse: result.vitalsPulse,
    vitalsTemp: result.vitalsTemp,
    vitalsWeight: result.vitalsWeight,
    vitalsO2: result.vitalsO2,
    symptoms: result.symptoms,
    diagnosis: result.diagnosis,
    prescription: result.prescription,
    labReferrals: result.labReferrals,
    followUpDays: result.followUpDays,
    followUpReason: result.followUpReason,
    doctorNotes: result.doctorNotes,
    voiceNoteUrl: result.voiceNoteUrl,
    createdAt: result.createdAt.toISOString(),
    attachments: result.attachments.map((a) => ({
      id: a.id,
      url: a.url,
      type: a.type,
      name: a.name,
    })),
    appointment: {
      scheduledAt: result.appointment.scheduledAt.toISOString(),
      paymentStatus: result.appointment.paymentStatus,
      amountPaid: result.appointment.amountPaid,
    },
  }

  return NextResponse.json(serialized, { status: 201 })
}
