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
import type { ChartPoint } from "@/app/api/financials/revenue/route"

interface Props {
  chartData: ChartPoint[]
  compareEnabled: boolean
}

const COLORS = {
  revenue: "#3b82f6",
  convenienceFee: "#f59e0b",
  compareRevenue: "#93c5fd",
  compareConvenienceFee: "#fcd34d",
}

// Custom Arabic tooltip
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
            className="inline-block h-2.5 w-2.5 rounded-sm"
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

export function RevenueChart({ chartData, compareEnabled }: Props) {
  const hasData = chartData.some(
    (p) => p.revenue > 0 || p.convenienceFee > 0
  )

  return (
    <Card dir="rtl">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">
          الإيرادات حسب الفترة
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
            لا توجد إيرادات محصّلة في هذه الفترة
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={chartData}
              margin={{ top: 4, right: 8, left: 8, bottom: 4 }}
              barCategoryGap="25%"
              barGap={2}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
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

              {/* Primary period bars */}
              <Bar
                dataKey="revenue"
                name="الاستشارات"
                fill={COLORS.revenue}
                radius={[3, 3, 0, 0]}
                maxBarSize={40}
              />
              <Bar
                dataKey="convenienceFee"
                name="رسوم الحجز"
                fill={COLORS.convenienceFee}
                radius={[3, 3, 0, 0]}
                maxBarSize={40}
              />

              {/* Compare period bars — only rendered when compare mode is active */}
              {compareEnabled && (
                <>
                  <Bar
                    dataKey="compareRevenue"
                    name="الاستشارات (مقارنة)"
                    fill={COLORS.compareRevenue}
                    radius={[3, 3, 0, 0]}
                    maxBarSize={40}
                  />
                  <Bar
                    dataKey="compareConvenienceFee"
                    name="رسوم الحجز (مقارنة)"
                    fill={COLORS.compareConvenienceFee}
                    radius={[3, 3, 0, 0]}
                    maxBarSize={40}
                  />
                </>
              )}
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
