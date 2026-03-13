"use client"

import type { AuditorLogRow, AuditorFilterType } from "@/types"

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FILTER_LABELS: { key: AuditorFilterType; label: string }[] = [
  { key: "all",       label: "الكل"      },
  { key: "cash",      label: "نقدي"      },
  { key: "instapay",  label: "إنستاباي" },
  { key: "fawry",     label: "فوري"      },
  { key: "insurance", label: "تأمين"     },
]

const STATUS_DOT: Record<string, string> = {
  green: "bg-green-500",
  amber: "bg-amber-500",
  red:   "bg-red-500",
}

function fmt(n: number | null | undefined) {
  if (n == null || isNaN(n)) return "—"
  return n.toLocaleString("ar-EG")
}

function computeFilteredValues(
  log: AuditorLogRow,
  filter: AuditorFilterType
): { expected: number; reported: number; pct: number | null; status: string } {
  if (filter === "all") {
    return {
      expected: (log.expectedCashEGP ?? 0) + (log.expectedInstapayEGP ?? 0) + (log.expectedFawryEGP ?? 0) + (log.expectedInsuranceEGP ?? 0),
      reported: (log.reportedCashEGP ?? 0) + (log.reportedInstapayEGP ?? 0) + (log.reportedFawryEGP ?? 0) + (log.reportedInsuranceEGP ?? 0),
      pct: log.discrepancyPct ?? null,
      status: log.status,
    }
  }

  let expected = 0
  let reported = 0

  if (filter === "cash") {
    expected = log.expectedCashEGP ?? 0
    reported = log.reportedCashEGP ?? 0
  } else if (filter === "instapay") {
    expected = log.expectedInstapayEGP ?? 0
    reported = log.reportedInstapayEGP ?? 0
  } else if (filter === "fawry") {
    expected = log.expectedFawryEGP ?? 0
    reported = log.reportedFawryEGP ?? 0
  } else if (filter === "insurance") {
    expected = log.expectedInsuranceEGP ?? 0
    reported = log.reportedInsuranceEGP ?? 0
  }

  const pct = expected === 0 ? null : (Math.abs(expected - reported) / expected) * 100
  const status = pct === null || pct < 5 ? "green" : pct <= 15 ? "amber" : "red"

  return { expected, reported, pct, status }
}

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  history: AuditorLogRow[]
  loading: boolean
  activeFilter: AuditorFilterType
  onFilterChange: (f: AuditorFilterType) => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AuditorHistory({
  history,
  loading,
  activeFilter,
  onFilterChange,
}: Props) {
  return (
    <div className="space-y-3">
      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        {FILTER_LABELS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => onFilterChange(key)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              activeFilter === key
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-muted-foreground text-xs">
                <th className="px-4 py-2.5 text-right font-medium">التاريخ</th>
                <th className="px-4 py-2.5 text-right font-medium">المتوقع (ج.م)</th>
                <th className="px-4 py-2.5 text-right font-medium">المُبلَّغ عنه (ج.م)</th>
                <th className="px-4 py-2.5 text-right font-medium">نسبة الفارق</th>
                <th className="px-4 py-2.5 text-center font-medium">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    {Array.from({ length: 5 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-3 animate-pulse rounded bg-muted" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : history.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-sm text-muted-foreground"
                  >
                    لا توجد سجلات مطابقة خلال آخر 30 يوماً
                  </td>
                </tr>
              ) : (
                history.map((log) => {
                  const { expected, reported, pct, status } =
                    computeFilteredValues(log, activeFilter)

                  const date = new Date(log.date).toLocaleDateString("ar-EG", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    timeZone: "Africa/Cairo",
                  })

                  return (
                    <tr
                      key={log.id}
                      className="border-b last:border-0 hover:bg-muted/20 transition-colors"
                    >
                      <td className="px-4 py-3 tabular-nums text-sm">{date}</td>
                      <td className="px-4 py-3 tabular-nums font-medium">
                        {fmt(expected)}
                      </td>
                      <td className="px-4 py-3 tabular-nums font-medium">
                        {fmt(reported)}
                      </td>
                      <td className="px-4 py-3 tabular-nums">
                        {pct === null ? (
                          <span className="text-muted-foreground text-xs">
                            لا توجد بيانات
                          </span>
                        ) : (
                          <span
                            className={
                              status === "green"
                                ? "text-green-700 font-semibold"
                                : status === "amber"
                                ? "text-amber-700 font-semibold"
                                : "text-red-700 font-semibold"
                            }
                          >
                            {pct.toFixed(1)}٪
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block h-2.5 w-2.5 rounded-full ${
                            STATUS_DOT[status] ?? "bg-muted"
                          }`}
                          title={status}
                        />
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
