import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { prisma } from "@/lib/prisma"

export type InvoiceData = {
  id: string
  appointmentId: string
  doctorId: string
  doctorName: string
  clinicName: string
  patientName: string
  patientPhone: string
  serviceDescription: string
  amountEGP: number
  taxAmountEGP: number
  totalAmountEGP: number
  invoiceDate: string
  etaStatus: string
  etaSubmittedAt: string | null
  etaReferenceId: string | null
  createdAt: string
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.email)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const doctor = await prisma.doctor.findUnique({
    where: { email: user.email },
    select: { id: true, clinicId: true },
  })
  if (!doctor)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const appointmentId = req.nextUrl.searchParams.get("appointmentId")
  if (!appointmentId)
    return NextResponse.json({ error: "appointmentId required" }, { status: 400 })

  const invoice = await prisma.invoice.findUnique({
    where: { appointmentId },
    include: {
      doctor: {
        select: {
          name: true,
          clinic: { select: { name: true } },
        },
      },
    },
  })

  if (!invoice)
    return NextResponse.json({ error: "Not found" }, { status: 404 })

  const data: InvoiceData = {
    id: invoice.id,
    appointmentId: invoice.appointmentId,
    doctorId: invoice.doctorId,
    doctorName: invoice.doctor.name,
    clinicName: invoice.doctor.clinic.name,
    patientName: invoice.patientName,
    patientPhone: invoice.patientPhone,
    serviceDescription: invoice.serviceDescription,
    amountEGP: invoice.amountEGP,
    taxAmountEGP: invoice.taxAmountEGP,
    totalAmountEGP: invoice.totalAmountEGP,
    invoiceDate: invoice.invoiceDate.toISOString(),
    etaStatus: invoice.etaStatus,
    etaSubmittedAt: invoice.etaSubmittedAt?.toISOString() ?? null,
    etaReferenceId: invoice.etaReferenceId,
    createdAt: invoice.createdAt.toISOString(),
  }

  return NextResponse.json(data)
}
