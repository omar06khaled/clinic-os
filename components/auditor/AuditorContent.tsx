"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { useTranslations } from "next-intl"
import dynamic from "next/dynamic"
import DisclaimerBanner from "@/components/auditor/DisclaimerBanner"
import ReconciliationCard from "@/components/auditor/ReconciliationCard"
import DiscrepancyResult from "@/components/auditor/DiscrepancyResult"
import AuditorHistory from "@/components/auditor/AuditorHistory"

import { getStatus } from "@/components/auditor/DiscrepancyResult"
import type {
  AuditorExpectedData,
  AuditorDiscrepancyData,
  AuditorSectionResult,
  AuditorLogRow,
  AuditorReportedValues,
  AuditorFilterType,
} from "@/types"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function computeSection(expected: number, reported: number): AuditorSectionResult {
  const diff = expected - reported
  const pct  = expected === 0 ? null : (Math.abs(diff) / expected) * 100
  return { expected, reported, diff, pct }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AuditorContent() {
  const t = useTranslations("auditor")

  const AuditorTrendChart = dynamic(
    () => import("@/components/auditor/AuditorTrendChart"),
    {
      ssr: false,
      loading: () => (
        <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
          {t("loadingChart")}
        </div>
      ),
    }
  )

  const [expectedData, setExpectedData]   = useState<AuditorExpectedData | null>(null)
  const [loadingExpected, setLoadingExpected] = useState(true)

  const [result, setResult]         = useState<AuditorDiscrepancyData | null>(null)
  const [calculating, setCalculating] = useState(false)

  const [history, setHistory]           = useState<AuditorLogRow[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)

  const [activeFilter, setActiveFilter] = useState<AuditorFilterType>("all")

  // ── Fetch today's expected amounts ─────────────────────────
  useEffect(() => {
    fetch("/api/auditor/expected")
      .then((r) => r.json())
      .then((d: AuditorExpectedData) => setExpectedData(d))
      .catch(() => toast.error(t("toastExpectedError")))
      .finally(() => setLoadingExpected(false))
  }, [t])

  // ── Fetch 30-day history ────────────────────────────────────
  const fetchHistory = useCallback(() => {
    setLoadingHistory(true)
    fetch("/api/auditor")
      .then((r) => r.json())
      .then((d: AuditorLogRow[]) => setHistory(Array.isArray(d) ? d : []))
      .catch(() => toast.error(t("toastHistoryError")))
      .finally(() => setLoadingHistory(false))
  }, [t])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  // ── Calculate & save ────────────────────────────────────────
  async function handleCalculate(reported: AuditorReportedValues) {
    if (!expectedData) return
    setCalculating(true)

    const cash      = computeSection(expectedData.cash.totalEGP,      reported.cash)
    const instapay  = computeSection(expectedData.instapay.totalEGP,  reported.instapay)
    const fawry     = computeSection(expectedData.fawry.totalEGP,     reported.fawry)
    const insurance = computeSection(expectedData.insurance.totalEGP, reported.insurance)

    // Insurance is excluded from the overall cash reconciliation total —
    // insurance payments are settled externally and no cash is collected at the desk.
    const totalExpected = cash.expected + instapay.expected + fawry.expected
    const totalReported = cash.reported + instapay.reported + fawry.reported
    const totalDiff     = totalExpected - totalReported
    const overallPct    =
      totalExpected === 0
        ? null
        : (Math.abs(totalDiff) / totalExpected) * 100

    const overall: AuditorSectionResult = {
      expected: totalExpected,
      reported: totalReported,
      diff:     totalDiff,
      pct:      overallPct,
    }

    const discrepancyData: AuditorDiscrepancyData = {
      overall,
      cash,
      instapay,
      fawry,
      insurance,
      patientsExpected: expectedData.patientsExpected,
    }

    setResult(discrepancyData)

    const cairoDate = new Date().toLocaleDateString("sv", {
      timeZone: "Africa/Cairo",
    })

    try {
      const res = await fetch("/api/auditor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date:                 cairoDate,
          patientsExpected:     expectedData.patientsExpected,
          expectedCashEGP:      cash.expected,
          reportedCashEGP:      cash.reported,
          expectedInstapayEGP:  instapay.expected,
          reportedInstapayEGP:  instapay.reported,
          expectedFawryEGP:     fawry.expected,
          reportedFawryEGP:     fawry.reported,
          expectedInsuranceEGP: insurance.expected,
          reportedInsuranceEGP: insurance.reported,
          discrepancyEGP:       Math.abs(totalDiff),
          discrepancyPct:       overallPct ?? 0,
          status:               getStatus(overallPct),
        }),
      })
      if (!res.ok) throw new Error()
      fetchHistory()
    } catch {
      toast.error(t("toastSaveError"))
    }

    setCalculating(false)
  }

  // ── Render ──────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6 p-6" dir="rtl">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold">{t("pageTitle")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("pageSubtitle")}
        </p>
      </div>

      {/* ① Disclaimer — always first, cannot be dismissed */}
      <DisclaimerBanner />

      {/* ② Reconciliation input card */}
      <ReconciliationCard
        expectedData={expectedData}
        loading={loadingExpected}
        onCalculate={handleCalculate}
        calculating={calculating}
      />

      {/* ③ Overall result + per-section breakdown — shown only after Calculate */}
      {result && <DiscrepancyResult result={result} />}

      {/* ④ 30-day history: filter chips + table + chart */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold">{t("historyTitle")}</h2>
        <AuditorHistory
          history={history}
          loading={loadingHistory}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />
        <AuditorTrendChart history={history} activeFilter={activeFilter} />
      </section>
    </div>
  )
}
