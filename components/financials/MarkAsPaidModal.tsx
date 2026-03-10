"use client"

import { useState } from "react"
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
import type { RevenueRow } from "@/app/api/financials/revenue/route"

interface Props {
  row: RevenueRow | null
  defaultFee: number
  onClose: () => void
  onSuccess: (updatedId: string) => void
}

function todayCairoStr(): string {
  return new Date().toLocaleDateString("sv", { timeZone: "Africa/Cairo" })
}

export function MarkAsPaidModal({ row, defaultFee, onClose, onSuccess }: Props) {
  const [method, setMethod] = useState("cash")
  const [amount, setAmount] = useState(String(defaultFee))
  const [paymentDate, setPaymentDate] = useState(todayCairoStr())
  const [note, setNote] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Reset fields when a new row is opened
  function reset() {
    setMethod("cash")
    setAmount(String(defaultFee))
    setPaymentDate(todayCairoStr())
    setNote("")
    setError("")
  }

  async function handleSubmit() {
    const parsed = parseInt(amount, 10)
    if (isNaN(parsed) || parsed < 0) {
      setError("أدخل مبلغاً صحيحاً")
      return
    }
    if (!row) return

    setLoading(true)
    setError("")

    // Build optional note string
    const parts: string[] = []
    parts.push(`دفع في: ${paymentDate}`)
    if (note.trim()) parts.push(note.trim())
    const noteStr = parts.join(" — ")

    try {
      const res = await fetch(`/api/appointments/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentStatus: "paid",
          paymentMethod: method,
          amountPaid: parsed,
          note: noteStr,
        }),
      })
      if (!res.ok) throw new Error("فشل الحفظ")
      onSuccess(row.id)
      onClose()
    } catch {
      setError("حدث خطأ، حاول مرة أخرى")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog
      open={!!row}
      onOpenChange={(open) => {
        if (!open) {
          reset()
          onClose()
        }
      }}
    >
      <DialogContent className="sm:max-w-sm" dir="rtl">
        <DialogHeader>
          <DialogTitle>تسجيل دفعة — {row?.patientName ?? ""}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Payment method */}
          <div className="space-y-1.5">
            <Label htmlFor="modal-method">طريقة الدفع</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger id="modal-method">
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

          {/* Amount */}
          <div className="space-y-1.5">
            <Label htmlFor="modal-amount">المبلغ المدفوع (ج.م)</Label>
            <Input
              id="modal-amount"
              type="number"
              min={0}
              dir="ltr"
              className="text-left"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          {/* Payment date */}
          <div className="space-y-1.5">
            <Label htmlFor="modal-date">تاريخ الدفع</Label>
            <Input
              id="modal-date"
              type="date"
              dir="ltr"
              className="text-left"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
            />
          </div>

          {/* Optional note / reference */}
          <div className="space-y-1.5">
            <Label htmlFor="modal-note">ملاحظة / رقم مرجعي (اختياري)</Label>
            <Input
              id="modal-note"
              placeholder="مثال: رقم عملية فوري"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            إلغاء
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "جاري الحفظ..." : "تأكيد الدفع"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
