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
    select: { id: true },
  })
  if (!doctor) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params

  const existing = await prisma.appointment.findFirst({
    where: { id, doctorId: doctor.id },
    select: { id: true, notes: true },
  })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const body: {
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
      ...(body.paymentStatus !== undefined && { paymentStatus: body.paymentStatus }),
      ...(body.paymentMethod !== undefined && { paymentMethod: body.paymentMethod }),
      ...(body.amountPaid !== undefined && { amountPaid: body.amountPaid }),
      notes: updatedNotes,
    },
    select: { id: true, paymentStatus: true, paymentMethod: true, amountPaid: true },
  })

  return NextResponse.json(updated)
}
