"use client"

import { useState, useTransition } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { recordPayment } from "@/app/(dashboard)/actions"

interface RecordPaymentDialogProps {
  appointmentId: string
  patientName: string
  defaultAmount: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RecordPaymentDialog({
  appointmentId,
  patientName,
  defaultAmount,
  open,
  onOpenChange,
}: RecordPaymentDialogProps) {
  const [amount, setAmount] = useState(String(defaultAmount))
  const [method, setMethod] = useState("cash")
  const [isPending, startTransition] = useTransition()

  function handleSubmit() {
    const parsed = parseInt(amount, 10)
    if (isNaN(parsed) || parsed < 0) return
    startTransition(async () => {
      await recordPayment(appointmentId, parsed, method)
      onOpenChange(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm" dir="rtl">
        <DialogHeader>
          <DialogTitle>تسجيل دفعة — {patientName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="pay-amount">المبلغ (ج.م)</Label>
            <Input
              id="pay-amount"
              type="number"
              min={0}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              dir="ltr"
              className="text-left"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pay-method">طريقة الدفع</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger id="pay-method">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">كاش</SelectItem>
                <SelectItem value="instapay">إنستاباي</SelectItem>
                <SelectItem value="fawry">فوري</SelectItem>
                <SelectItem value="insurance">تأمين</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            إلغاء
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? "جاري الحفظ..." : "تأكيد الدفع"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
