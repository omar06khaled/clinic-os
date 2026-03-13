import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase-server"
import { prisma } from "@/lib/prisma"
import { SettingsClient } from "@/components/settings/SettingsClient"

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.email) redirect("/login")

  const doctor = await prisma.doctor.findUnique({
    where: { email: user.email },
    select: { id: true, clinicId: true, role: true, name: true, email: true, specialty: true },
  })
  if (!doctor) redirect("/login?error=not_provisioned")

  // Fetch clinic (include openingHours)
  const clinic = await prisma.clinic.findUnique({
    where: { id: doctor.clinicId },
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
  if (!clinic) redirect("/login?error=not_provisioned")

  // Admins also see the full doctor list
  const doctors =
    doctor.role === "admin"
      ? await prisma.doctor.findMany({
          where: { clinicId: doctor.clinicId },
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
      : []

  return (
    <SettingsClient
      currentRole={doctor.role}
      currentDoctor={{ name: doctor.name, email: doctor.email, role: doctor.role }}
      clinic={clinic}
      doctors={doctors.map((d) => ({ ...d, createdAt: d.createdAt.toISOString() }))}
    />
  )
}
