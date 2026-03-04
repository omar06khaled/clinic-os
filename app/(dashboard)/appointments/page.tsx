import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase-server"
import { prisma } from "@/lib/prisma"
import { AppointmentsView, type SerializedAppointment } from "@/components/appointments/appointments-view"

interface Props {
  searchParams: { view?: string; date?: string }
}

export default async function AppointmentsPage({ searchParams }: Props) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.email) redirect("/login")

  const doctor = await prisma.doctor.findUnique({
    where: { email: user.email },
    select: { id: true, clinicId: true },
  })
  if (!doctor) redirect("/login?error=not_provisioned")

  const view = searchParams.view === "week" ? "week" : "day"
  const cairoTodayStr = new Date().toLocaleDateString("sv", { timeZone: "Africa/Cairo" })
  const dateStr = searchParams.date ?? cairoTodayStr

  // ── Compute query range (Cairo = UTC+2) ───────────────────────────────────
  const [y, m, d] = dateStr.split("-").map(Number)
  let rangeStart: Date
  let rangeEnd: Date

  if (view === "week") {
    // Week: Sunday–Saturday containing dateStr
    const refMs = Date.UTC(y, m - 1, d)
    const dow = new Date(refMs).getUTCDay() // 0=Sun
    const sunMs = refMs - dow * 86_400_000
    const satMs = sunMs + 6 * 86_400_000
    const sunStr = new Date(sunMs).toISOString().slice(0, 10)
    const satStr = new Date(satMs).toISOString().slice(0, 10)
    rangeStart = new Date(`${sunStr}T00:00:00+02:00`)
    rangeEnd = new Date(`${satStr}T23:59:59+02:00`)
  } else {
    rangeStart = new Date(`${dateStr}T00:00:00+02:00`)
    rangeEnd = new Date(`${dateStr}T23:59:59+02:00`)
  }

  const [appointments, clinic] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        doctorId: doctor.id,
        scheduledAt: { gte: rangeStart, lte: rangeEnd },
      },
      include: {
        patient: { select: { id: true, name: true, phone: true, isNew: true } },
      },
      orderBy: { scheduledAt: "asc" },
    }),
    prisma.clinic.findUnique({
      where: { id: doctor.clinicId },
      select: { defaultFee: true },
    }),
  ])

  const serialized: SerializedAppointment[] = appointments.map((a) => ({
    id: a.id,
    scheduledAt: a.scheduledAt.toISOString(),
    visitType: a.visitType,
    status: a.status,
    paymentStatus: a.paymentStatus,
    paymentMethod: a.paymentMethod,
    amountPaid: a.amountPaid,
    confirmStatus: a.confirmStatus,
    complaint: a.complaint,
    notes: a.notes,
    patient: {
      id: a.patient.id,
      name: a.patient.name,
      phone: a.patient.phone,
      isNew: a.patient.isNew,
    },
  }))

  return (
    <AppointmentsView
      key={`${view}-${dateStr}`}
      appointments={serialized}
      initialView={view}
      initialDate={dateStr}
      defaultFee={clinic?.defaultFee ?? 250}
    />
  )
}
