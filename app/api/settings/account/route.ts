import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { prisma } from "@/lib/prisma"

// PATCH /api/settings/account — update the logged-in user's email
export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  if (typeof body.email !== "string" || !body.email.trim()) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 })
  }

  const newEmail = body.email.trim().toLowerCase()
  if (newEmail === user.email.toLowerCase()) {
    return NextResponse.json({ error: "That is already your current email" }, { status: 400 })
  }

  // Update in Supabase Auth (sends verification email to new address)
  const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
    email: newEmail,
  })
  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 })
  }

  // Mirror the change in Prisma so the doctor can still be looked up
  await prisma.doctor.update({
    where: { email: user.email },
    data: { email: newEmail },
  })

  return NextResponse.json({ ok: true })
}
