import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { prisma } from "@/lib/prisma"

// ── Shared auth helper — admin only ────────────────────────────────────────
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

// ── GET /api/settings/doctors — list all doctors in the clinic ─────────────
export async function GET() {
  const { error, status, doctor } = await getAdminDoctor()
  if (error) return NextResponse.json({ error }, { status })

  const doctors = await prisma.doctor.findMany({
    where: { clinicId: doctor!.clinicId },
    select: {
      id: true,
      name: true,
      specialty: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  })

  return NextResponse.json(
    doctors.map((d) => ({ ...d, createdAt: d.createdAt.toISOString() }))
  )
}

// ── POST /api/settings/doctors — invite a new doctor ──────────────────────
// Body: { name, specialty?, email, role: "doctor" | "admin" }
export async function POST(req: NextRequest) {
  const { error, status, doctor } = await getAdminDoctor()
  if (error) return NextResponse.json({ error }, { status })

  const body = await req.json()
  const { name, specialty, email, role } = body

  if (!name || typeof name !== "string" || !name.trim())
    return NextResponse.json({ error: "name is required" }, { status: 400 })
  if (!email || typeof email !== "string" || !email.includes("@"))
    return NextResponse.json({ error: "valid email is required" }, { status: 400 })
  if (!["doctor", "admin", "receptionist"].includes(role))
    return NextResponse.json({ error: "role must be doctor, admin, or receptionist" }, { status: 400 })

  // Prevent duplicate email
  const existing = await prisma.doctor.findUnique({ where: { email } })
  if (existing)
    return NextResponse.json({ error: "A doctor with this email already exists" }, { status: 409 })

  // 1. Send Supabase Auth invite email
  // This uses the service-role key, which is the only way to call auth.admin APIs.
  const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    data: {
      // These metadata values are available in the user's JWT after they accept the invite.
      // They are informational only — the authoritative role is in the Doctor table.
      clinic_role: role,
      invited_by: doctor!.id,
    },
  })

  if (inviteError) {
    // Supabase returns an error if the user already exists in auth.users but that
    // is separate from our Doctor table — still safe to create the Doctor record.
    // Only hard-fail on non-duplicate errors.
    if (!inviteError.message.toLowerCase().includes("already registered")) {
      return NextResponse.json(
        { error: `Invite failed: ${inviteError.message}` },
        { status: 500 }
      )
    }
  }

  // 2. Create Doctor record — links to clinic, will be used on first login
  const newDoctor = await prisma.doctor.create({
    data: {
      clinicId: doctor!.clinicId,
      name: name.trim(),
      specialty: specialty?.trim() ?? null,
      email: email.toLowerCase().trim(),
      role,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      specialty: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  })

  return NextResponse.json(
    { ...newDoctor, createdAt: newDoctor.createdAt.toISOString() },
    { status: 201 }
  )
}

// ── PATCH /api/settings/doctors — toggle isActive ─────────────────────────
// Body: { doctorId, isActive }
export async function PATCH(req: NextRequest) {
  const { error, status, doctor } = await getAdminDoctor()
  if (error) return NextResponse.json({ error }, { status })

  const body = await req.json()
  const { doctorId, isActive } = body

  if (!doctorId || typeof isActive !== "boolean")
    return NextResponse.json({ error: "doctorId and isActive are required" }, { status: 400 })

  // Ensure the target doctor belongs to the same clinic
  const target = await prisma.doctor.findUnique({
    where: { id: doctorId },
    select: { clinicId: true },
  })

  if (!target || target.clinicId !== doctor!.clinicId)
    return NextResponse.json({ error: "Doctor not found in clinic" }, { status: 404 })

  const updated = await prisma.doctor.update({
    where: { id: doctorId },
    data: { isActive },
    select: { id: true, name: true, isActive: true },
  })

  return NextResponse.json(updated)
}
