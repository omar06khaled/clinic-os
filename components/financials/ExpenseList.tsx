"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { useTranslations } from "next-intl"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ReceiptUpload } from "@/components/financials/ReceiptUpload"
import type { ExpenseRow } from "@/app/api/financials/expenses/route"
import {
  Building2,
  Zap,
  ShoppingCart,
  User,
  Monitor,
  Tag,
  RefreshCcw,
  CheckCircle2,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

export type FilterChip =
  | "all"
  | "rent"
  | "utilities"
  | "supplies"
  | "salary"
  | "equipment"
  | "other"
  | "outstanding"

interface Props {
  expenses: ExpenseRow[]
  filter: FilterChip
  // Bug 4/5 fix: onFilterChange removed — chips are now managed at page level
  onUpdate: (updated: ExpenseRow) => void
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  rent:      <Building2 className="h-4 w-4" />,
  utilities: <Zap className="h-4 w-4" />,
  supplies:  <ShoppingCart className="h-4 w-4" />,
  salary:    <User className="h-4 w-4" />,
  equipment: <Monitor className="h-4 w-4" />,
  other:     <Tag className="h-4 w-4" />,
}

const CATEGORY_COLORS: Record<string, string> = {
  rent:      "bg-blue-100 text-blue-700",
  utilities: "bg-yellow-100 text-yellow-700",
  supplies:  "bg-green-100 text-green-700",
  salary:    "bg-purple-100 text-purple-700",
  equipment: "bg-slate-100 text-slate-700",
  other:     "bg-orange-100 text-orange-700",
}

const CATEGORY_TKEYS: Record<string, string> = {
  rent:      "catRent",
  utilities: "catUtilities",
  supplies:  "catSupplies",
  salary:    "catSalary",
  equipment: "catEquipment",
  other:     "catOther",
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function currentMonthKey(): string {
  return new Date().toLocaleDateString("sv", { timeZone: "Africa/Cairo" }).slice(0, 7)
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ar-EG", {
    timeZone: "Africa/Cairo",
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function computeDepreciation(amountEGP: number, usefulLifeMonths: number, purchaseDateISO: string) {
  const purchase = new Date(purchaseDateISO)
  const now = new Date()
  const monthsElapsed = Math.max(
    0,
    (now.getFullYear() - purchase.getFullYear()) * 12 +
      (now.getMonth() - purchase.getMonth())
  )
  const monthly = Math.round(amountEGP / usefulLifeMonths)
  const totalDepreciated = Math.min(amountEGP, monthsElapsed * monthly)
  const monthsRemaining = Math.max(0, usefulLifeMonths - monthsElapsed)
  return { monthly, totalDepreciated, monthsRemaining }
}

// ─── Single expense row ───────────────────────────────────────────────────────

function ExpenseRow({
  expense,
  onUpdate,
}: {
  expense: ExpenseRow
  onUpdate: (updated: ExpenseRow) => void
}) {
  const t = useTranslations("financials")
  const monthKey = currentMonthKey()
  const confirmKey = `rcfm_${expense.id}_${monthKey}`
  const [confirmedThisMonth, setConfirmedThisMonth] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [patchingReceipt, setPatchingReceipt] = useState(false)

  // Load localStorage on client
  useEffect(() => {
    setConfirmedThisMonth(localStorage.getItem(confirmKey) === "1")
  }, [confirmKey])

  async function handleConfirmMonth() {
    if (confirmedThisMonth || confirming) return
    setConfirming(true)
    try {
      // Create a new paid entry for this month (recurring template stays unpaid)
      const now = new Date()
      const firstOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`
      const res = await fetch("/api/financials/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: expense.category,
          description: expense.description,
          vendorName: expense.vendorName,
          amountEGP: expense.amountEGP,
          date: firstOfMonth,
          isRecurring: false,
          isPaid: true,
          usefulLifeMonths: expense.usefulLifeMonths,
          staffName: expense.staffName,
          staffRole: expense.staffRole,
        }),
      })
      if (!res.ok) throw new Error()
      localStorage.setItem(confirmKey, "1")
      setConfirmedThisMonth(true)
    } catch {
      toast.error(t("expToastConfirmError"))
    } finally {
      setConfirming(false)
    }
  }

  async function handleReceiptChange(url: string | null, name: string | null) {
    setPatchingReceipt(true)
    try {
      const res = await fetch(`/api/financials/expenses/${expense.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiptUrl: url, receiptName: name }),
      })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      onUpdate(updated as ExpenseRow)
    } catch {
      toast.error(t("expToastReceiptError"))
    } finally {
      setPatchingReceipt(false)
    }
  }

  const depInfo =
    expense.category === "equipment" && expense.usefulLifeMonths
      ? computeDepreciation(expense.amountEGP, expense.usefulLifeMonths, expense.date)
      : null

  return (
    <div className="group flex flex-col gap-2 rounded-xl border bg-card p-4 shadow-sm hover:shadow transition-shadow">
      <div className="flex items-start gap-3">
        {/* Category icon */}
        <div
          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
            CATEGORY_COLORS[expense.category] ?? "bg-muted text-muted-foreground"
          }`}
        >
          {CATEGORY_ICONS[expense.category] ?? <Tag className="h-4 w-4" />}
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-medium text-sm">{expense.description}</span>
            {expense.isRecurring && (
              <Badge
                variant="outline"
                className="h-4 gap-1 px-1.5 text-[10px] text-blue-600 border-blue-200"
              >
                <RefreshCcw className="h-2.5 w-2.5" />
                {t("expRecurringBadge")}
              </Badge>
            )}
            <Badge
              className={`h-4 px-1.5 text-[10px] border-0 ${
                expense.isPaid
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {expense.isPaid ? t("statusPaid") : t("statusUnpaid")}
            </Badge>
            <Badge
              className={`h-4 px-1.5 text-[10px] border-0 ${
                CATEGORY_COLORS[expense.category] ?? "bg-muted text-muted-foreground"
              }`}
            >
              {t(CATEGORY_TKEYS[expense.category] ?? "catOther")}
            </Badge>
          </div>

          {/* Vendor subtext */}
          {expense.vendorName && (
            <p className="mt-0.5 text-xs text-muted-foreground">{expense.vendorName}</p>
          )}

          {/* Salary subtext */}
          {expense.category === "salary" && expense.staffName && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {expense.staffName}
              {expense.staffRole ? ` — ${expense.staffRole}` : ""}
            </p>
          )}

          {/* Date */}
          <p className="mt-0.5 text-xs text-muted-foreground">{formatDate(expense.date)}</p>

          {/* Equipment depreciation */}
          {depInfo && (
            <div className="mt-2 rounded-lg bg-muted/60 px-3 py-2 text-xs space-y-0.5 text-muted-foreground">
              <p>
                <span className="font-medium text-foreground">
                  {expense.amountEGP.toLocaleString("ar-EG")} {t("currencySuffix")}
                </span>
                {" ÷ "}
                {expense.usefulLifeMonths} {t("monthsUnit")}
                {" = "}
                <span className="font-medium text-foreground">
                  {depInfo.monthly.toLocaleString("ar-EG")} {t("egpPerMonth")}
                </span>
              </p>
              <p>
                <span className="text-amber-600 font-medium">
                  {depInfo.monthsRemaining} {t("monthsRemainingUnit")}
                </span>
              </p>
              <p>
                {t("depreciatedLabel")}{" "}
                <span className="font-medium text-foreground">
                  {depInfo.totalDepreciated.toLocaleString("ar-EG")} {t("currencySuffix")}
                </span>{" "}
                {t("depreciatedOf")}{" "}
                <span className="font-medium text-foreground">
                  {expense.amountEGP.toLocaleString("ar-EG")} {t("currencySuffix")}
                </span>
              </p>
            </div>
          )}
        </div>

        {/* Amount */}
        <div className="text-end shrink-0">
          <span className="font-semibold tabular-nums">
            {expense.amountEGP.toLocaleString("ar-EG")}
          </span>
          <span className="text-xs text-muted-foreground mr-1">{t("currencySuffix")}</span>
        </div>
      </div>

      {/* Receipt + Actions row */}
      <div className="flex flex-wrap items-center gap-2 pr-11">
        {/* Receipt display / upload / remove — handled entirely by ReceiptUpload */}
        <ReceiptUpload
          receiptUrl={expense.receiptUrl}
          receiptName={expense.receiptName}
          onChange={handleReceiptChange}
          disabled={patchingReceipt}
        />

        {/* Confirm for this month (recurring only) */}
        {expense.isRecurring && (
          <Button
            size="sm"
            variant={confirmedThisMonth ? "secondary" : "outline"}
            className="h-7 gap-1.5 text-xs"
            onClick={handleConfirmMonth}
            disabled={confirmedThisMonth || confirming}
          >
            {confirmedThisMonth ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                {t("expConfirmedThisMonth")}
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3.5 w-3.5" />
                {confirming ? t("expConfirming") : t("expConfirmThisMonth")}
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ExpenseList({ expenses, filter, onUpdate }: Props) {
  const t = useTranslations("financials")

  // Client-side filter — page always passes the full month dataset,
  // so chip counts are computed from the same array and are always accurate.
  const filtered =
    filter === "outstanding"
      ? expenses.filter((e) => !e.isPaid)
      : filter === "all"
      ? expenses
      : expenses.filter((e) => e.category === filter)

  return (
    <div className="space-y-3">
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          {t("expNoExpenses")}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((exp) => (
            <ExpenseRow key={exp.id} expense={exp} onUpdate={onUpdate} />
          ))}
        </div>
      )}
    </div>
  )
}
