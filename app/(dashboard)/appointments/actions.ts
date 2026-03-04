"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase-server"

async function getVerifiedDoctorId(): Promise<string> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.email) throw new Error("Unauthorized")
  const doctor = await prisma.doctor.findUnique({
    where: { email: user.email },
    select: { id: true },
  })
  if (!doctor) throw new Error("Doctor not found")
  return doctor.id
}

export async function apptMarkArrived(appointmentId: string) {
  const doctorId = await getVerifiedDoctorId()
  await prisma.appointment.update({
    where: { id: appointmentId, doctorId },
    data: { status: "arrived" },
  })
  revalidatePath("/appointments")
}

export async function apptMarkNoShow(appointmentId: string) {
  const doctorId = await getVerifiedDoctorId()
  await prisma.appointment.update({
    where: { id: appointmentId, doctorId },
    data: { status: "noshow" },
  })
  revalidatePath("/appointments")
}

export async function apptCancel(appointmentId: string) {
  const doctorId = await getVerifiedDoctorId()
  await prisma.appointment.update({
    where: { id: appointmentId, doctorId },
    data: { status: "cancelled" },
  })
  revalidatePath("/appointments")
}

export async function apptReschedule(appointmentId: string, newScheduledAt: string) {
  const doctorId = await getVerifiedDoctorId()
  await prisma.appointment.update({
    where: { id: appointmentId, doctorId },
    data: {
      scheduledAt: new Date(newScheduledAt),
      status: "scheduled",
    },
  })
  revalidatePath("/appointments")
}

export async function apptRecordPayment(
  appointmentId: string,
  amount: number,
  method: string
) {
  const doctorId = await getVerifiedDoctorId()
  await prisma.appointment.update({
    where: { id: appointmentId, doctorId },
    data: {
      paymentStatus: "paid",
      amountPaid: amount,
      paymentMethod: method,
    },
  })
  revalidatePath("/appointments")
}

export async function searchPatients(query: string) {
  const doctorId = await getVerifiedDoctorId()
  if (query.trim().length < 2) return []
  return prisma.patient.findMany({
    where: {
      doctorId,
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { phone: { contains: query } },
      ],
    },
    select: { id: true, name: true, phone: true },
    take: 8,
  })
}

export async function createAppointment(data: {
  patientId: string
  scheduledAt: string
  visitType: string
  complaint: string
}) {
  const doctorId = await getVerifiedDoctorId()

  // Verify patient belongs to this doctor
  const patient = await prisma.patient.findFirst({
    where: { id: data.patientId, doctorId },
  })
  if (!patient) throw new Error("Patient not found")

  await prisma.appointment.create({
    data: {
      doctorId,
      patientId: data.patientId,
      scheduledAt: new Date(data.scheduledAt),
      visitType: data.visitType,
      complaint: data.complaint || null,
      status: "scheduled",
      confirmStatus: "unconfirmed",
      paymentStatus: "pending",
    },
  })
  revalidatePath("/appointments")
}
export async function createNewPatientAndAppointment(data: {
  patientName: string
  patientPhone: string
  scheduledAt: string
  visitType: string
  complaint: string
}) {
  const doctorId = await getVerifiedDoctorId()
  const patient = await prisma.patient.create({
    data: {
      doctorId,
      name: data.patientName.trim(),
      phone: data.patientPhone.trim(),
      isNew: true,
    },
    select: { id: true },
  })
  await prisma.appointment.create({
    data: {
      doctorId,
      patientId: patient.id,
      scheduledAt: new Date(data.scheduledAt),
      visitType: data.visitType,
      complaint: data.complaint || null,
      status: "scheduled",
      confirmStatus: "unconfirmed",
      paymentStatus: "pending",
    },
  })
  revalidatePath("/appointments")
}
