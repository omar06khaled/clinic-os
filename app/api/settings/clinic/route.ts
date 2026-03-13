import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { prisma } from "@/lib/prisma"

// ── Shared auth helper ──────────────────────────────────────────────────────
async function getAdminDoctor() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) return { error: "Unauthorized", status: 401, doctor: null }

  const doctor = await prisma.doctor.findUnique({
    where: { email: user.email },
    select: { id: true, clinicId: true, role: true },
  })

  if (!doctor) return { error: "Doctor not found", status: 403, doctor: null }
  if (doctor.role !== "admin")
    return { error: "Admin role required", status: 403, doctor: null }

  return { error: null, status: 200, doctor }
}

// ── GET /api/settings/clinic — fetch clinic settings ───────────────────────
export async function GET() {
  const { error, status, doctor } = await getAdminDoctor()
  if (error) return NextResponse.json({ error }, { status })

  const clinic = await prisma.clinic.findUnique({
    where: { id: doctor!.clinicId },
    select: {
      id: true,
      name: true,
      address: true,
      phone: true,
      defaultFee: true,
      isMultiDoctor: true,
      subscriptionTier: true,
      openingHours: true,
    },
  })

  if (!clinic) return NextResponse.json({ error: "Clinic not found" }, { status: 404 })
  return NextResponse.json(clinic)
}

// ── PATCH /api/settings/clinic — update clinic settings ────────────────────
export async function PATCH(req: NextRequest) {
  const { error, status, doctor } = await getAdminDoctor()
  if (error) return NextResponse.json({ error }, { status })

  const body = await req.json()

  // Only permit a safe subset of fields
  const allowed: Record<string, unknown> = {}
  if (typeof body.name === "string" && body.name.trim())
    allowed.name = body.name.trim()
  if (typeof body.address === "string") allowed.address = body.address.trim()
  if (typeof body.phone === "string") allowed.phone = body.phone.trim()
  if (typeof body.defaultFee === "number" && body.defaultFee > 0)
    allowed.defaultFee = body.defaultFee
  if (typeof body.isMultiDoctor === "boolean")
    allowed.isMultiDoctor = body.isMultiDoctor
  if (typeof body.openingHours === "string")
    allowed.openingHours = body.openingHours

  const updated = await prisma.clinic.update({
    where: { id: doctor!.clinicId },
    data: allowed,
    select: {
      id: true,
      name: true,
      address: true,
      phone: true,
      defaultFee: true,
      isMultiDoctor: true,
      subscriptionTier: true,
      openingHours: true,
    },
  })

  return NextResponse.json(updated)
}
