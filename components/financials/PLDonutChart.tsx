"use client"

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Props {
  expensesByCategory: Record<string, number>
}

const CATEGORY_LABELS: Record<string, string> = {
  rent: "إيجار",
  utilities: "مرافق",
  supplies: "مستلزمات",
  salary: "رواتب",
  equipment: "معدات",
  other: "أخرى",
}

const CATEGORIES = [
  "rent",
  "utilities",
  "supplies",
  "salary",
  "equipment",
  "other",
]

const DONUT_COLORS = [
  "#3b82f6",
  "#f59e0b",
  "#10b981",
  "#8b5cf6",
  "#ef4444",
  "#6b7280",
]

interface TooltipPayloadItem {
  name: string
  value: number
  payload: { percent: number }
}

function DonutTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: TooltipPayloadItem[]
}) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  return (
    <div
      className="rounded-lg border bg-background p-3 shadow-md text-sm"
      dir="rtl"
    >
      <p className="font-semibold mb-1">{item.name}</p>
      <p className="text-muted-foreground">
        {item.value.toLocaleString("ar-EG")} ج.م
      </p>
      <p className="text-muted-foreground">
        {(item.payload.percent * 100).toFixed(1)}% من الإجمالي
      </p>
    </div>
  )
}

export function PLDonutChart({ expensesByCategory }: Props) {
  const total = CATEGORIES.reduce(
    (sum, cat) => sum + (expensesByCategory[cat] ?? 0),
    0
  )
  const donutData = CATEGORIES.filter(
    (cat) => (expensesByCategory[cat] ?? 0) > 0
  ).map((cat) => ({
    name: CATEGORY_LABELS[cat],
    value: expensesByCategory[cat],
    catKey: cat,
    percent: total > 0 ? expensesByCategory[cat] / total : 0,
  }))

  return (
    <Card dir="rtl">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">
          توزيع المصروفات حسب الفئة
        </CardTitle>
      </CardHeader>
      <CardContent>
        {donutData.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
            لا توجد مصروفات في هذه الفترة
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={donutData}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={105}
                paddingAngle={2}
                dataKey="value"
              >
                {donutData.map((entry, index) => (
                  <Cell
                    key={entry.catKey}
                    fill={DONUT_COLORS[index % DONUT_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip content={<DonutTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                formatter={(value) => (
                  <span style={{ color: "hsl(var(--foreground))" }}>
                    {value}
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
