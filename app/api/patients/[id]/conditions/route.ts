import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { prisma } from "@/lib/prisma"

// ── POST /api/patients/[id]/conditions ────────────────────────────────────────

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
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

  // Verify the patient belongs to this doctor
  const patient = await prisma.patient.findFirst({
    where: { id, doctorId: doctor.id },
    select: { id: true },
  })
  if (!patient) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const body = await req.json()
  const { type, notes } = body

  if (!type || typeof type !== "string") {
    return NextResponse.json({ error: "type is required" }, { status: 400 })
  }

  const VALID_TYPES = ["diabetes", "hypertension", "cardiac", "thyroid", "other"]
  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: "invalid type" }, { status: 400 })
  }

  const condition = await prisma.chronicCondition.create({
    data: {
      patientId: id,
      type,
      notes: typeof notes === "string" && notes.trim() ? notes.trim() : null,
    },
  })

  return NextResponse.json(
    {
      id: condition.id,
      type: condition.type,
      notes: condition.notes,
      addedAt: condition.addedAt.toISOString(),
    },
    { status: 201 }
  )
}
