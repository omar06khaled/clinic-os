import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { prisma } from "@/lib/prisma"

// ── DELETE /api/patients/[id]/conditions/[conditionId] ────────────────────────

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; conditionId: string }> }
) {
  const { id, conditionId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const doctor = await prisma.doctor.findUnique({
    where: { email: user.email },
    select: { id: true },
  })
  if (!doctor) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // Verify the condition belongs to a patient of this doctor
  const condition = await prisma.chronicCondition.findFirst({
    where: {
      id: conditionId,
      patientId: id,
      patient: { doctorId: doctor.id },
    },
    select: { id: true },
  })
  if (!condition) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  await prisma.chronicCondition.delete({ where: { id: conditionId } })

  return NextResponse.json({ ok: true })
}
