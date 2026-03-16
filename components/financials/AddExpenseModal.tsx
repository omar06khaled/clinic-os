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
import { ReceiptUpload } from "@/components/financials/ReceiptUpload"
import type { ExpenseRow } from "@/app/api/financials/expenses/route"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: (expense: ExpenseRow) => void
}

type Category = "rent" | "utilities" | "supplies" | "salary" | "equipment" | "other"

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_VALUES: { value: Category; tKey: string }[] = [
  { value: "rent",      tKey: "catRent"           },
  { value: "utilities", tKey: "addCatUtilitiesLabel" },
  { value: "supplies",  tKey: "addCatSuppliesLabel"  },
  { value: "salary",    tKey: "catSalary"           },
  { value: "equipment", tKey: "addCatEquipmentLabel" },
  { value: "other",     tKey: "catOther"            },
]

// ─── Component ────────────────────────────────────────────────────────────────

export function AddExpenseModal({ open, onClose, onSuccess }: Props) {
  const t = useTranslations("financials")

  // ── Form state ───────────────────────────────────────────────────────────
  const [category, setCategory] = useState<Category | "">("")
  const [description, setDescription] = useState("")
  const [vendorName, setVendorName] = useState("")
  const [amountEGP, setAmountEGP] = useState("")
  const [date, setDate] = useState(
    new Date().toLocaleDateString("sv", { timeZone: "Africa/Cairo" })
  )
  const [isRecurring, setIsRecurring] = useState(false)
  const [isPaid, setIsPaid] = useState(false)
  const [includesVat, setIncludesVat] = useState(false)

  // Equipment-specific
  const [usefulLifeMonths, setUsefulLifeMonths] = useState("")

  // Salary-specific
  const [staffName, setStaffName] = useState("")
  const [staffRole, setStaffRole] = useState("")

  // Receipt
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null)
  const [receiptName, setReceiptName] = useState<string | null>(null)

  // Submission
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ── Derived ──────────────────────────────────────────────────────────────
  const rawAmount = Number(amountEGP) || 0
  const baseAmount = includesVat ? Math.round(rawAmount / 1.14) : rawAmount
  const vatAmount = rawAmount - baseAmount
  const monthlyDepreciation =
    category === "equipment" && usefulLifeMonths
      ? Math.round(rawAmount / Number(usefulLifeMonths))
      : null

  // ── Handlers ─────────────────────────────────────────────────────────────
  function reset() {
    setCategory("")
    setDescription("")
    setVendorName("")
    setAmountEGP("")
    setDate(new Date().toLocaleDateString("sv", { timeZone: "Africa/Cairo" }))
    setIsRecurring(false)
    setIsPaid(false)
    setIncludesVat(false)
    setUsefulLifeMonths("")
    setStaffName("")
    setStaffRole("")
    setReceiptUrl(null)
    setReceiptName(null)
    setError(null)
  }

  function handleClose() {
    reset()
    onClose()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!category || !description.trim() || !amountEGP || !date) {
      setError(t("addErrorRequired"))
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch("/api/financials/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          description: description.trim(),
          vendorName: vendorName.trim() || null,
          amountEGP: rawAmount,
          date,
          isRecurring,
          isPaid,
          usefulLifeMonths:
            category === "equipment" && usefulLifeMonths
              ? Number(usefulLifeMonths)
              : null,
          staffName: category === "salary" && staffName.trim() ? staffName.trim() : null,
          staffRole: category === "salary" && staffRole.trim() ? staffRole.trim() : null,
          receiptUrl,
          receiptName,
        }),
      })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error ?? t("addErrorSave"))
      }
      const created: ExpenseRow = await res.json()
      onSuccess(created)
      handleClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("addErrorGeneric"))
    } finally {
      setSubmitting(false)
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent
        className="max-h-[90vh] max-w-lg overflow-y-auto"
        dir="rtl"
      >
        <DialogHeader>
          <DialogTitle>{t("addExpenseTitle")}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* ── Category ─────────────────────────────────────────────── */}
          <div className="space-y-1.5">
            <Label>
              {t("addLabelCategory")} <span className="text-destructive">*</span>
            </Label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as Category)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("addSelectCategoryPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_VALUES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {t(c.tKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* ── Description ──────────────────────────────────────────── */}
          <div className="space-y-1.5">
            <Label>
              {t("addLabelDescription")} <span className="text-destructive">*</span>
            </Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("addDescriptionPlaceholder")}
              required
            />
          </div>

          {/* ── Vendor ───────────────────────────────────────────────── */}
          <div className="space-y-1.5">
            <Label>{t("addLabelVendor")}</Label>
            <Input
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
              placeholder={t("addVendorPlaceholder")}
            />
          </div>

          {/* ── Amount + VAT ─────────────────────────────────────────── */}
          <div className="space-y-1.5">
            <Label>
              {t("addLabelAmount")} <span className="text-destructive">*</span>
            </Label>
            <Input
              type="number"
              min="0"
              value={amountEGP}
              onChange={(e) => setAmountEGP(e.target.value)}
              placeholder="0"
              className="[direction:ltr]"
              required
            />
          </div>

          {/* VAT checkbox */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includesVat}
              onChange={(e) => setIncludesVat(e.target.checked)}
              className="h-4 w-4 rounded accent-primary"
            />
            <span className="text-sm">{t("addVatCheckbox")}</span>
          </label>
          {includesVat && rawAmount > 0 && (
            <div className="rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground space-y-0.5">
              <p>
                {t("addVatBaseLabel")}{" "}
                <span className="font-medium text-foreground">
                  {baseAmount.toLocaleString("ar-EG")} {t("currencySuffix")}
                </span>
              </p>
              <p>
                {t("addVatTaxLabel")}{" "}
                <span className="font-medium text-foreground">
                  {vatAmount.toLocaleString("ar-EG")} {t("currencySuffix")}
                </span>
              </p>
            </div>
          )}

          {/* ── Date ─────────────────────────────────────────────────── */}
          <div className="space-y-1.5">
            <Label>
              {t("addLabelDate")} <span className="text-destructive">*</span>
            </Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="[direction:ltr]"
              required
            />
          </div>

          {/* ── Equipment fields ──────────────────────────────────────── */}
          {category === "equipment" && (
            <div className="space-y-3 rounded-xl border bg-slate-50/50 p-3">
              <p className="text-xs font-semibold text-muted-foreground">
                {t("addEquipmentSectionTitle")}
              </p>
              <div className="space-y-1.5">
                <Label>{t("addEquipmentLifeLabel")}</Label>
                <Input
                  type="number"
                  min="1"
                  value={usefulLifeMonths}
                  onChange={(e) => setUsefulLifeMonths(e.target.value)}
                  placeholder={t("addEquipmentLifePlaceholder")}
                  className="[direction:ltr]"
                />
              </div>
              {monthlyDepreciation !== null && rawAmount > 0 && (
                <div className="rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground space-y-0.5">
                  <p>
                    {t("monthlyDepreciationLabel")}{" "}
                    <span className="font-medium text-foreground">
                      {rawAmount.toLocaleString("ar-EG")} {t("currencySuffix")} ÷ {usefulLifeMonths} {t("monthsUnit")} ={" "}
                      {monthlyDepreciation.toLocaleString("ar-EG")} {t("egpPerMonth")}
                    </span>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── Salary fields ─────────────────────────────────────────── */}
          {category === "salary" && (
            <div className="space-y-3 rounded-xl border bg-purple-50/40 p-3">
              <p className="text-xs font-semibold text-muted-foreground">
                {t("addSalarySectionTitle")}
              </p>
              <div className="space-y-1.5">
                <Label>{t("addStaffNameLabel")}</Label>
                <Input
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  placeholder={t("addStaffNamePlaceholder")}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("addStaffRoleLabel")}</Label>
                <Input
                  value={staffRole}
                  onChange={(e) => setStaffRole(e.target.value)}
                  placeholder={t("addStaffRolePlaceholder")}
                />
              </div>
            </div>
          )}

          {/* ── Recurring + Paid toggles ──────────────────────────────── */}
          <div className="flex flex-col gap-2.5">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="h-4 w-4 rounded accent-primary"
              />
              <span className="text-sm">{t("addRecurring")}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isPaid}
                onChange={(e) => setIsPaid(e.target.checked)}
                className="h-4 w-4 rounded accent-primary"
              />
              <span className="text-sm">{t("addMarkPaid")}</span>
            </label>
          </div>

          {/* ── Receipt upload ────────────────────────────────────────── */}
          <div className="space-y-1.5">
            <Label>{t("addReceiptLabel")}</Label>
            <ReceiptUpload
              receiptUrl={receiptUrl}
              receiptName={receiptName}
              onChange={(url, name) => {
                setReceiptUrl(url)
                setReceiptName(name)
              }}
            />
          </div>

          {/* Error */}
          {error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          )}

          {/* ── Footer ───────────────────────────────────────────────── */}
          <DialogFooter className="flex-row-reverse gap-2 pt-2">
            <Button type="submit" disabled={submitting}>
              {submitting ? t("saving") : t("save")}
            </Button>
            <Button type="button" variant="outline" onClick={handleClose}>
              {t("cancel")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
