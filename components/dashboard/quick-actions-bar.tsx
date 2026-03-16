"use client"

import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Plus, UserPlus, Receipt, MessageSquare } from "lucide-react"

export function QuickActionsBar() {
  const router = useRouter()
  const t = useTranslations("dashboard")

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        size="sm"
        className="gap-1.5"
        onClick={() => router.push("/appointments/new")}
      >
        <Plus className="h-4 w-4" />
        {t("addAppointment")}
      </Button>

      <Button
        size="sm"
        variant="outline"
        className="gap-1.5"
        onClick={() => router.push("/patients/new")}
      >
        <UserPlus className="h-4 w-4" />
        {t("newPatient")}
      </Button>

      <Button
        size="sm"
        variant="outline"
        className="gap-1.5"
        onClick={() => router.push("/financials/new-expense")}
      >
        <Receipt className="h-4 w-4" />
        {t("addExpense")}
      </Button>

      <Button
        size="sm"
        variant="outline"
        className="gap-1.5"
        onClick={() => router.push("/whatsapp")}
      >
        <MessageSquare className="h-4 w-4" />
        {t("whatsappAction")}
      </Button>
    </div>
  )
}
