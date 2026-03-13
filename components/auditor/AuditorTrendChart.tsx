"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import type { AuditorLogRow, AuditorFilterType } from "@/types"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function computePct(log: AuditorLogRow, filter: AuditorFilterType): number | null {
  if (filter === "all") {
    return log.discrepancyPct ?? null
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

  if (expected === 0) return null
  return (Math.abs(expected - reported) / expected) * 100
}

function getLineColor(filter: AuditorFilterType): string {
  switch (filter) {
    case "cash":      return "#10b981" // emerald-500
    case "instapay":  return "#a855f7" // purple-500
    case "fawry":     return "#f97316" // orange-500
    case "insurance": return "#0ea5e9" // sky-500
    default:          return "#6366f1" // indigo-500
  }
}

const FILTER_LABELS: Record<AuditorFilterType, string> = {
  all:       "الكل",
  cash:      "نقدي",
  instapay:  "إنستاباي",
  fawry:     "فوري",
  insurance: "تأمين",
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────

type TooltipPayload = {
  value: number
  name: string
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: TooltipPayload[]
  label?: string
}) {
  if (!active || !payload || payload.length === 0) return null
  const pct = payload[0]?.value
  return (
    <div className="rounded-lg border bg-card px-3 py-2 shadow-md text-sm">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="font-semibold tabular-nums">
        {typeof pct === "number" ? `${pct.toFixed(1)}٪` : "—"}
      </p>
    </div>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  history: AuditorLogRow[]
  activeFilter: AuditorFilterType
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AuditorTrendChart({ history, activeFilter }: Props) {
  // Oldest-first for the chart x-axis
  const chartData = [...history]
    .reverse()
    .map((log) => {
      const pct = computePct(log, activeFilter)
      return {
        date: new Date(log.date).toLocaleDateString("ar-EG", {
          month: "short",
          day: "numeric",
          timeZone: "Africa/Cairo",
        }),
        pct: pct !== null ? parseFloat(pct.toFixed(1)) : null,
      }
    })
    .filter((d) => d.pct !== null) as { date: string; pct: number }[]

  const lineColor = getLineColor(activeFilter)
  const filterLabel = FILTER_LABELS[activeFilter]

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">
            اتجاه الفارق — آخر 30 يوماً
          </h3>
          <span className="text-xs text-muted-foreground">{filterLabel}</span>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length < 2 ? (
          <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
            لا توجد بيانات كافية لعرض الاتجاه
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart
              data={chartData}
              margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => `${v}٪`}
                width={38}
                domain={[0, "auto"]}
              />
              {/* Reference lines for thresholds */}
              <ReferenceLine y={5}  stroke="#f59e0b" strokeDasharray="4 4" strokeWidth={1} />
              <ReferenceLine y={15} stroke="#ef4444" strokeDasharray="4 4" strokeWidth={1} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="pct"
                name={filterLabel}
                stroke={lineColor}
                strokeWidth={2}
                dot={{ fill: lineColor, r: 3 }}
                activeDot={{ r: 5 }}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
        <p className="mt-2 text-xs text-muted-foreground text-center">
          الخط الأصفر = 5٪ • الخط الأحمر = 15٪
        </p>
      </CardContent>
    </Card>
  )
}
