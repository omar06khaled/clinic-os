import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { prisma } from "@/lib/prisma"

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

// ── GET /api/labs ─────────────────────────────────────────────────────────────
// Returns all Lab records for the authenticated doctor.

export async function GET() {
  const doctor = await getAuthenticatedDoctor()
  if (!doctor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const labs = await prisma.lab.findMany({
    where: { doctorId: doctor.id },
    orderBy: { name: "asc" },
    select: { id: true, name: true, address: true, phone: true },
  })

  return NextResponse.json(labs)
}

// ── POST /api/labs ────────────────────────────────────────────────────────────
// Creates a new Lab record for the authenticated doctor.
// Body: { name: string, address?: string, phone?: string }

export async function POST(req: Request) {
  const doctor = await getAuthenticatedDoctor()
  if (!doctor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const name = typeof body.name === "string" ? body.name.trim() : ""
  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 })
  }

  const lab = await prisma.lab.create({
    data: {
      doctorId: doctor.id,
      name,
      address: typeof body.address === "string" && body.address.trim() ? body.address.trim() : null,
      phone:   typeof body.phone   === "string" && body.phone.trim()   ? body.phone.trim()   : null,
    },
    select: { id: true, name: true, address: true, phone: true },
  })

  return NextResponse.json(lab, { status: 201 })
}
