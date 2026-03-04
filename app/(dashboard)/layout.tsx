import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase-server"
import { prisma } from "@/lib/prisma"
import { Sidebar, BottomTabBar } from "@/components/dashboard-sidebar"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Validate session server-side (middleware also guards this, but double-check here)
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) redirect("/login")

  // Look up the doctor record by email
  const doctor = await prisma.doctor.findUnique({
    where: { email: user.email },
    select: { name: true, specialty: true, role: true },
  })

  // If no matching doctor in DB, the Supabase user exists but isn't provisioned yet
  if (!doctor) redirect("/login?error=not_provisioned")

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <Sidebar doctor={doctor} />

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
          {children}
        </main>
      </div>

      {/* Mobile bottom tab bar */}
      <BottomTabBar />
    </div>
  )
}
