"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { ExpenseRow } from "@/app/api/financials/expenses/route"
import { ChevronDown, ChevronUp, CheckCircle2, User } from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  expenses: ExpenseRow[] // all salary expenses, all time
}

interface StaffCard {
  staffName: string
  staffRole: string | null
  latestExpense: ExpenseRow
  history: ExpenseRow[] // sorted desc by date
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function currentMonthKey(): string {
  return new Date().toLocaleDateString("sv", { timeZone: "Africa/Cairo" }).slice(0, 7)
}

function formatMonthLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("ar-EG", {
    timeZone: "Africa/Cairo",
    month: "long",
    year: "numeric",
  })
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ar-EG", {
    timeZone: "Africa/Cairo",
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

// Group salary expenses by staffName (fallback for anonymous)
function groupByStaff(expenses: ExpenseRow[], anonymousLabel: string): StaffCard[] {
  const map = new Map<string, ExpenseRow[]>()
  for (const e of expenses) {
    const key = e.staffName ?? anonymousLabel
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(e)
  }

  const cards: StaffCard[] = []
  map.forEach((rows, staffName) => {
    rows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    cards.push({
      staffName,
      staffRole: rows[0].staffRole,
      latestExpense: rows[0],
      history: rows.slice(0, 6),
    })
  })

  return cards.sort((a, b) => a.staffName.localeCompare(b.staffName, "ar"))
}

// Build a human-readable description for the salary payment entry
function buildDescription(
  t: ReturnType<typeof useTranslations>,
  staffName: string,
  bonus: number,
  bonusReason: string,
  deductions: number,
  deductionReason: string,
  advance: number,
  overtimeHours: number,
  overtimeRate: number
): string {
  const parts: string[] = [t("salaryDescBase", { name: staffName })]
  if (bonus > 0) {
    parts.push(
      bonusReason
        ? t("salaryDescBonusReason", { amount: bonus.toLocaleString("ar-EG"), reason: bonusReason })
        : t("salaryDescBonus", { amount: bonus.toLocaleString("ar-EG") })
    )
  }
  if (deductions > 0) {
    parts.push(
      deductionReason
        ? t("salaryDescDeductionReason", { amount: deductions.toLocaleString("ar-EG"), reason: deductionReason })
        : t("salaryDescDeduction", { amount: deductions.toLocaleString("ar-EG") })
    )
  }
  if (advance > 0) parts.push(t("salaryDescAdvance", { amount: advance.toLocaleString("ar-EG") }))
  if (overtimeHours > 0 && overtimeRate > 0) {
    parts.push(t("salaryDescOvertime", { hours: overtimeHours, rate: overtimeRate.toLocaleString("ar-EG") }))
  }
  return parts.join(" | ")
}

// ─── Number input helper ──────────────────────────────────────────────────────

function NumInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  placeholder?: string
}) {
  return (
    <div className="contents">
      <span className="text-muted-foreground text-xs">{label}</span>
      <Input
        type="number"
        min="0"
        value={value === 0 ? "" : value}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
        placeholder={placeholder ?? "0"}
        className="h-7 text-xs [direction:ltr] px-2"
      />
    </div>
  )
}

// ─── Staff card ───────────────────────────────────────────────────────────────

