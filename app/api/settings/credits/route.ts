import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { prisma } from "@/lib/prisma"

// GET /api/settings/credits — count WhatsApp-booked appointments this month
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const doctor = await prisma.doctor.findUnique({
    where: { email: user.email },
    select: { clinicId: true },
  })
  if (!doctor) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

  // Proxy: appointments with convenienceFee > 0 = booked via WhatsApp bot
  const used = await prisma.appointment.count({
    where: {
      doctor: { clinicId: doctor.clinicId },
      convenienceFee: { gt: 0 },
      scheduledAt: { gte: startOfMonth, lte: endOfMonth },
    },
  })

  return NextResponse.json({ used })
}
