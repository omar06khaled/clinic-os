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

export async function markArrived(appointmentId: string) {
  const doctorId = await getVerifiedDoctorId()
  await prisma.appointment.update({
    where: { id: appointmentId, doctorId },
    data: { status: "arrived" },
  })
  revalidatePath("/")
}

export async function markNoShow(appointmentId: string) {
  const doctorId = await getVerifiedDoctorId()
  await prisma.appointment.update({
    where: { id: appointmentId, doctorId },
    data: { status: "noshow" },
  })
  revalidatePath("/")
}

export async function recordPayment(
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
  revalidatePath("/")
}
