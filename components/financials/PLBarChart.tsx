"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import type { PLBarPoint } from "@/app/api/financials/pl/route"

export type BarPeriod = "6" | "12" | "ytd"

const PERIOD_OPTIONS: { value: BarPeriod; label: string }[] = [
  { value: "6", label: "٦ أشهر" },
  { value: "ytd", label: "هذه السنة" },
  { value: "12", label: "١٢ شهر" },
]

const PERIOD_TITLES: Record<BarPeriod, string> = {
  "6": "الإيرادات مقابل المصروفات — آخر ٦ أشهر",
  ytd: "الإيرادات مقابل المصروفات — هذه السنة",
  "12": "الإيرادات مقابل المصروفات — آخر ١٢ شهرًا",
}

// dd-mm-yyyy → yyyy-mm-dd, or null if invalid
function parseDMY(val: string): string | null {
  const match = val.match(/^(\d{2})-(\d{2})-(\d{4})$/)
  if (!match) return null
  const [, dd, mm, yyyy] = match
  return `${yyyy}-${mm}-${dd}`
}

interface Props {
  data: PLBarPoint[]
  period: BarPeriod | null
  onPeriodChange: (p: BarPeriod) => void
  customFrom: string
  customTo: string
  onCustomFromChange: (v: string) => void
  onCustomToChange: (v: string) => void
  onCustomApply: (isoFrom: string, isoTo: string) => void
}

const COLORS = {
  revenue: "#3b82f6",
  expenses: "#ef4444",
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number; fill: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div
      className="rounded-lg border bg-background p-3 shadow-md text-sm"
      dir="rtl"
    >
      <p className="mb-1.5 font-semibold">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-sm shrink-0"
            style={{ background: entry.fill }}
          />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-medium">
            {entry.value.toLocaleString("ar-EG")} ج.م
          </span>
        </p>
      ))}
    </div>
  )
}

export function PLBarChart({
  data,
  period,
  onPeriodChange,
  customFrom,
  customTo,
  onCustomFromChange,
  onCustomToChange,
  onCustomApply,
}: Props) {
  const hasData = data.some((p) => p.revenue > 0 || p.expenses > 0)
  const title = period
    ? PERIOD_TITLES[period]
    : "الإيرادات مقابل المصروفات — نطاق مخصص"

  function handleApply() {
    const isoFrom = parseDMY(customFrom)
    const isoTo = parseDMY(customTo)
    if (!isoFrom || !isoTo || isoFrom > isoTo) return
    onCustomApply(isoFrom, isoTo)
  }

  const applyEnabled =
    !!parseDMY(customFrom) &&
    !!parseDMY(customTo) &&
    parseDMY(customFrom)! <= parseDMY(customTo)!

  return (
    <Card dir="rtl">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          <div className="flex gap-1 shrink-0">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onPeriodChange(opt.value)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  period === opt.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/70"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* ── Custom date range row ───────────────────────────────────────── */}
        <div className="mb-4 flex items-center justify-end gap-2">
          <div className="flex items-center gap-1.5">
            <span className="shrink-0 text-xs text-muted-foreground">من</span>
            <Input
              value={customFrom}
              onChange={(e) => onCustomFromChange(e.target.value)}
              placeholder="31-12-2025"
              className="h-8 w-32 text-xs"
              dir="ltr"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="shrink-0 text-xs text-muted-foreground">إلى</span>
            <Input
              value={customTo}
              onChange={(e) => onCustomToChange(e.target.value)}
              placeholder="31-12-2025"
              className="h-8 w-32 text-xs"
              dir="ltr"
            />
          </div>
          <button
            onClick={handleApply}
            disabled={!applyEnabled}
            className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-opacity disabled:opacity-40"
          >
            تطبيق
          </button>
        </div>

        {/* ── Chart ──────────────────────────────────────────────────────── */}
        {!hasData ? (
          <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
            لا توجد بيانات في هذه الفترة
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={data}
              margin={{ top: 4, right: 8, left: 8, bottom: 4 }}
              barCategoryGap="25%"
              barGap={2}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}`}
                width={48}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                formatter={(value) => (
                  <span style={{ color: "hsl(var(--foreground))" }}>
                    {value}
                  </span>
                )}
              />
              <Bar
                dataKey="revenue"
                name="الإيرادات"
                fill={COLORS.revenue}
                radius={[3, 3, 0, 0]}
                maxBarSize={40}
              />
              <Bar
                dataKey="expenses"
                name="المصروفات"
                fill={COLORS.expenses}
                radius={[3, 3, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
