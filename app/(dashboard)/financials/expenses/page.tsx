"use client"

import { useState, useEffect, useCallback } from "react"
import { ChevronRight, ChevronLeft, Plus, Settings2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { ExpenseList, type FilterChip } from "@/components/financials/ExpenseList"
import { AddExpenseModal } from "@/components/financials/AddExpenseModal"
import { SalarySection } from "@/components/financials/SalarySection"
import type { ExpenseRow, ExpensesApiResponse } from "@/app/api/financials/expenses/route"
import type { BudgetMap } from "@/app/api/financials/budget/route"

// ─── Constants ────────────────────────────────────────────────────────────────

const BUDGET_CATEGORIES: { key: string; label: string }[] = [
  { key: "rent", label: "إيجار" },
  { key: "utilities", label: "مرافق" },
  { key: "supplies", label: "مستلزمات" },
  { key: "salary", label: "رواتب" },
  { key: "equipment", label: "معدات" },
  { key: "other", label: "أخرى" },
]

// Bug 5 fix: filter chips live at page level so they never move
const FILTER_CHIPS: { key: FilterChip; label: string }[] = [
  { key: "all", label: "الكل" },
  { key: "rent", label: "إيجار" },
  { key: "utilities", label: "مرافق" },
  { key: "supplies", label: "مستلزمات" },
  { key: "salary", label: "رواتب" },
  { key: "equipment", label: "معدات" },
  { key: "other", label: "أخرى" },
  { key: "outstanding", label: "مستحق" },
]

// ─── Date helpers ─────────────────────────────────────────────────────────────

function cairoMonthKey(date?: Date): string {
  return (date ?? new Date()).toLocaleDateString("sv", {
    timeZone: "Africa/Cairo",
  }).slice(0, 7) // YYYY-MM
}

function shiftMonth(monthKey: string, delta: number): string {
  const [y, m] = monthKey.split("-").map(Number)
  const newM = m + delta
  if (newM < 1) return `${y - 1}-12`
  if (newM > 12) return `${y + 1}-01`
  return `${y}-${String(newM).padStart(2, "0")}`
}

function formatMonthLabel(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number)
  return new Date(Date.UTC(y, m - 1, 15)).toLocaleDateString("ar-EG", {
    month: "long",
    year: "numeric",
  })
}

// ─── Budget progress bar ──────────────────────────────────────────────────────

