import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { prisma } from "@/lib/prisma"

async function getDoctor() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.email) return null
  return prisma.doctor.findUnique({
    where: { email: user.email },
    select: { id: true, clinicId: true },
  })
}

// ─── PATCH ────────────────────────────────────────────────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const doctor = await getDoctor()
  if (!doctor)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const existing = await prisma.expense.findFirst({
    where: { id, clinicId: doctor.clinicId },
  })
  if (!existing)
    return NextResponse.json({ error: "Not found" }, { status: 404 })

  const body = await req.json()

  // Only allow updating fields that exist in the schema
  const data: Record<string, unknown> = {}
  if (body.isPaid !== undefined) data.isPaid = Boolean(body.isPaid)
  if (body.description !== undefined) data.description = String(body.description)
  if (body.vendorName !== undefined) data.vendorName = body.vendorName || null
  if (body.amountEGP !== undefined) data.amountEGP = Number(body.amountEGP)
  if (body.receiptUrl !== undefined) data.receiptUrl = body.receiptUrl || null
  if (body.receiptName !== undefined) data.receiptName = body.receiptName || null
  if (body.staffName !== undefined) data.staffName = body.staffName || null
  if (body.staffRole !== undefined) data.staffRole = body.staffRole || null

  const updated = await prisma.expense.update({ where: { id }, data })

  return NextResponse.json({
    id: updated.id,
    clinicId: updated.clinicId,
    category: updated.category,
    description: updated.description,
    vendorName: updated.vendorName,
    amountEGP: updated.amountEGP,
    date: updated.date.toISOString(),
    isRecurring: updated.isRecurring,
    staffName: updated.staffName,
    staffRole: updated.staffRole,
    isPaid: updated.isPaid,
    usefulLifeMonths: updated.usefulLifeMonths,
    receiptUrl: updated.receiptUrl,
    receiptName: updated.receiptName,
    createdAt: updated.createdAt.toISOString(),
  })
}

// ─── DELETE ───────────────────────────────────────────────────────────────────

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const doctor = await getDoctor()
  if (!doctor)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const existing = await prisma.expense.findFirst({
    where: { id, clinicId: doctor.clinicId },
  })
  if (!existing)
    return NextResponse.json({ error: "Not found" }, { status: 404 })

  await prisma.expense.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
