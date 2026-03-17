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
    select: { id: true, role: true, clinicId: true, clinic: { select: { defaultFee: true } } },
  })
  if (!doctor) redirect("/login?error=not_provisioned")

  // ── Determine patient scope based on role ─────────────────────────────────
  let patientWhere: { doctorId: string | { in: string[] } }

  if (doctor.role === "admin" || doctor.role === "receptionist" || doctor.role === "owner") {
    // Clinic-wide: all doctors in the same clinic
    const clinicDoctors = await prisma.doctor.findMany({
      where: { clinicId: doctor.clinicId },
      select: { id: true },
    })
    const doctorIds = clinicDoctors.map((d) => d.id)
    patientWhere = { doctorId: { in: doctorIds } }
  } else {
    // Doctor: own patients only
    patientWhere = { doctorId: doctor.id }
  }

  // ── Fetch patients ────────────────────────────────────────────────────────
  const patients = await prisma.patient.findMany({
    where: patientWhere,
    include: {
      conditions: {
        select: { id: true, type: true, notes: true },
        orderBy: { addedAt: "asc" },
      },
      _count: { select: { records: true } },
      records: {
        select: { appointment: { select: { scheduledAt: true } } },
        orderBy: { appointment: { scheduledAt: "desc" } },
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
    lastVisitDate: p.records[0]?.appointment?.scheduledAt.toISOString() ?? null,
    totalVisits: p._count.records,
    outstandingBalance: p.appointments.reduce(
      (sum, a) => sum + Math.max(0, doctor.clinic.defaultFee - (a.amountPaid ?? 0)),
      0
    ),
  }))

  return <PatientsView patients={serialized} />
}
