import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { prisma } from "@/lib/prisma"

export type BudgetMap = Record<string, number>

async function getDoctor() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.email) return null
  return prisma.doctor.findUnique({
    where: { email: user.email },
    select: { clinicId: true },
  })
}

// ─── GET ─────────────────────────────────────────────────────────────────────

export async function GET() {
  const doctor = await getDoctor()
  if (!doctor)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const clinic = await prisma.clinic.findUnique({
    where: { id: doctor.clinicId },
    select: { budgetJson: true },
  })

  const budget: BudgetMap = clinic?.budgetJson
    ? (JSON.parse(clinic.budgetJson) as BudgetMap)
    : {}

  return NextResponse.json({ budget })
}

// ─── POST ─────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const doctor = await getDoctor()
  if (!doctor)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { budget } = body as { budget: BudgetMap }

  if (!budget || typeof budget !== "object" || Array.isArray(budget)) {
    return NextResponse.json({ error: "Invalid budget payload" }, { status: 400 })
  }

  // Sanitize: keep only known categories with numeric values
  const KNOWN = ["rent", "utilities", "supplies", "salary", "equipment", "other"]
  const sanitized: BudgetMap = {}
  for (const key of KNOWN) {
    if (key in budget && typeof budget[key] === "number" && budget[key] >= 0) {
      sanitized[key] = budget[key]
    }
  }

  await prisma.clinic.update({
    where: { id: doctor.clinicId },
    data: { budgetJson: JSON.stringify(sanitized) },
  })

  return NextResponse.json({ budget: sanitized })
}