function BudgetBar({
  label,
  budgetAmount,
  spentAmount,
}: {
  label: string
  budgetAmount: number
  spentAmount: number
}) {
  const pct = budgetAmount > 0 ? Math.min(200, Math.round((spentAmount / budgetAmount) * 100)) : 0
  const isOver = spentAmount > budgetAmount
  const isAmber = !isOver && pct >= 80

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium">{label}</span>
        <span className={`tabular-nums ${isOver ? "text-red-600 font-semibold" : "text-muted-foreground"}`}>
          {spentAmount.toLocaleString("ar-EG")} / {budgetAmount.toLocaleString("ar-EG")} ج.م
          {isOver && " ⚠"}
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            isOver ? "bg-red-500" : isAmber ? "bg-amber-400" : "bg-emerald-500"
          }`}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
    </div>
  )
}

// ─── Budget editor modal ──────────────────────────────────────────────────────

function BudgetModal({
  open,
  budget,
  onClose,
  onSaved,
}: {
  open: boolean
  budget: BudgetMap
  onClose: () => void
  onSaved: (b: BudgetMap) => void
}) {
  const [values, setValues] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      const init: Record<string, string> = {}
      for (const { key } of BUDGET_CATEGORIES) {
        init[key] = budget[key] != null ? String(budget[key]) : ""
      }
      setValues(init)
      setError(null)
    }
  }, [open, budget])

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const payload: BudgetMap = {}
      for (const { key } of BUDGET_CATEGORIES) {
        const v = Number(values[key] ?? 0)
        if (!isNaN(v) && v >= 0) payload[key] = v
      }
      const res = await fetch("/api/financials/budget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ budget: payload }),
      })
      if (!res.ok) throw new Error("فشل الحفظ")
      const { budget: saved } = await res.json()
      onSaved(saved)
      onClose()
    } catch {
      setError("حدث خطأ أثناء الحفظ")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm" dir="rtl">
        <DialogHeader>
          <DialogTitle>تعديل الميزانية الشهرية</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          {BUDGET_CATEGORIES.map(({ key, label }) => (
            <div key={key} className="flex items-center gap-3">
              <Label className="w-24 shrink-0 text-sm">{label}</Label>
              <Input
                type="number"
                min="0"
                value={values[key] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
                placeholder="0"
                className="[direction:ltr]"
              />
              <span className="text-xs text-muted-foreground shrink-0">ج.م</span>
            </div>
          ))}
          {error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          )}
        </div>
        <DialogFooter className="flex-row-reverse gap-2">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "جاري الحفظ..." : "حفظ الميزانية"}
          </Button>
          <Button variant="outline" onClick={onClose}>
            إلغاء
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ExpensesPage() {
  const today = cairoMonthKey()

  // ── State ────────────────────────────────────────────────────────────────
  const [selectedMonth, setSelectedMonth] = useState(today)
  const [filter, setFilter] = useState<FilterChip>("all")
  const [expenses, setExpenses] = useState<ExpenseRow[]>([])
  const [stats, setStats] = useState<{ thisMonthTotal: number; lastMonthTotal: number }>({
    thisMonthTotal: 0,
    lastMonthTotal: 0,
  })
  const [budget, setBudget] = useState<BudgetMap>({})
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showBudgetModal, setShowBudgetModal] = useState(false)

  // ── Fetch budget (once) ──────────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/financials/budget")
      .then((r) => r.json())
      .then(({ budget: b }) => setBudget(b ?? {}))
      .catch(() => {})
  }, [])

  // ── Fetch expenses ───────────────────────────────────────────────────────
  const fetchExpenses = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()

      if (filter === "outstanding") {
        params.set("category", "outstanding")
        // no month filter — show all unpaid
      } else if (filter === "salary") {
        params.set("category", "salary")
        // no month filter — full history needed for SalarySection
      } else {
        // Bug 4 fix: always fetch ALL categories for the month.
        // Never send ?category= here — that zeroes out other chips' counts.
        // Client-side filtering in ExpenseList handles the active chip.
        params.set("month", selectedMonth)
      }

      const res = await fetch(`/api/financials/expenses?${params}`)
      if (res.ok) {
        const data: ExpensesApiResponse = await res.json()
        setExpenses(data.expenses)
        setStats(data.stats)
      }
    } finally {
      setLoading(false)
    }
  }, [selectedMonth, filter])

  useEffect(() => {
    fetchExpenses()
  }, [fetchExpenses])

  // ── Expense update handler ───────────────────────────────────────────────
  function handleExpenseUpdate(updated: ExpenseRow) {
    setExpenses((prev) => prev.map((e) => (e.id === updated.id ? updated : e)))
  }

  // ── Add expense success ──────────────────────────────────────────────────
  function handleAddSuccess() {
    fetchExpenses()
  }

  // ── Compute per-category spending for budget bars ────────────────────────
  // With Bug 1 fixed in route.ts, expenses now contains only the selected
  // month's entries, so spentByCategory is automatically correct.
  const spentByCategory: Record<string, number> = {}
  if (filter !== "outstanding" && filter !== "salary") {
    for (const e of expenses) {
      spentByCategory[e.category] = (spentByCategory[e.category] ?? 0) + e.amountEGP
    }
  }

  const hasBudget = Object.keys(budget).length > 0 && Object.values(budget).some((v) => v > 0)

  // ── Month navigation ─────────────────────────────────────────────────────
  function navigate(delta: -1 | 1) {
    setSelectedMonth((m) => shiftMonth(m, delta))
    if (filter !== "outstanding" && filter !== "salary") {
      setFilter("all")
    }
  }

  // ── Chip counts ──────────────────────────────────────────────────────────
  // Always accurate because we now fetch all categories for the month.
  function chipCount(key: FilterChip): number | null {
    if (filter === "salary") return null // don't show counts in salary view
    if (key === "all") return expenses.length
    if (key === "outstanding") return expenses.filter((e) => !e.isPaid).length
    return expenses.filter((e) => e.category === key).length
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-5 p-4 md:p-6" dir="rtl">
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">المصروفات</h1>
        <Button
          size="sm"
          className="h-9 gap-1.5"
          onClick={() => setShowAddModal(true)}
        >
          <Plus className="h-4 w-4" />
          إضافة مصروف
        </Button>
      </div>

      {/* ── Month navigation (hidden for outstanding + salary) ───────────── */}
      {filter !== "outstanding" && filter !== "salary" && (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="min-w-[130px] text-center text-sm font-semibold">
            {formatMonthLabel(selectedMonth)}
          </span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="mr-2 h-8 text-xs"
            onClick={() => {
              setSelectedMonth(today)
              setFilter("all")
            }}
          >
            الشهر الحالي
          </Button>
        </div>
      )}

      {/* ── Stats cards (hidden for salary) ─────────────────────────────── */}
      {filter !== "salary" && (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground mb-1">هذا الشهر</p>
            <p className="text-2xl font-bold tabular-nums">
              {stats.thisMonthTotal.toLocaleString("ar-EG")}
              <span className="text-base font-normal text-muted-foreground mr-1">ج.م</span>
            </p>
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground mb-1">الشهر الماضي</p>
            <p className="text-2xl font-bold tabular-nums text-muted-foreground">
              {stats.lastMonthTotal.toLocaleString("ar-EG")}
              <span className="text-base font-normal mr-1">ج.م</span>
            </p>
            {stats.lastMonthTotal > 0 && (
              <p
                className={`text-xs mt-1 ${
                  stats.thisMonthTotal > stats.lastMonthTotal
                    ? "text-red-500"
                    : "text-emerald-600"
                }`}
              >
                {stats.thisMonthTotal > stats.lastMonthTotal ? "▲" : "▼"}
                {" "}
                {Math.abs(
                  Math.round(
                    ((stats.thisMonthTotal - stats.lastMonthTotal) / stats.lastMonthTotal) * 100
                  )
                )}
                % مقارنة بالشهر الماضي
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Budget vs Actual (hidden for outstanding + salary) ───────────── */}
      {filter !== "outstanding" && filter !== "salary" && (
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">الميزانية مقابل الفعلي</h2>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={() => setShowBudgetModal(true)}
            >
              <Settings2 className="h-3.5 w-3.5" />
              {hasBudget ? "تعديل الميزانية" : "إنشاء ميزانية"}
            </Button>
          </div>

          {hasBudget ? (
            <div className="space-y-3">
              {BUDGET_CATEGORIES.map(({ key, label }) => {
                const budgeted = budget[key] ?? 0
                if (budgeted === 0) return null
                return (
                  <BudgetBar
                    key={key}
                    label={label}
                    budgetAmount={budgeted}
                    spentAmount={spentByCategory[key] ?? 0}
                  />
                )
              })}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed py-6 text-center text-sm text-muted-foreground">
              <p>لم يتم تحديد ميزانية بعد</p>
              <Button
                variant="link"
                size="sm"
                className="mt-1 text-xs h-auto p-0"
                onClick={() => setShowBudgetModal(true)}
              >
                إنشاء ميزانية الآن ←
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ── Filter chips — Bug 5 fix: always at page level, never inside ExpenseList ── */}
      <div className="flex gap-2 flex-wrap">
        {FILTER_CHIPS.map(({ key, label }) => {
          const count = chipCount(key)
          return (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`rounded-full px-3.5 py-1 text-xs font-medium transition-colors ${
                filter === key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/70"
              }`}
            >
              {label}
              {count !== null && key !== "all" && (
                <span className="mr-1 opacity-60">({count})</span>
              )}
            </button>
          )
        })}
      </div>

      {/* ── Loading skeleton ─────────────────────────────────────────────── */}
      {loading && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      )}

      {/* ── Content — Bug 5 fix: same card container for both views ─────── */}
      {!loading && (
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          {filter === "salary" ? (
            <>
              <h2 className="mb-3 text-sm font-semibold">كشف الرواتب</h2>
              <SalarySection expenses={expenses} />
            </>
          ) : (
            <>
              <h2 className="mb-3 text-sm font-semibold">قائمة المصروفات</h2>
              <ExpenseList
                expenses={expenses}
                filter={filter}
                onUpdate={handleExpenseUpdate}
              />
            </>
          )}
        </div>
      )}

      {/* ── Modals ──────────────────────────────────────────────────────── */}
      <AddExpenseModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleAddSuccess}
      />

      <BudgetModal
        open={showBudgetModal}
        budget={budget}
        onClose={() => setShowBudgetModal(false)}
        onSaved={(b) => setBudget(b)}
      />
    </div>
  )
}