function StaffCard({ card }: { card: StaffCard }) {
  const t = useTranslations("financials")
  const monthKey = currentMonthKey()
  const paidKey = `salary_paid_${card.staffName}_${monthKey}`

  const [paidThisMonth, setPaidThisMonth] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showAdjustments, setShowAdjustments] = useState(false)
  const [marking, setMarking] = useState(false)

  // Adjustment fields (Bug 6)
  const [bonus, setBonus] = useState(0)
  const [bonusReason, setBonusReason] = useState("")
  const [deductions, setDeductions] = useState(0)
  const [deductionReason, setDeductionReason] = useState("")
  const [advance, setAdvance] = useState(0)
  const [overtimeHours, setOvertimeHours] = useState(0)
  const [overtimeRate, setOvertimeRate] = useState(0)

  useEffect(() => {
    setPaidThisMonth(localStorage.getItem(paidKey) === "1" || card.latestExpense.isPaid)
  }, [paidKey, card.latestExpense.isPaid])

  const baseSalary = card.latestExpense.amountEGP
  const overtimePay = overtimeHours * overtimeRate
  // Bug 6: live net pay calculation
  const netPay = baseSalary + bonus + advance - deductions + overtimePay

  async function handleMarkPaid() {
    if (paidThisMonth || marking) return
    setMarking(true)
    try {
      const now = new Date()
      const firstOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`
      // POST a new salary expense with the computed net pay and breakdown in description
      const res = await fetch("/api/financials/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "salary",
          description: buildDescription(
            t,
            card.staffName,
            bonus,
            bonusReason,
            deductions,
            deductionReason,
            advance,
            overtimeHours,
            overtimeRate
          ),
          amountEGP: netPay,
          date: firstOfMonth,
          isRecurring: false,
          isPaid: true,
          staffName: card.staffName,
          staffRole: card.staffRole,
        }),
      })
      if (res.ok) {
        localStorage.setItem(paidKey, "1")
        setPaidThisMonth(true)
      }
    } finally {
      setMarking(false)
    }
  }

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-700">
          <User className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">{card.staffName}</p>
          {card.staffRole && (
            <p className="text-xs text-muted-foreground">{card.staffRole}</p>
          )}
        </div>
        <Badge
          className={`shrink-0 border-0 ${
            paidThisMonth
              ? "bg-emerald-100 text-emerald-700"
              : "bg-amber-100 text-amber-700"
          }`}
        >
          {paidThisMonth ? t("salaryPaidThisMonth") : t("salaryNotPaidYet")}
        </Badge>
      </div>

      {/* Salary breakdown — Bug 6: shows all fields with live net pay */}
      <div className="border-t bg-muted/30 px-4 py-3 space-y-2 text-sm">
        {/* Base salary (read-only) */}
        <div className="grid grid-cols-2 gap-y-1.5">
          <span className="text-muted-foreground">{t("salaryBaseSalary")}</span>
          <span className="font-medium tabular-nums text-left">
            {baseSalary.toLocaleString("ar-EG")} {t("currencySuffix")}
          </span>
        </div>

        {/* Adjustments toggle */}
        <button
          type="button"
          className="flex items-center gap-1 text-xs text-primary hover:underline"
          onClick={() => setShowAdjustments((v) => !v)}
        >
          {showAdjustments ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          {showAdjustments ? t("salaryHideAdjustments") : t("salaryShowAdjustments")}
        </button>

        {showAdjustments && (
          <div className="grid grid-cols-2 gap-x-3 gap-y-2 items-center pt-1">
            {/* Bonus */}
            <NumInput label={t("salaryBonusLabel")} value={bonus} onChange={setBonus} />
            <div className="contents">
              <span className="text-muted-foreground text-xs">{t("salaryBonusReason")}</span>
              <Input
                value={bonusReason}
                onChange={(e) => setBonusReason(e.target.value)}
                placeholder={t("salaryOptionalPlaceholder")}
                className="h-7 text-xs px-2"
              />
            </div>

            {/* Deductions */}
            <NumInput label={t("salaryDeductionsLabel")} value={deductions} onChange={setDeductions} />
            <div className="contents">
              <span className="text-muted-foreground text-xs">{t("salaryDeductionReason")}</span>
              <Input
                value={deductionReason}
                onChange={(e) => setDeductionReason(e.target.value)}
                placeholder={t("salaryOptionalPlaceholder")}
                className="h-7 text-xs px-2"
              />
            </div>

            {/* Advance */}
            <NumInput label={t("salaryAdvanceLabel")} value={advance} onChange={setAdvance} />
            <div className="col-span-1" /> {/* spacer */}

            {/* Overtime */}
            <NumInput label={t("salaryOvertimeHours")} value={overtimeHours} onChange={setOvertimeHours} placeholder="0" />
            <NumInput label={t("salaryOvertimeRate")} value={overtimeRate} onChange={setOvertimeRate} placeholder="0" />
            {overtimeHours > 0 && overtimeRate > 0 && (
              <>
                <span className="text-muted-foreground text-xs">{t("salaryOvertimeTotal")}</span>
                <span className="text-xs font-medium tabular-nums text-left">
                  {overtimePay.toLocaleString("ar-EG")} {t("currencySuffix")}
                </span>
              </>
            )}
          </div>
        )}

        {/* Net pay — always visible, updates live */}
        <div className="grid grid-cols-2 gap-y-1 pt-1 border-t mt-1">
          <span className="font-semibold text-sm">{t("salaryNetSalary")}</span>
          <span
            className={`font-bold tabular-nums text-left text-base ${
              netPay !== baseSalary ? "text-primary" : "text-foreground"
            }`}
          >
            {netPay.toLocaleString("ar-EG")} {t("currencySuffix")}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 border-t px-4 py-3">
        <Button
          size="sm"
          variant={paidThisMonth ? "secondary" : "default"}
          className="h-8 gap-1.5 text-xs"
          onClick={handleMarkPaid}
          disabled={paidThisMonth || marking}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          {paidThisMonth ? t("salaryConfirmed") : marking ? t("salaryConfirming") : t("salaryConfirmThisMonth")}
        </Button>

        <button
          className="mr-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setShowHistory((v) => !v)}
        >
          {showHistory ? (
            <>
              <ChevronUp className="h-3.5 w-3.5" />
              {t("salaryHideHistory")}
            </>
          ) : (
            <>
              <ChevronDown className="h-3.5 w-3.5" />
              {t("salaryLastMonths", { count: card.history.length })}
            </>
          )}
        </button>
      </div>

      {/* History */}
      {showHistory && (
        <div className="border-t divide-y">
          {card.history.map((h) => (
            <div
              key={h.id}
              className="flex items-center justify-between px-4 py-2.5 text-sm"
            >
              <div>
                <p className="text-xs font-medium">{formatMonthLabel(h.date)}</p>
                <p className="text-[11px] text-muted-foreground">{formatDate(h.date)}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="tabular-nums text-sm font-medium">
                  {h.amountEGP.toLocaleString("ar-EG")} {t("currencySuffix")}
                </span>
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    h.isPaid
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {h.isPaid ? t("statusPaid") : t("statusUnpaid")}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SalarySection({ expenses }: Props) {
  const t = useTranslations("financials")
  const salaryExpenses = expenses.filter((e) => e.category === "salary")
  const cards = groupByStaff(salaryExpenses, t("salaryAnonymous"))

  if (cards.length === 0) {
    return (
      <div
        dir="rtl"
        className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground"
      >
        {t("salaryNoRecords")}
      </div>
    )
  }

  const totalPayroll = cards.reduce((s, c) => s + c.latestExpense.amountEGP, 0)

  return (
    <div dir="rtl" className="space-y-4">
      {/* Summary */}
      <div className="rounded-xl border bg-purple-50/40 px-4 py-3 flex items-center justify-between">
        <span className="text-sm font-medium text-purple-800">
          {t("salaryTotalPayroll")}
        </span>
        <span className="text-lg font-bold tabular-nums text-purple-900">
          {totalPayroll.toLocaleString("ar-EG")} {t("currencySuffix")}
        </span>
      </div>

      {/* Cards */}
      <div className="space-y-3">
        {cards.map((card) => (
          <StaffCard key={card.staffName} card={card} />
        ))}
      </div>
    </div>
  )
}
