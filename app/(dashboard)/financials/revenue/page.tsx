"use client"

import { useState, useEffect, useCallback } from "react"
import { ChevronRight, ChevronLeft, GitCompare } from "lucide-react"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RevenueStatCards } from "@/components/financials/RevenueStatCards"

const RevenueChart = dynamic(
  () => import("@/components/financials/RevenueChart").then((m) => ({ default: m.RevenueChart })),
  {
    ssr: false,
    loading: () => (
      <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
        جاري تحميل الرسم...
      </div>
    ),
  }
)
import { RevenueList, type FilterChip } from "@/components/financials/RevenueList"
import { MarkAsPaidModal } from "@/components/financials/MarkAsPaidModal"
import { InvoiceModal } from "@/components/financials/InvoiceModal"
import type {
  RevenueApiResponse,
  RevenueRow,
} from "@/app/api/financials/revenue/route"

// ─── Date helpers ─────────────────────────────────────────────────────────────

function todayCairo(): string {
  return new Date().toLocaleDateString("sv", { timeZone: "Africa/Cairo" })
}

function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number)
  const ms = Date.UTC(y, m - 1, d) + days * 86_400_000
  return new Date(ms).toISOString().slice(0, 10)
}

function getWeekRange(dateStr: string): [string, string] {
  const [y, m, d] = dateStr.split("-").map(Number)
  const ms = Date.UTC(y, m - 1, d)
  const dow = new Date(ms).getUTCDay() // 0=Sun
  const sunMs = ms - dow * 86_400_000
  return [
    new Date(sunMs).toISOString().slice(0, 10),
    new Date(sunMs + 6 * 86_400_000).toISOString().slice(0, 10),
  ]
}

function getMonthRange(dateStr: string): [string, string] {
  const [y, m] = dateStr.split("-").map(Number)
  const first = `${y}-${String(m).padStart(2, "0")}-01`
  // Last day: day-0 of next month
  const lastMs = Date.UTC(y, m, 0)
  return [first, new Date(lastMs).toISOString().slice(0, 10)]
}

function formatRangeLabel(from: string, to: string, period: Period): string {
  const fmt = (s: string) =>
    new Date(`${s}T12:00:00Z`).toLocaleDateString("ar-EG", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })

  if (period === "day") return fmt(from)
  if (period === "month") {
    const [y, m] = from.split("-").map(Number)
    return new Date(`${y}-${String(m).padStart(2, "0")}-01T12:00:00Z`).toLocaleDateString("ar-EG", {
      month: "long",
      year: "numeric",
    })
  }
  // week
  const fmtShort = (s: string) =>
    new Date(`${s}T12:00:00Z`).toLocaleDateString("ar-EG", {
      day: "numeric",
      month: "short",
    })
  return `${fmtShort(from)} — ${fmtShort(to)}`
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Period = "day" | "week" | "month"

// ─── Page component ───────────────────────────────────────────────────────────

