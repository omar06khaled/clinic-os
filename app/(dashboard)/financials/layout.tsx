import { redirect } from "next/navigation"
import { ShieldAlert } from "lucide-react"
import { createClient } from "@/lib/supabase-server"
import { prisma } from "@/lib/prisma"
import { FinancialsTabs } from "@/components/financials/FinancialsTabs"

export default async function FinancialsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.email) redirect("/login")

  const doctor = await prisma.doctor.findUnique({
    where: { email: user.email },
    select: { role: true },
  })
  if (!doctor) redirect("/login?error=not_provisioned")

  // ── Role guard — only admins can access financials ────────────────────────
  if (doctor.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/30">
          <ShieldAlert className="h-7 w-7 text-amber-600" />
        </div>
        <div className="space-y-1 max-w-sm">
          <h2 className="text-lg font-semibold">Access Restricted</h2>
          <p className="text-sm text-muted-foreground">
            Only clinic administrators can access financial reports. Please
            contact your admin if you need financial information.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar — client component that reads pathname */}
      <FinancialsTabs />

      {/* Page content */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  )
}
