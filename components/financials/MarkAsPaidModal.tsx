"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
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
  const t = useTranslations("financials")
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
      setError(t("markPaidErrorInvalidAmount"))
      return
    }
    if (!row) return

    setLoading(true)
    setError("")

    // Build optional note string
    const parts: string[] = []
    parts.push(t("markPaidPaymentNote", { date: paymentDate }))
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
      if (!res.ok) throw new Error(t("markPaidErrorSave"))
      onSuccess(row.id)
      onClose()
    } catch {
      setError(t("markPaidErrorGeneric"))
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
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("markPaidTitle", { name: row?.patientName ?? "" })}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Payment method */}
          <div className="space-y-1.5">
            <Label htmlFor="modal-method">{t("markPaidMethodLabel")}</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger id="modal-method">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">{t("methodCash")}</SelectItem>
                <SelectItem value="instapay">{t("methodInstapay")}</SelectItem>
                <SelectItem value="fawry">{t("methodFawry")}</SelectItem>
                <SelectItem value="insurance">{t("methodInsurance")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <Label htmlFor="modal-amount">{t("markPaidAmountLabel")}</Label>
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
            <Label htmlFor="modal-date">{t("markPaidDateLabel")}</Label>
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
            <Label htmlFor="modal-note">{t("markPaidNoteLabel")}</Label>
            <Input
              id="modal-note"
              placeholder={t("markPaidNotePlaceholder")}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {t("cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? t("saving") : t("confirmPayment")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