export default function RevenuePage() {
  const today = todayCairo()

  // ── Date range state ────────────────────────────────────────────────────────
  const [period, setPeriod] = useState<Period>("day")
  const [primaryFrom, setPrimaryFrom] = useState(today)
  const [primaryTo, setPrimaryTo] = useState(today)
  const [compareEnabled, setCompareEnabled] = useState(false)
  const [compareFrom, setCompareFrom] = useState(addDays(today, -1))
  const [compareTo, setCompareTo] = useState(addDays(today, -1))

  // ── Data state ──────────────────────────────────────────────────────────────
  const [data, setData] = useState<RevenueApiResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<FilterChip>("all")
  const [markingRow, setMarkingRow] = useState<RevenueRow | null>(null)
  const [invoiceRow, setInvoiceRow] = useState<RevenueRow | null>(null)

  // ── Fetch data ──────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        from: primaryFrom,
        to: primaryTo,
        period,
      })
      if (compareEnabled && compareFrom && compareTo) {
        params.set("compareFrom", compareFrom)
        params.set("compareTo", compareTo)
      }
      const res = await fetch(`/api/financials/revenue?${params.toString()}`)
      if (res.ok) {
        const json: RevenueApiResponse = await res.json()
        setData(json)
      }
    } finally {
      setLoading(false)
    }
  }, [primaryFrom, primaryTo, period, compareEnabled, compareFrom, compareTo])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ── Period toggle ───────────────────────────────────────────────────────────
  function switchPeriod(p: Period) {
    setPeriod(p)
    if (p === "day") {
      setPrimaryFrom(today)
      setPrimaryTo(today)
      setCompareFrom(addDays(today, -1))
      setCompareTo(addDays(today, -1))
    } else if (p === "week") {
      const [s, e] = getWeekRange(today)
      setPrimaryFrom(s)
      setPrimaryTo(e)
      setCompareFrom(addDays(s, -7))
      setCompareTo(addDays(e, -7))
    } else {
      const [s, e] = getMonthRange(today)
      setPrimaryFrom(s)
      setPrimaryTo(e)
      const [cs, ce] = getMonthRange(addDays(s, -1))
      setCompareFrom(cs)
      setCompareTo(ce)
    }
  }

  // ── Prev / Next navigation ───────────────────────────────────────────────────
  function navigate(dir: -1 | 1) {
    if (period === "day") {
      const next = addDays(primaryFrom, dir)
      setPrimaryFrom(next)
      setPrimaryTo(next)
      setCompareFrom(addDays(next, -1))
      setCompareTo(addDays(next, -1))
    } else if (period === "week") {
      const next = addDays(primaryFrom, dir * 7)
      const [s, e] = getWeekRange(next)
      setPrimaryFrom(s)
      setPrimaryTo(e)
      setCompareFrom(addDays(s, -7))
      setCompareTo(addDays(e, -7))
    } else {
      // month: shift by ±1 month
      const [y, m] = primaryFrom.split("-").map(Number)
      const newMonth = m + dir
      const adjY = newMonth < 1 ? y - 1 : newMonth > 12 ? y + 1 : y
      const adjM = newMonth < 1 ? 12 : newMonth > 12 ? 1 : newMonth
      const [s, e] = getMonthRange(`${adjY}-${String(adjM).padStart(2, "0")}-01`)
      setPrimaryFrom(s)
      setPrimaryTo(e)
      const [cs, ce] = getMonthRange(addDays(s, -1))
      setCompareFrom(cs)
      setCompareTo(ce)
    }
  }

  // ── Mark as paid success ────────────────────────────────────────────────────
  function handlePaidSuccess(updatedId: string) {
    if (!data) return
    setData({
      ...data,
      primary: {
        ...data.primary,
        rows: data.primary.rows.map((r) =>
          r.id === updatedId ? { ...r, paymentStatus: "paid" } : r
        ),
      },
    })
    // Re-fetch to get fresh stats + chart
    fetchData()
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-5 p-4 md:p-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">الإيرادات</h1>
      </div>

      {/* ── Controls bar ──────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm">
        {/* Row 1: Period toggle + navigation */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Period toggle */}
          <div className="flex rounded-lg border overflow-hidden text-sm">
            {(["day", "week", "month"] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => switchPeriod(p)}
                className={`px-3.5 py-1.5 font-medium transition-colors ${
                  period === p
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
              >
                {p === "day" ? "يوم" : p === "week" ? "أسبوع" : "شهر"}
              </button>
            ))}
          </div>

          {/* Prev / Label / Next */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => navigate(-1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <span className="min-w-[130px] text-center text-sm font-medium">
              {formatRangeLabel(primaryFrom, primaryTo, period)}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => navigate(1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>

          {/* Today shortcut */}
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={() => switchPeriod(period)}
          >
            الآن
          </Button>

          {/* Compare toggle */}
          <Button
            variant={compareEnabled ? "default" : "outline"}
            size="sm"
            className="h-8 gap-1.5 text-xs mr-auto"
            onClick={() => setCompareEnabled((v) => !v)}
          >
            <GitCompare className="h-3.5 w-3.5" />
            مقارنة
          </Button>
        </div>

        {/* Row 2: Date inputs */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3 min-w-0 w-full">
          {/* Primary range */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2 min-w-0 w-full sm:w-auto">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">من</Label>
              <input
                type="date"
                value={primaryFrom}
                onChange={(e) => {
                  setPrimaryFrom(e.target.value)
                  if (e.target.value > primaryTo) setPrimaryTo(e.target.value)
                }}
                className="h-8 w-full min-w-0 rounded-md border bg-background px-2 text-sm [direction:ltr]"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">إلى</Label>
              <input
                type="date"
                value={primaryTo}
                min={primaryFrom}
                onChange={(e) => setPrimaryTo(e.target.value)}
                className="h-8 w-full min-w-0 rounded-md border bg-background px-2 text-sm [direction:ltr]"
              />
            </div>
          </div>

          {/* Compare range — only shown when compare is active */}
          {compareEnabled && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2 border-r pr-4 min-w-0">
              <span className="mb-1.5 text-xs font-medium text-muted-foreground">
                مقارنة:
              </span>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">من</Label>
                <input
                  type="date"
                  value={compareFrom}
                  onChange={(e) => {
                    setCompareFrom(e.target.value)
                    if (e.target.value > compareTo) setCompareTo(e.target.value)
                  }}
                  className="h-8 w-full min-w-0 rounded-md border bg-background px-2 text-sm [direction:ltr]"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">إلى</Label>
                <input
                  type="date"
                  value={compareTo}
                  min={compareFrom}
                  onChange={(e) => setCompareTo(e.target.value)}
                  className="h-8 w-full min-w-0 rounded-md border bg-background px-2 text-sm [direction:ltr]"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Loading skeleton ───────────────────────────────────────────────── */}
      {loading && !data && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      )}

      {/* ── Content ────────────────────────────────────────────────────────── */}
      {data && (
        <>
          {/* Stat cards */}
          <RevenueStatCards
            stats={data.primary.stats}
            prevStats={data.primary.prevStats}
          />

          {/* Chart */}
          <RevenueChart
            chartData={data.primary.chartData}
            compareEnabled={compareEnabled}
          />

          {/* Revenue list */}
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold">قائمة المدفوعات</h2>
            <RevenueList
              rows={data.primary.rows}
              filter={filter}
              onFilterChange={setFilter}
              defaultFee={data.defaultFee}
              onMarkAsPaid={setMarkingRow}
              onViewInvoice={setInvoiceRow}
            />
          </div>
        </>
      )}

      {/* ── Mark as paid modal ─────────────────────────────────────────────── */}
      <MarkAsPaidModal
        row={markingRow}
        defaultFee={data?.defaultFee ?? 250}
        onClose={() => setMarkingRow(null)}
        onSuccess={handlePaidSuccess}
      />

      {/* ── Invoice modal ───────────────────────────────────────────────────── */}
      <InvoiceModal
        row={invoiceRow}
        onClose={() => setInvoiceRow(null)}
      />
    </div>
  )
}
