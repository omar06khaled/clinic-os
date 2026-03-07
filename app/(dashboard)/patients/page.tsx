import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase-server"
import { prisma } from "@/lib/prisma"
import { PatientsView } from "@/components/patients/patients-view"
import type { PatientListItem } from "@/types"

export default async function PatientsPage() {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.email) redirect("/login")

  const doctor = await prisma.doctor.findUnique({
    where: { email: user.email },
    select: { id: true },
  })
  if (!doctor) redirect("/login?error=not_provisioned")

  // ── Fetch patients — scoped strictly to this doctor ───────────────────────
  const patients = await prisma.patient.findMany({
    where: { doctorId: doctor.id },
    include: {
      conditions: {
        select: { id: true, type: true, notes: true },
        orderBy: { addedAt: "asc" },
      },
      records: {
        select: { createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      appointments: {
        where: { paymentStatus: "pending" },
        select: { amountPaid: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  // ── Serialize (Date → ISO string so client component can receive it) ───────
  const serialized: PatientListItem[] = patients.map((p) => ({
    id: p.id,
    name: p.name,
    phone: p.phone,
    age: p.age,
    gender: p.gender,
    isNew: p.isNew,
    createdAt: p.createdAt.toISOString(),
    conditions: p.conditions,
    lastVisitDate: p.records[0]?.createdAt.toISOString() ?? null,
    totalVisits: p.records.length,
    outstandingBalance: p.appointments.reduce(
      (sum, a) => sum + (a.amountPaid ?? 0),
      0
    ),
  }))

  return <PatientsView patients={serialized} />
}
