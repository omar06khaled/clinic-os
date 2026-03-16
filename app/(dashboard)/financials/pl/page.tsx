"use client"

import { useState, useEffect, useCallback } from "react"
import { ChevronRight, ChevronLeft, Printer } from "lucide-react"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { PLSummaryCards } from "@/components/financials/PLSummaryCards"
import type { BarPeriod } from "@/components/financials/PLBarChart"

const PLBarChart = dynamic(
  () => import("@/components/financials/PLBarChart").then((m) => ({ default: m.PLBarChart })),
  {
    ssr: false,
    loading: () => (
      <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
        جاري تحميل الرسم...
      </div>
    ),
  }
)

const PLDonutChart = dynamic(
  () => import("@/components/financials/PLDonutChart").then((m) => ({ default: m.PLDonutChart })),
  {
    ssr: false,
    loading: () => (
      <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
        جاري تحميل الرسم...
      </div>
    ),
  }
)
import { PLTable } from "@/components/financials/PLTable"
import type { PLApiResponse } from "@/app/api/financials/pl/route"

// ─── Date helpers ─────────────────────────────────────────────────────────────

function cairoMonthKey(): string {
  return new Date()
    .toLocaleDateString("sv", { timeZone: "Africa/Cairo" })
    .slice(0, 7)
}

function shiftMonth(monthKey: string, delta: -1 | 1): string {
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PLPage() {
  const today = cairoMonthKey()

  const [selectedMonth, setSelectedMonth] = useState(today)
  const [barPeriod, setBarPeriod] = useState<BarPeriod | null>("6")
  const [barCustomFrom, setBarCustomFrom] = useState("")
  const [barCustomTo, setBarCustomTo] = useState("")
  const [barCustomApplied, setBarCustomApplied] = useState<{ from: string; to: string } | null>(null)
  const [data, setData] = useState<PLApiResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const barQuery = barCustomApplied
        ? `&barFrom=${barCustomApplied.from}&barTo=${barCustomApplied.to}`
        : `&barMonths=${barPeriod ?? "6"}`
      const res = await fetch(`/api/financials/pl?month=${selectedMonth}${barQuery}`)
      if (res.ok) {
        const json: PLApiResponse = await res.json()
        setData(json)
      }
    } finally {
      setLoading(false)
    }
  }, [selectedMonth, barPeriod, barCustomApplied])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ── Bar chart filter handlers ─────────────────────────────────────────────
  function handlePeriodChange(p: BarPeriod) {
    setBarPeriod(p)
    setBarCustomApplied(null)
    setBarCustomFrom("")
    setBarCustomTo("")
  }

  function handleCustomApply(isoFrom: string, isoTo: string) {
    setBarPeriod(null)
    setBarCustomApplied({ from: isoFrom, to: isoTo })
  }

  // ── Print handler ────────────────────────────────────────────────────────
  function handlePrint() {
    window.print()
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      {/* Print-only global styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            @page { margin: 1.5cm; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .print-page-number::after {
              content: "صفحة " counter(page);
              counter-increment: page;
            }
          }
        `,
      }} />

      <div className="flex flex-col gap-5 p-4 md:p-6 print:p-0 print:gap-4">

        {/* ── Header + navigation (hidden in print) ─────────────────────── */}
        <div className="flex items-center justify-between print:hidden">
          <h1 className="text-xl font-bold">الأرباح والخسائر</h1>
          <Button
            size="sm"
            variant="outline"
            className="h-9 gap-1.5"
            onClick={handlePrint}
          >
            <Printer className="h-4 w-4" />
            تصدير PDF
          </Button>
        </div>

        {/* ── Month navigation (hidden in print) ───────────────────────── */}
        <div className="flex items-center gap-1 print:hidden">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setSelectedMonth((m) => shiftMonth(m, -1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="min-w-[150px] text-center text-sm font-semibold">
            {formatMonthLabel(selectedMonth)}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setSelectedMonth((m) => shiftMonth(m, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="mr-2 h-8 text-xs"
            onClick={() => setSelectedMonth(today)}
          >
            الشهر الحالي
          </Button>
        </div>

        {/* ── Loading skeleton (hidden in print) ───────────────────────── */}
        {loading && !data && (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5 print:hidden">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        )}

        {/* ── Content ──────────────────────────────────────────────────── */}
        {data && (
          <>
            {/* Summary cards — hidden in print */}
            <div className="print:hidden">
              <PLSummaryCards summary={data.summary} />
            </div>

            {/* Bar chart — hidden in print */}
            <div className="print:hidden">
              <PLBarChart
                data={data.barChart}
                period={barPeriod}
                onPeriodChange={handlePeriodChange}
                customFrom={barCustomFrom}
                customTo={barCustomTo}
                onCustomFromChange={setBarCustomFrom}
                onCustomToChange={setBarCustomTo}
                onCustomApply={handleCustomApply}
              />
            </div>

            {/* Donut chart — hidden in print */}
            <div className="print:hidden">
              <PLDonutChart expensesByCategory={data.expensesByCategory} />
            </div>

            {/* P&L table — visible on screen AND in print */}
            <PLTable
              summary={data.summary}
              expensesByCategory={data.expensesByCategory}
              month={data.month}
              clinicName={data.clinicName}
              doctorName={data.doctorName}
              doctorSpecialty={data.doctorSpecialty}
              generatedAt={new Date().toLocaleString("ar-EG", {
                timeZone: "Africa/Cairo",
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            />
          </>
        )}
      </div>
    </>
  )
}
