"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Plus, UserPlus, Receipt, MessageSquare } from "lucide-react"

export function QuickActionsBar() {
  const router = useRouter()

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        size="sm"
        className="gap-1.5"
        onClick={() => router.push("/appointments/new")}
      >
        <Plus className="h-4 w-4" />
        موعد جديد
      </Button>

      <Button
        size="sm"
        variant="outline"
        className="gap-1.5"
        onClick={() => router.push("/patients/new")}
      >
        <UserPlus className="h-4 w-4" />
        مريض جديد
      </Button>

      <Button
        size="sm"
        variant="outline"
        className="gap-1.5"
        onClick={() => router.push("/financials/new-expense")}
      >
        <Receipt className="h-4 w-4" />
        تسجيل مصروف
      </Button>

      <Button
        size="sm"
        variant="outline"
        className="gap-1.5"
        onClick={() => router.push("/whatsapp")}
      >
        <MessageSquare className="h-4 w-4" />
        واتساب
      </Button>
    </div>
  )
}
